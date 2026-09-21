/**
 * Community board API.
 *
 *   GET    /posts?before=<id>   newest 50 visible posts (older page with `before`)
 *   POST   /posts               { name, message, token, color?, icon? }  -> the new post
 *   POST   /posts/<id>/react    { kind }  toggle this visitor's reaction -> { reactions, mine }
 *   DELETE /posts/<id>          hide a post; needs  Authorization: Bearer <ADMIN_TOKEN>
 *
 * Every post passes, in order: Turnstile bot check, length limits, rate limits,
 * then the deterministic vulgarity/link filter (filter.js). Passing posts
 * appear immediately.
 */
import { checkText } from './filter.js'

const PAGE = 50
const MAX_NAME = 40
const MAX_MESSAGE = 500
const MIN_GAP_MS = 30_000          // one post per 30s per visitor
const HOURLY_MAX = 5               // and at most 5 per hour

// Optional flair. Only these ids are accepted; anything else is stored as null.
// Keep in sync with COLORS / ICONS in src/data/board.ts on the site.
const COLORS = new Set(['toaster', 'ember', 'grape', 'lime', 'amber', 'bubblegum', 'sky', 'bone'])
const ICONS = new Set(['sparkle', 'heart', 'star', 'moon', 'notes', 'flower', 'sun', 'skull', 'peace', 'bolt'])
// Keep in sync with REACTIONS in src/data/board.ts on the site.
const REACTIONS = new Set(['plus1', 'heart', 'star', 'notes', 'skull'])
const REACTIONS_HOURLY_MAX = 100   // per visitor

const MESSAGES = {
  bot: 'Could not verify you are human. Reload the page and try again.',
  name: `Add a name (up to ${MAX_NAME} characters).`,
  message: `Write a message (up to ${MAX_MESSAGE} characters).`,
  slow: 'You just posted. Wait a moment before posting again.',
  hourly: 'Posting limit reached. Try again in an hour.',
  vulgar: 'That message has language the board doesn’t allow. Rephrase and try again.',
  link: 'Links aren’t allowed on the board.',
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') ?? ''
    const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim())
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] ?? '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      Vary: 'Origin',
    }
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...cors },
      })

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] !== 'posts') return json({ error: 'Not found' }, 404)

    try {
      if (req.method === 'GET' && parts.length === 1) return json(await list(req, env, url))
      if (req.method === 'POST' && parts.length === 3 && parts[2] === 'react')
        return await react(req, env, json, parts[1])
      if (req.method === 'POST' && parts.length === 1) return await create(req, env, json)
      if (req.method === 'DELETE' && parts.length === 2) return await hide(req, env, json, parts[1])
      return json({ error: 'Not found' }, 404)
    } catch (e) {
      console.error(e)
      return json({ error: 'Something went wrong. Try again later.' }, 500)
    }
  },
}

async function list(req, env, url) {
  const before = Number(url.searchParams.get('before')) || Number.MAX_SAFE_INTEGER
  const { results } = await env.DB.prepare(
    'SELECT id, name, message, created_at, color, icon FROM posts WHERE hidden = 0 AND id < ? ORDER BY id DESC LIMIT ?'
  )
    .bind(before, PAGE)
    .all()
  const ipHash = await visitorHash(req, env)
  const counts = await reactionCounts(env, results.map(p => p.id), ipHash)
  const posts = results.map(p => ({ ...p, ...(counts.get(p.id) ?? { reactions: {}, mine: [] }) }))
  return { posts, more: results.length === PAGE }
}

/** { reactions: {kind: n}, mine: [kind] } per post id, for this visitor. */
async function reactionCounts(env, ids, ipHash) {
  const out = new Map()
  if (ids.length === 0) return out
  const marks = ids.map(() => '?').join(',')
  const { results } = await env.DB.prepare(
    `SELECT post_id, kind, COUNT(*) AS n, SUM(ip_hash = ?) AS mine FROM reactions WHERE post_id IN (${marks}) GROUP BY post_id, kind`
  )
    .bind(ipHash, ...ids)
    .all()
  for (const r of results) {
    const entry = out.get(r.post_id) ?? { reactions: {}, mine: [] }
    entry.reactions[r.kind] = r.n
    if (r.mine) entry.mine.push(r.kind)
    out.set(r.post_id, entry)
  }
  return out
}

async function react(req, env, json, idRaw) {
  const id = Number(idRaw)
  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad request' }, 400)
  }
  if (!Number.isInteger(id) || !REACTIONS.has(body.kind)) return json({ error: 'Bad request' }, 400)

  const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ? AND hidden = 0').bind(id).first()
  if (!post) return json({ error: 'That message is gone.' }, 404)

  const ipHash = await visitorHash(req, env)
  const now = Date.now()
  const existing = await env.DB.prepare(
    'SELECT 1 AS x FROM reactions WHERE post_id = ? AND kind = ? AND ip_hash = ?'
  )
    .bind(id, body.kind, ipHash)
    .first()

  if (existing) {
    await env.DB.prepare('DELETE FROM reactions WHERE post_id = ? AND kind = ? AND ip_hash = ?')
      .bind(id, body.kind, ipHash)
      .run()
  } else {
    const recent = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM reactions WHERE ip_hash = ? AND created_at > ?'
    )
      .bind(ipHash, now - 3_600_000)
      .first()
    if ((recent?.n ?? 0) >= REACTIONS_HOURLY_MAX)
      return json({ error: 'Easy there! Too many reactions. Try again later.' }, 429)
    await env.DB.prepare(
      'INSERT OR IGNORE INTO reactions (post_id, kind, ip_hash, created_at) VALUES (?, ?, ?, ?)'
    )
      .bind(id, body.kind, ipHash, now)
      .run()
  }

  const counts = await reactionCounts(env, [id], ipHash)
  return json(counts.get(id) ?? { reactions: {}, mine: [] })
}

/** Salted hash of the visitor's IP: stable per visitor, never the raw address. */
function visitorHash(req, env) {
  return sha256(`${env.TURNSTILE_SECRET}:${req.headers.get('CF-Connecting-IP') ?? ''}`)
}

async function create(req, env, json) {
  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad request' }, 400)
  }
  const ip = req.headers.get('CF-Connecting-IP') ?? ''
  const name = String(body.name ?? '').replace(/\s+/g, ' ').trim()
  const message = String(body.message ?? '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  const fail = (code, status = 400) => json({ error: MESSAGES[code], code }, status)
  const color = COLORS.has(body.color) ? body.color : null
  const icon = ICONS.has(body.icon) ? body.icon : null

  // 1. Bot check
  if (!(await turnstileOk(env, body.token, ip))) return fail('bot', 403)

  // 2. Lengths
  if (!name || name.length > MAX_NAME) return fail('name')
  if (!message || message.length > MAX_MESSAGE) return fail('message')

  // 3. Rate limits, keyed on a salted hash so raw IPs are never stored
  const ipHash = await visitorHash(req, env)
  const now = Date.now()
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS n, MAX(created_at) AS last FROM posts WHERE ip_hash = ? AND created_at > ?'
  )
    .bind(ipHash, now - 3_600_000)
    .first()
  if (recent?.last && now - recent.last < MIN_GAP_MS) return fail('slow', 429)
  if ((recent?.n ?? 0) >= HOURLY_MAX) return fail('hourly', 429)

  // 4. Deterministic filter, on the name as well as the message
  const problem = checkText(name) ?? checkText(message)
  if (problem) return fail(problem)

  const row = await env.DB.prepare(
    'INSERT INTO posts (name, message, created_at, ip_hash, color, icon) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, name, message, created_at, color, icon'
  )
    .bind(name, message, now, ipHash, color, icon)
    .first()
  return json({ post: row }, 201)
}

async function hide(req, env, json, id) {
  const auth = req.headers.get('Authorization') ?? ''
  if (!env.ADMIN_TOKEN || auth !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'Unauthorized' }, 401)
  await env.DB.prepare('UPDATE posts SET hidden = 1 WHERE id = ?').bind(Number(id)).run()
  return json({ ok: true })
}

async function turnstileOk(env, token, ip) {
  if (!token || !env.TURNSTILE_SECRET) return false
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })
  const data = await res.json()
  return data.success === true
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}
