#!/usr/bin/env node
/**
 * Pulls every band's Bandcamp catalogue into src/data/bandcamp.generated.json:
 * each release's title, art and tracklist (titles, durations, track ids).
 *
 * The HosterAmp player (Webamp) builds its playlist from this file. It stores
 * no audio URLs: Bandcamp's stream links expire after about a day, so
 * scripts/sync-bandcamp-streams.mjs pushes fresh ones to the Worker every 6h.
 *
 * Usage:  npm run bandcamp           # fetch and write
 *         npm run bandcamp -- --dry  # print, write nothing
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'src/data/bandcamp.generated.json')
const DRY = process.argv.includes('--dry')
// A full browser user-agent gets a page variant without the embedded track data
const UA = 'Mozilla/5.0'
const sleep = ms => new Promise(r => setTimeout(r, ms))

function bandsFromSource() {
  const src = readFileSync(join(root, 'src/data/bands.ts'), 'utf8')
  const body = src.slice(src.indexOf('export const BANDS'))
  return body
    .split(/\n\s+slug: '/)
    .slice(1)
    .map(b => ({
      slug: b.slice(0, b.indexOf("'")),
      sub: b.match(/https:\/\/([a-z0-9-]+)\.bandcamp\.com/)?.[1] ?? null,
    }))
    .filter(b => b.sub)
}

const unescapeHtml = s =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return { html: await res.text(), url: res.url }
}

/** Release URLs on <sub>.bandcamp.com. A one-release band redirects /music straight to it. */
async function releaseUrls(sub) {
  const base = `https://${sub}.bandcamp.com`
  const { html, url } = await get(`${base}/music`)
  if (/\/(album|track)\//.test(new URL(url).pathname)) return [url.split('?')[0]]
  const paths = [...new Set([...html.matchAll(/href="(\/(?:album|track)\/[a-z0-9-]+)"/g)].map(m => m[1]))]
  return paths.map(p => base + p)
}

async function release(url) {
  const { html } = await get(url)
  const m = html.match(/data-tralbum="([^"]+)"/)
  if (!m) throw new Error(`no tralbum data on ${url}`)
  const d = JSON.parse(unescapeHtml(m[1]))
  const tracks = d.trackinfo
    .filter(t => t.file?.['mp3-128'])
    .map(t => ({ id: t.track_id ?? t.id, num: t.track_num ?? 1, title: t.title, duration: Math.round(t.duration) }))
  return {
    url,
    title: d.current?.title ?? '',
    artist: d.artist ?? '',
    date: d.current?.release_date ? new Date(d.current.release_date).toISOString().slice(0, 10) : null,
    art: d.art_id ? `https://f4.bcbits.com/img/a${d.art_id}_10.jpg` : null,
    tracks,
  }
}

const bands = {}
for (const b of bandsFromSource()) {
  try {
    const urls = await releaseUrls(b.sub)
    const out = []
    for (const u of urls) {
      try {
        const r = await release(u)
        if (r.tracks.length) out.push(r)
      } catch (e) {
        console.warn(`  ! ${e.message}`)
      }
      await sleep(400)
    }
    out.sort((a, c) => (c.date ?? '').localeCompare(a.date ?? ''))
    bands[b.slug] = out
    console.log(`${b.slug}: ${out.length} releases, ${out.reduce((n, r) => n + r.tracks.length, 0)} streamable tracks`)
  } catch (e) {
    console.warn(`${b.slug}: ${e.message}`)
  }
}

const json = JSON.stringify({ updated: new Date().toISOString(), bands }, null, 2) + '\n'
if (DRY) console.log(json)
else writeFileSync(OUT, json)
