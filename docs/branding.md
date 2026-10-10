# Norulo brand assets

The original logo was supplied by the user through
[the shared image page](https://chatgpt.com/s/m_6aca24170b348191a1b234d73cd5776b).
`public/norulo-logo.png` preserves the downloaded 1254 × 1254 RGBA PNG's
original bytes, without redrawing, approximating or recoloring it. Its SHA-256 is
`a9632acbd7a5ad48ad5ff25d6269f617c7655446365344c9db42d504213c710f`.

| Asset | Format / dimensions | Use |
| --- | --- | --- |
| `public/norulo-logo.png` | Original PNG, 1254 × 1254 | Exact source artwork |
| `public/brand-mark.png` | PNG, 96 × 96 | All inline application/public-page brand images and JSON-LD logo |
| `public/apple-touch-icon.png` | PNG, 180 × 180 | Apple touch icon in the HTML shell |
| `public/favicon.ico` | ICO, 16 / 32 / 48 / 64 / 128 / 256 | Browser favicon |
| `public/social-card.svg` | SVG, 1200 × 630 | Norulo title/description/text, embedded original PNG and licensed fonts |
| `public/social-card.png` | PNG, 1200 × 630 | Open Graph and Twitter image |

The derived icons use only size/format conversion. The SVG's `<image>` embeds
the source PNG bytes, and its text uses the bundled Geist fonts. The raster card
is a local Chromium screenshot of that SVG with no remote requests. It does not
generate a different logo. The SVG title is **Norulo project expense ledger**;
its description names Norulo, and its visible footer uses **NORULO.COM**.

ImageMagick 7.1.1-43 produced the icons with these commands:

```sh
magick public/norulo-logo.png -resize 96x96 -strip public/brand-mark.png
magick public/norulo-logo.png -resize 180x180 -strip public/apple-touch-icon.png
magick public/norulo-logo.png -strip -define icon:auto-resize=256,128,64,48,32,16 public/favicon.ico
npm run generate:social-card
```

The managed cloud environment runs the last command through its verified browser
runtime wrapper when system libraries are installed into the local prefix.
The original PNG is unchanged by these commands. All inline, favicon, Apple,
social and JSON-LD asset URLs use `?v=a9632acbd7a5` to refresh previous caches.
The blue/cyan logo remains unchanged between light and dark themes.
