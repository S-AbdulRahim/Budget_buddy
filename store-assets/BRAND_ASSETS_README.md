# FinCompass — Brand Assets

Everything here is rendered from `assets/brand/logo.svg`'s design, corrected
so the coin accent sits fully inside Android's adaptive-icon safe zone (the
original had it clipping on two edges under a circular launcher mask —
verified with a render, now fixed).

## 1. Drop-in app icons — copy `app/*` into your repo's `assets/` folder

Replace these 6 files directly (same names, same paths `app.json` already
points to — no config changes needed for these):

| File | Used for |
|---|---|
| `icon.png` (1024×1024) | Main app icon (iOS, generic) |
| `favicon.png` (196×196) | Web tab icon |
| `android-icon-foreground.png` (512×512, transparent) | Android adaptive icon — glyph layer |
| `android-icon-background.png` (512×512) | Android adaptive icon — background layer |
| `android-icon-monochrome.png` (512×512, transparent) | Android 13+ themed icon (tinted by wallpaper) |
| `splash-icon.png` (1024×1024, transparent) | Launch splash glyph |

**One config change needed:** `splash-icon.png` currently isn't wired to
anything — `app.json`'s `expo-splash-screen` plugin has no options object, so
the file has been sitting unused. Update the plugin entry in `app.json`:

```json
"plugins": [
  "expo-router",
  "expo-font",
  [
    "expo-splash-screen",
    {
      "image": "./assets/splash-icon.png",
      "imageWidth": 200,
      "backgroundColor": "#0A0E1A"
    }
  ]
]
```

## 2. Play Store listing — `play-store/*`

| File | Used for |
|---|---|
| `icon-512.png` (512×512, opaque) | Play Console's "hi-res icon" upload (no transparency, as Google requires) |
| `feature-graphic-1024x500.png` | Play Console's feature graphic |

These aren't app files — upload them directly in Play Console's Store
Listing page.

## 3. Source vectors — `source/*`

Kept in case you want to hand-edit or re-export at a different size later:
- `icon-flat.svg` — the combined squircle + glyph, source for `icon.png`,
  `favicon.png` and the Play Store hi-res icon.
- `glyph.svg` — wallet + coin only, transparent background, safe-zone
  compliant. Source for the Android adaptive foreground and splash icon.
- `background.svg` — the plain gradient fill, no glyph. Source for the
  Android adaptive background.
- `monochrome.svg` — simplified single-color silhouette (Android's own
  guidance recommends a reduced-detail shape here, not the full glyph, since
  the OS replaces all color with a system tint and only reads alpha).

If you ever redesign the mark, regenerate everything from `icon-flat.svg`,
`glyph.svg`, `background.svg` and `monochrome.svg` with (Python + cairosvg):

```python
import cairosvg
cairosvg.svg2png(url="icon-flat.svg", write_to="icon.png", output_width=1024, output_height=1024)
cairosvg.svg2png(url="icon-flat.svg", write_to="favicon.png", output_width=196, output_height=196)
cairosvg.svg2png(url="glyph.svg", write_to="android-icon-foreground.png", output_width=512, output_height=512)
cairosvg.svg2png(url="background.svg", write_to="android-icon-background.png", output_width=512, output_height=512)
cairosvg.svg2png(url="monochrome.svg", write_to="android-icon-monochrome.png", output_width=512, output_height=512)
cairosvg.svg2png(url="glyph.svg", write_to="splash-icon.png", output_width=1024, output_height=1024)
```
