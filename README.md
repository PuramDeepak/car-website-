# NOCTIS — Electric Scrollytelling Experience

A premium, minimal, single-page scrollytelling website for **NOCTIS**, a fictional electric car brand.

> *"A city in total blackout at night where the car's light is the only light in the world. Quiet, expensive, precise."*

---

## ⚡ Tech Stack & Architecture

- **Vanilla HTML5, CSS3, & Modern JavaScript (ES6+)**: Zero frameworks, zero build tools, zero dependencies.
- **Canvas Video Scrollytelling Engine**: Scroll-scrubbed image sequences drawn on `<canvas>` with `requestAnimationFrame` lerping (`0.15`), `devicePixelRatio` scaling, responsive landscape cover-fit, and portrait contain-fit.
- **Adaptive Frame Sets**: Pre-rendered 1600px desktop and 960px mobile WebP frame sequences.
- **Strict Style Rules**: No gradients, no glassmorphism/blur, no drop shadows, no emojis. Only flat solid colors, 1px hairlines, photography, and typography.
- **Google Fonts**: `Archivo` (Variable font with width axis `125`), `Inter` (400), and `JetBrains Mono` (400).

---

## 🚀 Sections & Features

1. **Preloader Screen**: Minimalist wordmark with center-outward xenon progress bar and mono counter; releases as soon as initial hero frames load while continuing background preloads.
2. **Hero Scrollytelling**: 598-frame canvas scrub with left-edge telemetry HUD (speed counter `000`–`118 KM/H`, distance `0.0`–`4.2 KM`, active chapter tick) and sky-positioned line-reveal chapters. Over the last 5% of scroll, the canvas fades seamlessly into solid black.
3. **Engineering Statement**: Minimalist centered typography with scroll-driven word-by-word opacity reveal (`15%` → `100%`).
4. **Architecture Dismantle**: 200-frame exploded view canvas scrub with interactive 1px hairline callouts to the structural components (Monocoque Body, 110 kWh Battery Pack, Axial-Flux Motors, LED Signature).
5. **Interactive Lineup**: 5-slide hover accordion (GT-E, S, X, R, ONE) with 80ms debounced transitions, 6% car drive-in animation, spec grids, solid color swatches, and keyboard navigation.
6. **Reserve & Footer**: Minimalist allocation CTA with hover state and responsive footer.
7. **The Headlight Custom Cursor**: 6px dot inside 28px ring that morphs into a 44×2px light bar with contextual labels (`VIEW`, `RESERVE`, `OPEN`, `CONFIGURE`).
8. **Procedural Film Grain**: Lightweight procedural noise overlay shifted at 8fps.
9. **Accessibility**: Full `prefers-reduced-motion` support with unpinned static frames and standard system cursor.

---

## 🛠️ Local Development

Serve the repository with any local static HTTP server:

```bash
# Using Python 3
python3 -m http.server 8000

# Or with VS Code Live Server / npx serve
npx serve .
```

Open `http://localhost:8000` in your browser.
