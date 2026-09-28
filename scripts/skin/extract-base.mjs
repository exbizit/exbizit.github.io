#!/usr/bin/env node
/**
 * Dumps Webamp's built-in default skin as JSON: every sprite's sheet, position
 * and pixels (PNG, base64). The bundle ships the skin pre-sliced into CSS, so
 * this reads the sprite map, the sprite -> CSS selector map and the compiled
 * CSS straight out of it. build-skin.py reassembles the sheets from this.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const src = readFileSync(require.resolve('webamp').replace(/[^/]+$/, 'webamp.bundle.js'), 'utf8')

/** Source text of the `{...}` literal that follows `marker`. */
function literalAfter(marker) {
  const start = src.indexOf(marker)
  if (start < 0) throw new Error(`not found: ${marker}`)
  const open = src.indexOf('{', start)
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}' && --depth === 0) return src.slice(open, i + 1)
  }
  throw new Error(`unbalanced: ${marker}`)
}

// The TEXT sheet's sprites are generated from FONT_LOOKUP, so run that too
const fontStart = src.indexOf('const FONT_LOOKUP = {')
const fontEnd = src.indexOf('const sprites = {')
const ctx = vm.createContext({ UTF8_ELLIPSIS: "\u2026" })
vm.runInContext(
  `${src.slice(fontStart, fontEnd)}
   var sheets = ${literalAfter('const sprites = {')};
   var selectors = ${literalAfter('const imageSelectors = {')};
   var LETTERS = []; Object.keys(FONT_LOOKUP).forEach(c => { selectors[imageConstFromChar(c)] = ['.character-' + c.charCodeAt(0)] });`,
  ctx
)
const { sheets, selectors } = ctx

const cssStart = src.indexOf('var css_248z = ')
const css = vm.runInNewContext(src.slice(cssStart + 'var css_248z = '.length, src.indexOf('\n', cssStart)).replace(/;\s*$/, ''))

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const out = {}
let missing = 0
for (const [sheet, sprites] of Object.entries(sheets)) {
  out[sheet] = []
  for (const s of sprites) {
    let png = null
    for (const sel of selectors[s.name] ?? []) {
      const m = css.match(new RegExp(`#webamp ${esc(sel)} \\{background-image: url\\(data:image/png;base64,([^)]+)\\)`))
      if (m) { png = m[1]; break }
    }
    if (!png) missing++
    out[sheet].push({ ...s, png })
  }
}
process.stderr.write(`${Object.keys(out).length} sheets, ${missing} sprites without pixels\n`)
process.stdout.write(JSON.stringify(out))
