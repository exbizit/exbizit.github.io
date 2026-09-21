#!/usr/bin/env python3
"""
Rebuilds every web image in public/photos/ from the originals in photos/.

photos/          your originals, any size, any format. Never modified by this script.
public/photos/   what the site actually serves. Always regenerated from scratch.

Why a full rebuild rather than "only what changed": Finder keeps a file's original
modification date when you copy it in, so a replaced photo can look OLDER than the
web copy built from its predecessor. Timestamps can't be trusted to detect
replacements; rebuilding everything takes seconds and can't go stale.

    npm run photos        (needs Python 3 + Pillow:  pip3 install pillow)

To add an image: drop the original into photos/<band>/, add one line to MANIFEST
below, run this, then reference the OUTPUT path in src/data/bands.ts.
"""
import pathlib, sys
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent

def _fit(im, edge):
    w, h = im.size
    if max(w, h) > edge:
        s = edge / max(w, h)
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    return im

def _open(src):
    return ImageOps.exif_transpose(Image.open(src))   # honour camera rotation

def photo(src, dst, edge=1600, crop=None):
    im = _open(src)
    if crop: im = crop(im)
    im = _fit(im, edge)
    if im.mode in ('RGBA', 'LA', 'P'):                 # flatten transparency onto black
        im = im.convert('RGBA'); bg = Image.new('RGB', im.size, (0, 0, 0))
        bg.paste(im, mask=im.split()[-1]); im = bg
    im.convert('RGB').save(dst, 'JPEG', quality=84, optimize=True, progressive=True)
    return im.size

def logo(src, dst, edge=900):
    """Kept as PNG so transparency survives. Rendered untouched on the page."""
    im = _fit(_open(src).convert('RGBA'), edge)
    im.save(dst, 'PNG', optimize=True)
    return im.size

def wordmark(src, dst, edge=1400):
    """Dark ink on white paper -> white ink on transparent, for a black page."""
    g = _fit(_open(src).convert('L'), edge)
    a = ImageOps.invert(g).point(lambda v: 0 if v < 28 else min(255, int((v - 28) * 1.25)))
    out = Image.new('RGBA', g.size, (255, 255, 255, 0)); out.putalpha(a)
    if a.getbbox(): out = out.crop(a.getbbox())
    out.save(dst, 'PNG', optimize=True)
    return out.size

def crop_taut(im):
    """The Taut Pupils file is a phone screenshot with a Google Lens button baked
    into the bottom-right. Only crop the exact screenshot we measured, so a
    replacement (e.g. the real artwork file) passes through untouched."""
    return im.crop((6, 6, 1134, 1100)) if im.size == (1206, 1237) else im

def crop_mwl_drawing(im):
    """smoke-text.jpeg is a square composition: smoky lettering top-left, then the
    pen drawing inside black margins. As a wide hero, those built-in margins leave
    the drawing boxed in the middle, so take just the drawing. Measured on the
    1772x1772 source; any other size passes through untouched."""
    return im.crop((204, 232, 1571, 1515)) if im.size == (1772, 1772) else im

def wordmark_light(src, dst, box=None, edge=1400, fade_right=0, min_blob=0):
    """Light ink on a dark ground -> white ink on transparent. Brightness becomes
    opacity, so smoke keeps its soft edges instead of being hard-thresholded.

    fade_right: fade the last N px to nothing, so a cut-off trail wisps out.
    min_blob:   drop any isolated speck smaller than this many pixels (stars)."""
    im = _open(src).convert('L')
    if box: im = im.crop(box)
    im = _fit(im, edge)
    a = im.point(lambda v: 0 if v < 40 else min(255, int((v - 40) * 1.35)))
    w, h = a.size
    px = a.load()

    if min_blob:
        seen = bytearray(w * h)
        for sy in range(h):
            for sx in range(w):
                if px[sx, sy] == 0 or seen[sy * w + sx]:
                    continue
                stack, comp = [(sx, sy)], []
                seen[sy * w + sx] = 1
                while stack:
                    x, y = stack.pop(); comp.append((x, y))
                    for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
                        if 0 <= nx < w and 0 <= ny < h and px[nx, ny] and not seen[ny * w + nx]:
                            seen[ny * w + nx] = 1; stack.append((nx, ny))
                if len(comp) < min_blob:
                    for x, y in comp: px[x, y] = 0

    if fade_right:
        for x in range(max(0, w - fade_right), w):
            k = (w - x) / fade_right
            for y in range(h):
                if px[x, y]: px[x, y] = int(px[x, y] * k)

    out = Image.new('RGBA', (w, h), (255, 255, 255, 0)); out.putalpha(a)
    if a.getbbox(): out = out.crop(a.getbbox())
    out.save(dst, 'PNG', optimize=True)
    return out.size

# Smoky "Mary's White Lie" lettering across the top of smoke-text.jpeg (1772px source).
# The trail after "Lie" turns down into the drawing's chimney; the crop ends
# before that turn and fades the last stretch so it wisps out.
MWL_LETTERING = (30, 0, 1352, 222)

def circle(src, dst, center, radius, expect=None, size=400, gray=True, ring=0, ring_rgb=(150, 150, 150)):
    """Circular medallion cut from a photo, transparent outside the circle.
    center/radius are in SOURCE pixels, so `expect` guards the source size: a
    replaced photo with different dimensions is skipped rather than cut in the
    wrong place. Edges are supersampled so the rim is smooth, not jagged."""
    im = _open(src)
    if expect and im.size != expect:
        print(f"  SKIPPED {dst.name}: source is {im.size}, circle was measured on {expect}")
        return im.size
    cx, cy = center
    im = im.crop((cx - radius, cy - radius, cx + radius, cy + radius))
    im = (im.convert('L') if gray else im.convert('RGB')).resize((size, size), Image.LANCZOS)
    ss = 4
    from PIL import ImageDraw
    m = Image.new('L', (size * ss, size * ss), 0)
    ImageDraw.Draw(m).ellipse((0, 0, size * ss - 1, size * ss - 1), fill=255)
    m = m.resize((size, size), Image.LANCZOS)
    out = im.convert('RGBA'); out.putalpha(m)
    if ring:
        # A thin rim defines the circle when the photo's own background is as
        # dark as the page, which otherwise swallows the top of the curve.
        r = Image.new('RGBA', (size * ss, size * ss), (0, 0, 0, 0))
        ImageDraw.Draw(r).ellipse((0, 0, size * ss - 1, size * ss - 1),
                                  outline=ring_rgb + (255,), width=ring * ss)
        out.alpha_composite(r.resize((size, size), Image.LANCZOS))
    out.save(dst, 'PNG', optimize=True)
    return out.size

# (kind, original under photos/, output under public/photos/, options)
MANIFEST = [
  # ── Hoster ───────────────────────────────────────────────────────────────
  (logo,     'hoster/hosterLogo.png',                  'hoster/logo.png', {}),
  (wordmark, 'hoster/HosterLetters.jpeg',              'hoster/wordmark.png', {}),
  (photo,    'hoster/house-showHero.jpeg',             'hoster/house-show.jpg', {}),
  (photo,    'hoster/bandphoto.jpeg',                  'hoster/band-photo.jpg', {}),
  (photo,    'hoster/hosterPerforms.jpeg',             'hoster/performing.jpg', {}),
  (photo,    'hoster/punkrockpizza-2.JPG',             'hoster/punk-rock-pizza.jpg', {}),
  (photo,    'hoster/punkrockpizzashow.JPG',           'hoster/punk-rock-pizza-show.jpg', {}),
  (photo,    'hoster/river-jams.jpeg',                 'hoster/river-jams.jpg', {}),
  (photo,    'hoster/stardust-show.jpeg',              'hoster/stardust-show.jpg', {}),
  (photo,    'hoster/wprk-interview.jpeg',             'hoster/wprk-interview.jpg', {'edge': 1200}),
  (photo,    'hoster/ALittleStrange-AlbumCover.jpg',   'hoster/a-little-strange-cover.jpg', {'edge': 1000}),
  (photo,    'hoster/GnocchiCoverArt-0719-3.png',      'hoster/gnocchi-cover.jpg', {'edge': 1000}),
  (photo,    'hoster/hoster_sticker_pao_final.png',    'hoster/sticker.jpg', {'edge': 1200}),
  (photo,    'hoster/catpuppy.jpg',                    'hoster/catpuppy.jpg', {'edge': 1000}),
  # ── Mary's White Lie ─────────────────────────────────────────────────────
  (logo,     'marys-white-lie/mary-logo.png',          'maryswhitelie/logo.png', {'edge': 700}),
  (photo,    'marys-white-lie/band-pic.jpeg',          'maryswhitelie/band-pic.jpg', {}),
  (photo,    'marys-white-lie/band-pic2.jpeg',         'maryswhitelie/band-pic2.jpg', {}),
  (photo,    'marys-white-lie/band-pic3.JPG',          'maryswhitelie/band-pic3.jpg', {}),
  (photo,    'marys-white-lie/first-show-pic.JPG',     'maryswhitelie/first-show.jpg', {}),
  (photo,    'marys-white-lie/hannah-kline-art.png',   'maryswhitelie/kline-art.jpg', {'edge': 1200}),
  (photo,    'marys-white-lie/smoke-text.jpeg',        'maryswhitelie/smoke-text.jpg', {}),
  (photo,    'marys-white-lie/smoke-text.jpeg',        'maryswhitelie/hero-drawing.jpg', {'crop': crop_mwl_drawing}),
  (wordmark_light, 'marys-white-lie/smoke-text.jpeg',  'maryswhitelie/wordmark.png', {'box': MWL_LETTERING, 'fade_right': 150, 'min_blob': 60}),
  (photo,    'marys-white-lie/stable-of-stone-album-cover.jpeg', 'maryswhitelie/stable-of-stone-cover.jpg', {'edge': 1000}),
  # ── Head Banned ──────────────────────────────────────────────────────────
  (photo,    'head-banned/headbanned.JPG',             'headbanned/headbanned.jpg', {}),
  (photo,    'head-banned/PhishingAlbum.jpg',          'headbanned/phishing-cover.jpg', {'edge': 1000}),
  # ── zeroindex ────────────────────────────────────────────────────────────
  (photo,    'zeroindex/mixing2.jpeg',                 'zeroindex/mixing.jpg', {}),
  (photo,    'zeroindex/grindset.jpeg',                'zeroindex/grindset-cover.jpg', {'edge': 1000}),
  # ── Roger's Only Son ─────────────────────────────────────────────────────
  (photo,    'rogers-only-son/ROS0.JPG',               'rogersonlyson/ros-1.jpg', {}),
  # Medallion logo: face + upper stripes. Measured on the 2088x1484 original.
  (circle,   'rogers-only-son/ROS0.JPG',               'rogersonlyson/logo.png',
             {'center': (1060, 613), 'radius': 392, 'expect': (2088, 1484), 'ring': 5}),
  (photo,    'rogers-only-son/ROS1.JPG',               'rogersonlyson/ros-2.jpg', {}),
  (photo,    'rogers-only-son/ROS2.JPEG',              'rogersonlyson/ros-3.jpg', {}),
  (photo,    'rogers-only-son/ros-punkrockpizza.jpeg', 'rogersonlyson/punk-rock-pizza-1.jpg', {}),
  (photo,    'rogers-only-son/ros-punkrockpizza2.jpeg','rogersonlyson/punk-rock-pizza-2.jpg', {}),
  (photo,    'rogers-only-son/TautPupils-ROS.png',     'rogersonlyson/taut-pupils-cover.jpg', {'edge': 1000, 'crop': crop_taut}),
  # ── Shared ───────────────────────────────────────────────────────────────
  (photo,    'misc/crowd-pic.JPG',                     'shared/crowd.jpg', {}),
]

def main():
    src_root, out_root = ROOT / 'photos', ROOT / 'public' / 'photos'
    missing, before, after = [], 0, 0
    for fn, s, d, opts in MANIFEST:
        sp, dp = src_root / s, out_root / d
        if not sp.exists():
            missing.append(s); continue
        dp.parent.mkdir(parents=True, exist_ok=True)
        orig = Image.open(sp).size
        size = fn(sp, dp, **opts)
        before += sp.stat().st_size; after += dp.stat().st_size
        note = '' if size == orig else f'  (from {orig[0]}x{orig[1]})'
        print(f"  {size[0]:>4}x{size[1]:<4} {dp.stat().st_size/1024:6.0f}KB  {d}{note}")

    # originals nobody has mapped yet — the easy thing to forget
    mapped = {s for _, s, _, _ in MANIFEST}
    unmapped = [str(p.relative_to(src_root)) for p in sorted(src_root.rglob('*'))
                if p.is_file() and not p.name.startswith('.') and '_claude-previews' not in str(p)
                and str(p.relative_to(src_root)) not in mapped]

    print(f"\n  {len(MANIFEST) - len(missing)} built · {before/1048576:.1f}MB of originals -> {after/1048576:.1f}MB served")
    if missing:
        print("\n  MISSING originals (renamed or removed?):"); [print(f"    {m}") for m in missing]
    if unmapped:
        print("\n  In photos/ but not in MANIFEST (not on the site):"); [print(f"    {u}") for u in unmapped]
    return 1 if missing else 0

if __name__ == '__main__':
    sys.exit(main())
