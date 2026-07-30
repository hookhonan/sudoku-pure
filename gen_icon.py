"""Generate original Sudoku app icon: adaptive vector XMLs + legacy PNG mipmaps.

Design: indigo gradient background, 3x3 mosaic of rounded cells
(corners white, edges translucent white, center amber) — evokes a sudoku grid.
"""
import os
from PIL import Image, ImageDraw

PROJ = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'apk-project')
RES = os.path.join(PROJ, 'res')

BG_TOP = (0x5C, 0x6B, 0xC0)     # indigo 400
BG_BOT = (0x28, 0x35, 0x93)     # indigo 800
AMBER = (0xFF, 0xC1, 0x07)
WHITE = (255, 255, 255)

# 3x3 mosaic in 108 viewport: cell 13, gap 4.5, origin 30
CELL, ORIGIN, STEP, RADIUS = 13.0, 30.0, 17.5, 3.0

# (col,row) -> color+alpha; corners white, edges white 40%, center amber
CELLS = {
    (0,0): WHITE+(255,), (2,0): WHITE+(255,), (0,2): WHITE+(255,), (2,2): WHITE+(255,),
    (1,0): WHITE+(102,), (0,1): WHITE+(102,), (2,1): WHITE+(102,), (1,2): WHITE+(102,),
    (1,1): AMBER+(255,),
}


def rr_path(x, y, w, h, r):
    return (f"M{x+r},{y}h{w-2*r}a{r},{r} 0 0 1 {r},{r}v{h-2*r}"
            f"a{r},{r} 0 0 1 -{r},{r}h-{w-2*r}a{r},{r} 0 0 1 -{r},-{r}"
            f"v-{h-2*r}a{r},{r} 0 0 1 {r},-{r}z")


def write_vectors():
    bg = f"""<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
  <path android:pathData="M0,0h108v108h-108z">
    <aapt:attr name="android:fillColor">
      <gradient android:type="linear"
          android:startX="0" android:startY="0"
          android:endX="108" android:endY="108"
          android:startColor="#5C6BC0" android:endColor="#283593"/>
    </aapt:attr>
  </path>
</vector>
"""
    paths = []
    for (c, r), col in CELLS.items():
        x, y = ORIGIN + c * STEP, ORIGIN + r * STEP
        alpha = col[3] / 255.0
        hexcol = '#%02X%02X%02X' % col[:3]
        paths.append(f'  <path android:fillColor="{hexcol}" android:fillAlpha="{alpha:.2f}"\n'
                     f'      android:pathData="{rr_path(x, y, CELL, CELL, RADIUS)}"/>')
    fg = ("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
          "<vector xmlns:android=\"http://schemas.android.com/apk/res/android\"\n"
          "    android:width=\"108dp\" android:height=\"108dp\"\n"
          "    android:viewportWidth=\"108\" android:viewportHeight=\"108\">\n"
          + "\n".join(paths) + "\n</vector>\n")
    drawable = os.path.join(RES, 'drawable')
    with open(os.path.join(drawable, 'ic_launcher_background.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(bg)
    with open(os.path.join(drawable, 'ic_launcher_foreground.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(fg)
    # remove old PNG layers replaced by vectors
    for name in ('ic_launcher_background.png', 'ic_launcher_foreground.png'):
        p = os.path.join(drawable, name)
        if os.path.exists(p):
            os.remove(p)
    print('vectors written')


def gradient(size):
    img = Image.new('RGB', (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            px[x, y] = tuple(round(BG_TOP[i] + (BG_BOT[i] - BG_TOP[i]) * t) for i in range(3))
    return img


def rounded_mask(size, radius):
    m = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def render_icon(size, round_icon=False):
    """Full-bleed gradient + mosaic cells, scaled from 108 design."""
    f = size / 108.0
    img = gradient(size).convert('RGBA')
    d = ImageDraw.Draw(img)
    for (c, r), col in CELLS.items():
        x0 = (ORIGIN + c * STEP) * f
        y0 = (ORIGIN + r * STEP) * f
        d.rounded_rectangle([x0, y0, x0 + CELL * f, y0 + CELL * f],
                            radius=RADIUS * f, fill=col)
    if round_icon:
        mask = Image.new('L', (size, size), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    else:
        mask = rounded_mask(size, size * 0.18)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def write_pngs():
    densities = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
    for name, size in densities.items():
        mdir = os.path.join(RES, f'mipmap-{name}')
        os.makedirs(mdir, exist_ok=True)
        render_icon(size).save(os.path.join(mdir, 'ic_launcher.png'))
        render_icon(size, round_icon=True).save(os.path.join(mdir, 'ic_launcher_round.png'))
        print(f'mipmap-{name}: {size}px')
    # root reference copy (192px square version)
    render_icon(192).save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icon-app.png'))
    print('icon-app.png updated')


if __name__ == '__main__':
    write_vectors()
    write_pngs()
    print('done')
