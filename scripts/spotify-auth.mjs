#!/usr/bin/env node
/**
 * One-time helper: gets a Spotify refresh token without any manual URL wrangling.
 *
 * The refresh token is the awkward part of Spotify auth — it only comes back once,
 * from a browser round-trip. This script runs a throwaway local server, catches the
 * redirect, does the token exchange, and writes the result into .env.local for you.
 *
 * ── Before running, in the Spotify dashboard ────────────────────────────────
 *   1. developer.spotify.com/dashboard -> your app -> Settings
 *   2. Under "Redirect URIs" add EXACTLY:   http://127.0.0.1:8888/callback
 *      (127.0.0.1, not localhost — Spotify matches the string exactly)
 *   3. Save. Copy the Client ID and Client Secret into .env.local
 *
 * ── Then ────────────────────────────────────────────────────────────────────
 *   npm run spotify-auth
 *
 * It prints a URL. Open it, approve, and the script writes
 * SPOTIFY_REFRESH_TOKEN into .env.local and exits.
 */

import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { randomBytes } from 'node:crypto'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ENV = join(root, '.env.local')

const PORT = 8888
const REDIRECT = `http://127.0.0.1:${PORT}/callback`
const SCOPES = 'user-top-read'

function env(key) {
  if (process.env[key]) return process.env[key]
  try {
    const m = readFileSync(ENV, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))
    if (m && m[1].trim()) return m[1].trim()
  } catch { /* no file */ }
  return null
}

/** Writes key=value into .env.local, replacing an existing line if present. */
function setEnv(key, value) {
  let text = ''
  try { text = readFileSync(ENV, 'utf8') } catch { /* create it */ }
  const line = `${key}=${value}`
  text = new RegExp(`^${key}=.*$`, 'm').test(text)
    ? text.replace(new RegExp(`^${key}=.*$`, 'm'), line)
    : text.trimEnd() + `\n${line}\n`
  writeFileSync(ENV, text)
}

const id = env('SPOTIFY_CLIENT_ID')
const secret = env('SPOTIFY_CLIENT_SECRET')

if (!id || !secret) {
  console.error('\nSet these in .env.local first:')
  if (!id) console.error('  SPOTIFY_CLIENT_ID')
  if (!secret) console.error('  SPOTIFY_CLIENT_SECRET')
  console.error('\nBoth are on your app page at developer.spotify.com/dashboard')
  process.exit(1)
}

const state = randomBytes(8).toString('hex')

const authUrl =
  'https://accounts.spotify.com/authorize?' +
  new URLSearchParams({
    client_id: id,
    response_type: 'code',
    redirect_uri: REDIRECT,
    scope: SCOPES,
    state,
    show_dialog: 'true',
  })

const page = (title, body) =>
  `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
  `<body style="background:#000;color:#fff;font:15px/1.6 system-ui;display:flex;` +
  `align-items:center;justify-content:center;height:100vh;margin:0;text-align:center">` +
  `<div><h1 style="font-weight:600;font-size:1.3rem">${title}</h1><p style="color:#8C8C8C">${body}</p></div>`

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  if (url.pathname !== '/callback') {
    res.writeHead(404).end()
    return
  }

  const err = url.searchParams.get('error')
  const code = url.searchParams.get('code')
  const returned = url.searchParams.get('state')

  const fail = msg => {
    res.writeHead(400, { 'Content-Type': 'text/html' }).end(page('Failed', msg))
    console.error(`\n${msg}`)
    server.close()
    process.exit(1)
  }

  if (err) return fail(`Spotify returned: ${err}`)
  if (returned !== state) return fail('State mismatch — possible CSRF. Run it again.')
  if (!code) return fail('No authorization code in the redirect.')

  try {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT,
      }),
    })
    const body = await r.text()
    if (!r.ok) return fail(`Token exchange ${r.status}: ${body.slice(0, 300)}`)

    const data = JSON.parse(body)
    if (!data.refresh_token) return fail(`No refresh_token in response: ${body.slice(0, 300)}`)

    setEnv('SPOTIFY_REFRESH_TOKEN', data.refresh_token)

    res.writeHead(200, { 'Content-Type': 'text/html' }).end(
      page('Connected', 'Refresh token saved to .env.local. You can close this tab.')
    )
    console.log('\n  Refresh token saved to .env.local')
    console.log(`  Granted scopes: ${data.scope || '(none reported)'}`)
    console.log('\n  Next:  npm run listening -- --dry')
    server.close()
    process.exit(0)
  } catch (e) {
    fail(e.message)
  }
})

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Close whatever is using it and retry.`)
  } else {
    console.error(`\n${e.message}`)
  }
  process.exit(1)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n  Waiting for you to approve access.\n')
  console.log('  1. Make sure this EXACT redirect URI is saved in your Spotify app settings:')
  console.log(`       ${REDIRECT}`)
  console.log('\n  2. Open this URL in your browser:\n')
  console.log(`  ${authUrl}\n`)
})
