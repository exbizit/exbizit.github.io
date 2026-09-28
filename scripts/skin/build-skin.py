#!/usr/bin/env python3
"""
Builds public/skins/hosteramp.wsz, the HosterAmp skin for Webamp.

It starts from Webamp's own default skin (extract-base.mjs pulls it out of the
installed bundle, so nothing is downloaded), reassembles the Winamp sprite
sheets, then:

  - recolours everything: the navy greys become a blue chrome ramp, the gold
    trim becomes polished silver, the green LCD turns electric periwinkle and
    the EQ sliders run cyan -> violet instead of green -> red
  - repaints the title bars with our own pixel lettering (HOSTERAMP etc.)
  - writes viscolor.txt / pledit.txt to match

Needs Pillow.  Usage:  python3 scripts/skin/build-skin.py
"""
import base64
import colorsys
import io
import json
import subprocess
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/skins/hosteramp.wsz'

# ── palette ────────────────────────────────────────────────────────────────
# Neutral ramp: luminance in, blue-tinted chrome out. Near-black stays a deep
# LCD navy so the displays keep reading as screens.
CHROME = [
    (0.00, (2, 3, 10)),
    (0.10, (10, 13, 34)),
    (0.22, (34, 40, 92)),
    (0.38, (78, 88, 168)),
    (0.58, (150, 160, 222)),
    (0.80, (214, 220, 250)),
    (1.00, (255, 255, 255)),
]
# Saturated LCD greens become this glow
ELECTRIC = [
    (0.00, (0, 0, 0)),
    (0.45, (60, 78, 255)),
    (0.75, (130, 148, 255)),
    (1.00, (225, 232, 255)),
]
LCD_TEXT = (150, 164, 255)
LCD_BG = (4, 6, 18)


def ramp(stops, t):
    t = max(0.0, min(1.0, t))
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0) if t1 > t0 else 0
            return tuple(round(a + (b - a) * k) for a, b in zip(c0, c1))
    return stops[-1][1]


def recolor_pixel(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    hue = h * 360
    if s < 0.28 or v < 0.08:
        # greys and navies: lift a little so panels read as metal, not void
        return ramp(CHROME, lum ** 0.8 * 1.12)
    if 20 <= hue <= 50:
        # the default skin's gold trim -> silver
        return ramp(CHROME, 0.35 + lum * 0.75)
    if 95 <= hue <= 150:
        # LCD green -> electric periwinkle
        return ramp(ELECTRIC, v)
    if hue <= 95 or hue >= 330:
        # EQ bars and warm accents: remap green..red onto cyan..violet
        k = min(hue if hue <= 95 else 0, 95) / 95  # 1 = green end, 0 = red end
        nh = (285 - k * 95) / 360
        nr, ng, nb = colorsys.hsv_to_rgb(nh, min(1, s * 0.95), v)
        return round(nr * 255), round(ng * 255), round(nb * 255)
    # blues and anything else: pull towards the periwinkle
    nr, ng, nb = colorsys.hsv_to_rgb(232 / 360, min(1, s), v)
    return round(nr * 255), round(ng * 255), round(nb * 255)


def recolor(img):
    img = img.convert('RGB')
    px = img.load()
    cache = {}
    for y in range(img.height):
        for x in range(img.width):
            c = px[x, y]
            if c not in cache:
                cache[c] = recolor_pixel(*c)
            px[x, y] = cache[c]
    return img


# ── pixel lettering ────────────────────────────────────────────────────────
# 5x5 caps, drawn by hand for the title bars
GLYPHS = {
    'A': ['01110', '10001', '11111', '10001', '10001'],
    'E': ['11111', '10000', '11110', '10000', '11111'],
    'H': ['10001', '10001', '11111', '10001', '10001'],
    'I': ['11111', '00100', '00100', '00100', '11111'],
    'L': ['10000', '10000', '10000', '10000', '11111'],
    'M': ['10001', '11011', '10101', '10001', '10001'],
    'O': ['01110', '10001', '10001', '10001', '01110'],
    'P': ['11110', '10001', '11110', '10000', '10000'],
    'Q': ['01110', '10001', '10101', '10010', '01101'],
    'R': ['11110', '10001', '11110', '10010', '10001'],
    'S': ['01111', '10000', '01110', '00001', '11110'],
    'T': ['11111', '00100', '00100', '00100', '00100'],
    'U': ['10001', '10001', '10001', '10001', '01110'],
    'Y': ['10001', '01010', '00100', '00100', '00100'],
    'Z': ['11111', '00010', '00100', '01000', '11111'],
    '/': ['00001', '00010', '00100', '01000', '10000'],
    ' ': ['000', '000', '000', '000', '000'],
}


def text_width(text):
    return sum(len(GLYPHS[c][0]) + 1 for c in text) - 1


def draw_text(img, x, y, text, color):
    px = img.load()
    for c in text:
        rows = GLYPHS[c]
        for dy, row in enumerate(rows):
            for dx, bit in enumerate(row):
                if bit == '1':
                    px[x + dx, y + dy] = color
        x += len(rows[0]) + 1


def text_span(img, box, window):
    """Columns holding the stock title text (bright, unsaturated pixels).

    Only searched within `window` (offsets into the bar): the grip lines either
    side of the lettering are light too, and must survive.
    """
    x0, y0, w, h = box
    px = img.load()
    cols = []
    for x in range(x0 + window[0], x0 + window[1]):
        for y in range(y0 + 2, y0 + h - 2):
            r, g, b = px[x, y][:3]
            if min(r, g, b) > 150 and max(r, g, b) - min(r, g, b) < 60:
                cols.append(x)
                break
    return (min(cols), max(cols)) if cols else None


def retitle(img, box, text, active, span, min_x, max_x):
    """Draw `text` as a boxed LCD label where the stock title lettering was."""
    x0, y0, w, h = box
    cx = (span[0] + span[1]) // 2 if span else x0 + w // 2
    tw = text_width(text)
    left = max(cx - tw // 2 - 4, min_x)
    right = min(left + tw + 8, max_x)
    px = img.load()
    top = y0 + (h - 9) // 2
    edge_hi, edge_lo = (235, 240, 255), (40, 46, 100)
    for x in range(left, right + 1):
        for y in range(top, top + 9):
            px[x, y] = LCD_BG
        px[x, top] = edge_lo
        px[x, top + 8] = edge_hi
    for y in range(top, top + 9):
        px[left, y] = edge_lo
        px[right, y] = edge_hi
    draw_text(img, left + 4, top + 2, text, LCD_TEXT if active else (70, 80, 150))


def main():
    base = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts/skin/extract-base.mjs')]))

    sheets, where = {}, {}
    for sheet, sprites in base.items():
        W = max(s['x'] + s['width'] for s in sprites)
        H = max(s['y'] + s['height'] for s in sprites)
        img = Image.new('RGB', (W, H), (0, 0, 0))
        for s in sprites:
            where[s['name']] = (sheet, (s['x'], s['y'], s['width'], s['height']))
            if s['png']:
                sprite = Image.open(io.BytesIO(base64.b64decode(s['png']))).convert('RGBA')
                img.paste(sprite, (s['x'], s['y']), sprite)
        sheets[sheet] = img

    # Title lettering is found on the stock pixels, before recolouring
    titles = [
        ('MAIN_TITLE_BAR_SELECTED', 'HOSTERAMP', True, (95, 180)),
        ('MAIN_TITLE_BAR', 'HOSTERAMP', False, (95, 180)),
        ('EQ_TITLE_BAR_SELECTED', 'HOSTER EQUALIZER', True, (80, 196)),
        ('EQ_TITLE_BAR', 'HOSTER EQUALIZER', False, (80, 196)),
        ('PLAYLIST_TITLE_BAR_SELECTED', 'PLAYLIST', True, (0, 100)),
        ('PLAYLIST_TITLE_BAR', 'PLAYLIST', False, (0, 100)),
    ]
    spans = {t[0]: text_span(sheets[where[t[0]][0]], where[t[0]][1], t[3]) for t in titles}

    sheets = {k: recolor(v) for k, v in sheets.items()}

    for name, text, active, _ in titles:
        sheet, box = where[name]
        x0, _, w, _ = box
        # Keep clear of the window buttons at the right end of the main/EQ bars
        max_x = x0 + w - 24 if name.startswith(('MAIN', 'EQ')) else x0 + w - 3
        img = sheets[sheet]
        # paint over the stock lettering with the bar's own background
        span = spans[name]
        if span:
            px = img.load()
            bg = px[span[0] - 3, box[1] + box[3] // 2]
            for x in range(span[0] - 1, span[1] + 2):
                for y in range(box[1] + 2, box[1] + box[3] - 2):
                    px[x, y] = bg
        retitle(img, box, text, active, span, min_x=x0 + 20, max_x=max_x)

    # The EQ graph samples its line colours from a 1x19 strip; paint a gradient
    sheet, (x, y, w, h) = where['EQ_GRAPH_LINE_COLORS']
    px = sheets[sheet].load()
    for i in range(h):
        c = ramp(ELECTRIC, 1 - i / (h - 1) * 0.6)
        for dx in range(w):
            px[x + dx, y + i] = c

    viscolor = [LCD_BG, (40, 46, 90)]
    viscolor += [ramp(ELECTRIC, 1 - i / 15 * 0.65) for i in range(16)]  # spectrum, top -> bottom
    viscolor += [ramp(ELECTRIC, 0.95 - i * 0.1) for i in range(5)]      # oscilloscope
    viscolor += [(255, 255, 255)]                                       # peak dots

    pledit = '\n'.join([
        '[Text]',
        'Normal=#%02X%02X%02X' % LCD_TEXT,
        'Current=#FFFFFF',
        'NormalBG=#%02X%02X%02X' % LCD_BG,
        'SelectedBG=#2B35A8',
        'Font=Arial',
        '',
    ])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        for sheet, img in sheets.items():
            buf = io.BytesIO()
            img.save(buf, 'BMP')
            z.writestr(f'{sheet.lower()}.bmp', buf.getvalue())
        z.writestr('viscolor.txt', '\n'.join('%d,%d,%d' % c for c in viscolor) + '\n')
        z.writestr('pledit.txt', pledit)
        z.writestr('readme.txt', 'HosterAmp - a recoloured Winamp base skin for hoster.band\n')

    preview = Image.new('RGB', (275 * 2 + 10, 116 + 14 + 315), (255, 0, 255))
    preview.paste(sheets['MAIN'], (0, 14))
    preview.paste(sheets['TITLEBAR'].crop((27, 0, 302, 14)), (0, 0))
    preview.paste(sheets['EQMAIN'], (285, 0))
    preview.paste(sheets['CBUTTONS'], (16, 14 + 88))
    print(f'wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)')
    return preview


if __name__ == '__main__':
    import sys
    p = main()
    if len(sys.argv) > 1:
        p.resize((p.width * 2, p.height * 2), Image.Resampling.NEAREST).save(sys.argv[1])
