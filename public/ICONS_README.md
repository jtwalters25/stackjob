# PWA Icons

The PWA requires the following icon files:

- `icon-192.png` - 192x192px PNG icon
- `icon-512.png` - 512x512px PNG icon
- `screenshot-wide.png` - 1280x720px screenshot (optional, for app stores)
- `screenshot-narrow.png` - 750x1334px screenshot (optional, for app stores)

## How to Generate

You can use the `icon.svg` file as a base and convert it to PNG:

### Using ImageMagick:
```bash
# Generate 192x192 icon
convert -background none icon.svg -resize 192x192 icon-192.png

# Generate 512x512 icon
convert -background none icon.svg -resize 512x512 icon-512.png
```

### Using Online Tools:
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/

### Or Create Custom Icons:
Design custom icons in Figma, Sketch, or Adobe Illustrator and export as PNG.

## Current Status

⚠️ **Placeholder icons needed** - The manifest references these icons but they don't exist yet.

The app will still work as a PWA, but won't show proper icons when installed.
