# Ryng — Favicon & Icon Integration

## Assets

Die folgenden Dateien liegen im Projektordner unter `/public/` (oder wo auch immer deine statischen Assets liegen). Kopiere sie dorthin:

- `ryng-r-512.png` — Logo (512×512)
- `ryng-r-256.png` — Logo (256×256)
- `ryng-r-192.png` — PWA Manifest Icon
- `ryng-r-180.png` — Apple Touch Icon
- `ryng-r-128.png` — Logo (128×128)
- `ryng-r-64.png` — Logo (64×64)
- `ryng-r-48.png` — Logo (48×48)
- `ryng-r-32.png` — Favicon (32×32)
- `ryng-r-16.png` — Favicon (16×16)
- `ryng-favicon.ico` — Klassisches ICO (16+32+48)
- `ryng-favicon.svg` — Vektor-Favicon (benötigt Saira Font)

## index.html — Head-Tags

Ersetze bestehende Favicon/Icon-Tags im `<head>` durch:

```html
<link rel="icon" href="/ryng-favicon.ico" sizes="48x48">
<link rel="icon" href="/ryng-favicon.svg" type="image/svg+xml">
<link rel="icon" href="/ryng-r-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/ryng-r-16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="/ryng-r-180.png">
```

## PWA Manifest (manifest.json / manifest.webmanifest)

Ersetze die `icons`-Section:

```json
{
  "icons": [
    {
      "src": "/ryng-r-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/ryng-r-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Design-Kontext

Das Icon ist ein kursives, fettes "R" (Saira Black Italic, 900 weight) in Neongelb (#FFE600) auf App-Hintergrund (#0A0A0A) mit abgerundeten Ecken. Das R ist leicht nach rechts versetzt, um die Italic-Neigung optisch auszugleichen.

Die Farben stammen aus dem App-Farbsystem:
- Hintergrund: `#0A0A0A` (--bg-base)
- Textfarbe: `#FFE600` (--color-prepare)

## Vorgehen

1. Kopiere alle PNG-Dateien und die ICO/SVG-Datei in `/public/`
2. Aktualisiere die `<head>`-Tags in `index.html`
3. Aktualisiere das PWA-Manifest
4. Falls der App-Titel noch nicht "Ryng" ist, setze ihn in `index.html` und im Manifest
5. Liefere immer komplette Dateien, keine Patches oder Diffs
