<p align="center">
  <a href="https://velvet.mvp-subha.me">
    <img src="https://velvet.mvp-subha.me/og.svg" alt="velvet-fx — animated WebGL velvet fabric shader for React" width="780" />
  </a>
</p>

<h1 align="center">velvet-fx</h1>

<p align="center">
  <b>Real-time WebGL velvet fabric shader for React.</b><br />
  Four compositing variants. Five drivers. Five fabric presets — silk, satin, velvet, suede, crushed.<br />
  One shared GL context for the whole page. Zero runtime dependencies.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/velvet-fx"><img alt="npm version" src="https://img.shields.io/npm/v/velvet-fx?style=flat-square&color=de2f4f&label=velvet-fx&labelColor=1a0606" /></a>
  <a href="https://www.npmjs.com/package/velvet-fx"><img alt="downloads / month" src="https://img.shields.io/npm/dm/velvet-fx?style=flat-square&color=de2f4f&labelColor=1a0606" /></a>
  <a href="https://bundlephobia.com/package/velvet-fx"><img alt="gzipped size" src="https://img.shields.io/bundlephobia/minzip/velvet-fx?style=flat-square&label=min+gzip&color=de2f4f&labelColor=1a0606" /></a>
  <a href="https://www.npmjs.com/package/velvet-fx"><img alt="TypeScript types" src="https://img.shields.io/npm/types/velvet-fx?style=flat-square&color=3178c6&labelColor=1a0606" /></a>
  <a href="./LICENSE"><img alt="MIT license" src="https://img.shields.io/npm/l/velvet-fx?style=flat-square&color=fbfbfb&labelColor=1a0606" /></a>
  <a href="https://github.com/subhadeeproy3902/velvet/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/subhadeeproy3902/velvet?style=flat-square&color=ffe080&labelColor=1a0606" /></a>
</p>

<p align="center">
  <a href="https://velvet.mvp-subha.me"><b>Live demo</b></a>
  &nbsp;·&nbsp;
  <a href="#installation">Install</a>
  &nbsp;·&nbsp;
  <a href="#quick-start">Quick start</a>
  &nbsp;·&nbsp;
  <a href="#variants">Variants</a>
  &nbsp;·&nbsp;
  <a href="#drivers">Drivers</a>
  &nbsp;·&nbsp;
  <a href="#fabric-presets">Presets</a>
  &nbsp;·&nbsp;
  <a href="#api-reference">API</a>
  &nbsp;·&nbsp;
  <a href="#how-it-works">How it works</a>
</p>

---

## Why velvet-fx?

| | |
|---|---|
| 🪡 **Real fabric, not gradients** | Composite fbm height field, anisotropic fold ridges, Schlick-style sheen capped at 55% mix so the base color always survives in highlights. |
| ⚡ **One shared GL context** | A singleton WebGL renderer paints into per-instance 2D canvases via `drawImage`. Unlimited Velvets, never any context loss — even on rapid mobile scroll. |
| 🎨 **Four compositing variants** | `background`, `border`, `text` (mask-image to the glyph shape), `overlay` (`mix-blend-mode`). |
| 🕹 **Five drivers** | `auto` (default — self-animates), `cursor`, `scroll`, `gyroscope`, `static`. |
| 🧵 **Five fabric presets** | Silk, satin, velvet, suede, crushed — all expressed as `grain × depth × roughness × intensity` so you can dial any fabric in between. |
| 📦 **Zero runtime deps** | Just `react` and `react-dom` peer-deps. ~8 kB gzipped. |
| 🌗 **Theme- & motion-aware** | Reads `data-theme` and `prefers-reduced-motion`; mask regenerates on Vite HMR style swaps. |
| 🟦 **SSR-safe, fully typed** | No `window`/`canvas`/`document` access at module load. Strict-mode-safe. First-class TypeScript types. |

## Installation

```bash
bun add velvet-fx
# or
npm install velvet-fx
# or
pnpm add velvet-fx
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

## Quick start

```tsx
import { Velvet } from 'velvet-fx'

export function CrimsonCard() {
  return (
    <Velvet
      variant="background"
      color="#8B0000"
      driver="auto"
      style={{ borderRadius: 18 }}
    >
      <article style={{ padding: 24, color: '#fff' }}>
        <h3>Crimson</h3>
        <p>The shader self-animates. No cursor, no scroll, no effort.</p>
      </article>
    </Velvet>
  )
}
```

That's it. The component owns a single shared WebGL renderer behind the scenes; you just pass props.

## Variants

<table>
  <thead>
    <tr>
      <th width="120">Variant</th>
      <th width="220">Compositing</th>
      <th>Use it when…</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>background</code></td>
      <td>Canvas behind children</td>
      <td>You want velvet behind a card / hero / button. The default.</td>
    </tr>
    <tr>
      <td><code>border</code></td>
      <td>Canvas masked to a ring</td>
      <td>You want a hairline outline that shimmers without affecting the interior.</td>
    </tr>
    <tr>
      <td><code>text</code></td>
      <td>Canvas masked to glyph shape</td>
      <td>You want the velvet to render <i>inside the letters</i> — text as a window into the fabric.</td>
    </tr>
    <tr>
      <td><code>overlay</code></td>
      <td><code>mix-blend-mode: overlay</code></td>
      <td>You want to drape velvet on top of any existing content without intercepting clicks.</td>
    </tr>
  </tbody>
</table>

```tsx
// background — velvet behind a card
<Velvet variant="background" color="#8B0000" driver="auto">
  <Card />
</Velvet>

// border — only the outline shimmers
<Velvet variant="border" color="#1a4a2a" borderWidth={3} borderRadius={18}>
  <Panel />
</Velvet>

// text — velvet only inside the letters
<Velvet variant="text" color="#1a0a3a" sheen="#d2b6ff" driver="auto">
  <h1 style={{ fontSize: 96, fontWeight: 700 }}>light catches</h1>
</Velvet>

// overlay — velvet over any element, click-through
<Velvet variant="overlay" color="#0a0a1a" driver="auto" speed={0.5}>
  <GradientHero />
</Velvet>
```

## Drivers

<table>
  <thead>
    <tr>
      <th width="120">Driver</th>
      <th>Behaviour</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>auto</code> <i>(default)</i></td>
      <td>The shader's noise field drifts linearly through <code>u_time</code> on its own — no input needed. <code>speed</code> scales the drift rate.</td>
    </tr>
    <tr>
      <td><code>cursor</code></td>
      <td>Lerps the light position toward the pointer (or the whole viewport with <code>trackWindow</code>).</td>
    </tr>
    <tr>
      <td><code>scroll</code></td>
      <td>Maps the wrapper's vertical scroll progress (0 at viewport bottom → 1 at top) to the light position.</td>
    </tr>
    <tr>
      <td><code>gyroscope</code></td>
      <td>Reads <code>deviceorientation</code> <code>gamma</code> / <code>beta</code> on mobile. Falls back to mouse if unavailable.</td>
    </tr>
    <tr>
      <td><code>static</code></td>
      <td>Fixed light angle from the <code>angle</code> prop (degrees). For non-interactive renders.</td>
    </tr>
  </tbody>
</table>

## Fabric presets

One shader, five fabric "kinds" expressed as combinations of four numeric props:

| Preset | `grain` | `depth` | `roughness` | `intensity` | Reads as |
|---|---|---|---|---|---|
| **Silk** | 0.18 | 0.55 | 9.5 | 1.0 | Smooth, sharp specular highlights, shallow folds |
| **Satin** | 0.32 | 0.45 | 8.0 | 1.0 | Slight grain, crisp sheen, slightly softer than silk |
| **Velvet** | 0.70 | 0.55 | 4.0 | 0.9 | Full fiber pile, matte sheen, medium folds |
| **Crushed** | 0.55 | 0.92 | 5.5 | 1.0 | Dramatic folds, deep valleys, medium pile |
| **Suede** | 0.92 | 0.30 | 2.2 | 0.75 | Very high grain, flat matte, no specular bite |

You're not limited to these — they're starting points. Dial anywhere in between.

## API reference

`<Velvet>` is the only export. All standard `HTMLDivElement` attributes are forwarded to the wrapper. `ref` resolves to the wrapper `<div>`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `color` | `string` | `'#8B0000'` | Base fabric color. Any valid CSS color. |
| `sheen` | `string` | auto-lightened from `color` | Specular highlight color. |
| `variant` | `'background' \| 'border' \| 'text' \| 'overlay'` | `'background'` | How the shader composites onto the element. |
| `driver` | `'auto' \| 'cursor' \| 'scroll' \| 'gyroscope' \| 'static'` | `'auto'` | What drives the light direction. |
| `grain` | `number` 0–1 | `0.6` | Fiber density. 0 = smooth, 1 = coarse pile. |
| `depth` | `number` 0–1 | `0.4` | Fold depth / crushed-ness. |
| `roughness` | `number` 1–10 | `4` | Sheen tightness. Low = matte broad glow. High = glossy tight specular. |
| `intensity` | `number` 0–1 | `0.8` | Overall highlight strength. |
| `speed` | `number` | `1` | Texture drift rate (scales `u_time`). |
| `angle` | `number` 0–360 | `45` | Static light angle in degrees for `driver="static"`. |
| `ease` | `number` 0.01–1 | `0.08` | Lerp factor for cursor smoothing each frame. |
| `trackWindow` | `boolean` | `false` | Track the cursor across the whole viewport. |
| `gyroscope` | `boolean` | `false` | Shorthand for `driver="gyroscope"`. |
| `borderWidth` | `number` | `2` | Ring thickness in px for `variant="border"`. |
| `borderRadius` | `number` | `12` | Ring radius in px for `variant="border"`. |
| `paused` | `boolean` | `false` | Freeze the shader on the current frame. |
| `onSheenChange` | `(x, y, intensity) => void` | — | Per-frame callback with the current light position and intensity. Use a ref — never call `setState` in this. |
| `className` | `string` | — | Extra class on the wrapper. |
| `style` | `CSSProperties` | — | Extra inline styles on the wrapper. |

## How it works

### One shared WebGL context

Every `<Velvet>` registers itself with a singleton renderer that owns one offscreen WebGL canvas, one shader program, one RAF loop. Each frame the renderer:

1. Calls each visible `target.update(dtMs)` so the instance can advance its lerp / time / driver-derived light position into `target.opts`.
2. Renders the shader at each target's size into the shared canvas.
3. `drawImage`s the rendered region into the instance's regular 2D canvas.

The browser's per-page WebGL context cap (≈ 8 on mobile Safari) is irrelevant — there's only one context for the whole page, and it never gets destroyed by scrolling.

### The shader

```glsl
// 5-octave fbm composite — macro weave + fine fiber detail
// Two anisotropic noise fields sharpened into fold ridges:
//   ridge(v) = 1 - |v - 0.5| * 2
//   pow(ridge, 1.2 + depth * 2.4)  → sharp peaks, deep valleys
// Schlick-style sheen, mask-gated to ridge peaks:
//   sheenMask = smoothstep(0.55, 0.92, ridges) ^ (1 + roughness * 0.4)
//   col = mix(base, u_sheen, sheenMask * intensity * 0.55)
```

Linear (not sin/cos) time drift over an infinite noise field — continuous one-way flow that never reverses. The drift speeds are tuned so a Velvet looks alive at `speed = 1` without input.

### Mask layers (text / border variants)

For `variant="text"`, the canvas is masked to the children's glyph shape via a canvas2D-drawn PNG (canvas2D respects document `@font-face` webfonts; SVG-in-data-URL does not). The mask refreshes on `document.fonts.ready` and on stylesheet mutations so Vite HMR style edits hot-reload.

For `variant="border"`, the canvas is masked to a SVG ring whose dimensions update on `ResizeObserver`.

### Performance

- One WebGL context per page, **never destroyed** — rapid scrolling can't trigger context loss
- RAF loop reads from refs and writes to GL uniforms — **zero React re-renders during animation**
- Off-screen velvets skipped via `IntersectionObserver` (`target.visible = false`); their target stays registered for instant resume
- `prefers-reduced-motion: reduce` short-circuits the cursor lerp to an instant snap
- Mobile-safe: `precision highp float` falls back to `mediump` via `#ifdef GL_FRAGMENT_PRECISION_HIGH`, `u_time` wraps at 1000s so half-precision noise sampling stays sharp

## Browser support

WebGL 1.0 + standard observer APIs:

- Chrome / Edge **88+**
- Safari **14.1+** (incl. iOS Safari)
- Firefox **63+**

SSR-safe — no `window`, `canvas`, or `document` access at module load. The canvas only mounts after hydration via `useState(false) + useEffect(() => setMounted(true), [])`, so initial server output is a plain wrapper div with the children inside.

## Demo

The live demo at **[velvet.mvp-subha.me](https://velvet.mvp-subha.me)** ships with:

- A playground with live sliders for every prop
- Four "Examples" cards — one per variant — with copyable code
- A "Library" showing all five fabric presets across six themed colors
- Dark / light theme toggle (palettes adapt per theme)
- Full SEO / AEO / AIO meta stack — Open Graph, Twitter card, JSON-LD (`SoftwareSourceCode` + `FAQPage`), `llms.txt`, sitemap

## Links

- 📦 npm — **[velvet-fx](https://www.npmjs.com/package/velvet-fx)**
- 🌐 Demo — **[velvet.mvp-subha.me](https://velvet.mvp-subha.me)**
- 💻 GitHub — **[subhadeeproy3902/velvet](https://github.com/subhadeeproy3902/velvet)**
- 🐦 Author — **[@mvp_Subha](https://x.com/mvp_Subha)**

## Credits

Built by **[Subhadeep Roy](https://x.com/mvp_Subha)** with **[Claude](https://claude.com)** — pair-programmed end-to-end, from the velvet BRDF shader and shared-renderer engine to the demo gallery, the playground, and the five fabric presets.

## License

MIT © [Subhadeep Roy](https://x.com/mvp_Subha)
