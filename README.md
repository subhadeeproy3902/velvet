# velvet-fx

WebGL velvet fabric shader for React. Four compositing variants, five drivers, zero runtime dependencies.

## Install

```bash
bun add velvet-fx
# or: npm install velvet-fx
# or: pnpm add velvet-fx
```

## Quick start

```tsx
import { Velvet } from 'velvet-fx'

export function Card() {
  return (
    <Velvet
      variant="background"
      color="#8B0000"
      driver="cursor"
      style={{ borderRadius: 18 }}
    >
      <article>
        <h3>Crimson</h3>
        <p>Move the cursor — the sheen tracks it.</p>
      </article>
    </Velvet>
  )
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `color` | `string` | `'#8B0000'` | Base velvet color. Any valid CSS color. |
| `sheen` | `string` | auto | Sheen color. Defaults to a lightened tint of `color`. |
| `variant` | `'background' \| 'border' \| 'text' \| 'overlay'` | `'background'` | How the shader composites onto the element. |
| `grain` | `number` | `0.6` | Fiber noise frequency. 0 = smooth, 1 = coarse. |
| `intensity` | `number` | `0.8` | Sheen brightness multiplier. |
| `roughness` | `number` | `4` | BRDF exponent. Low = broad glow, high = tight specular. |
| `depth` | `number` | `0.4` | Fiber normal deviation. 0 = flat, 1 = deep pile. |
| `driver` | `'auto' \| 'cursor' \| 'scroll' \| 'gyroscope' \| 'static'` | `'auto'` | What drives the light direction. The shader auto-animates by default. |
| `speed` | `number` | `1` | Animation speed for `driver="auto"`. |
| `angle` | `number` | `45` | Static light angle in degrees for `driver="static"`. |
| `ease` | `number` | `0.08` | Lerp factor for cursor smoothing each frame. |
| `trackWindow` | `boolean` | `false` | Track cursor across the entire viewport. |
| `gyroscope` | `boolean` | `false` | Shorthand for `driver="gyroscope"`. |
| `borderWidth` | `number` | `2` | Ring thickness in px for `variant="border"`. |
| `borderRadius` | `number` | `12` | Ring radius in px for `variant="border"`. |
| `paused` | `boolean` | `false` | Freeze the shader on the current frame. |
| `onSheenChange` | `(x, y, intensity) => void` | — | Called each frame with light position and intensity. |
| `className` | `string` | — | Extra class on the wrapper. |
| `style` | `CSSProperties` | — | Extra inline styles on the wrapper. |

All standard `HTMLDivElement` attributes are forwarded to the wrapper. `ref` resolves to the wrapper `<div>`.

## Variants

### `background`

Canvas fills the element behind children. Default.

```tsx
<Velvet variant="background" color="#8B0000" driver="cursor">
  <Card />
</Velvet>
```

### `border`

Canvas is masked to a border ring around the children. Only the outline shimmers.

```tsx
<Velvet
  variant="border"
  color="#1a4a2a"
  borderWidth={3}
  borderRadius={18}
>
  <Panel />
</Velvet>
```

### `text`

Canvas sits behind children with `mix-blend-mode: color-dodge` on the children layer — sheen bleeds through the glyphs.

```tsx
<Velvet variant="text" color="#1a0a3a" driver="scroll">
  <h1>light catches</h1>
</Velvet>
```

### `overlay`

Canvas floats on top of children with `mix-blend-mode: overlay` and `pointer-events: none`. Drape velvet over any existing content.

```tsx
<Velvet variant="overlay" color="#0a0a1a" driver="auto" speed={0.5}>
  <GradientHero />
</Velvet>
```

## Drivers

### `cursor` (default)

Lerps `targetX/Y` toward the cursor each frame. Set `trackWindow` to listen on the whole window.

### `scroll`

Maps the element's vertical scroll progress (0 at viewport bottom, 1 at top) into the light position.

### `auto`

No input. The light orbits via `sin`/`cos` of time, scaled by `speed`.

### `static`

Fixed light angle from `angle` (degrees). Use for non-interactive renders.

### `gyroscope`

Reads `deviceorientation` `gamma` / `beta`. Use the `gyroscope` boolean shorthand or set `driver="gyroscope"`.

## How it works

**Velvet BRDF.** Real velvet scatters more light at grazing angles than at direct incidence. The shader implements `sheen = pow(sin(theta_L) * sin(theta_V), roughness)` — bright streaks where fibers catch light at grazing angles, dark recessed regions where they don't.

**Fiber normals.** Surface normals are derived from a 2D fractional Brownian motion noise (5 octaves, rotated each pass) sampled via finite differences. `grain` controls noise frequency; `depth` scales the normal deviation amplitude.

**Driver system.** All drivers feed the same `lightX` / `lightY` uniforms each frame. The component owns a single RAF tick — animation values live in refs, not state, so prop changes never re-bind the loop or re-mount the GL context.

## Browser support

WebGL 1.0 — Chrome / Edge 88+, Safari 14.1+, Firefox 63+. SSR-safe: no `window` access at module level, styles inject once on the client, the canvas only mounts after hydration.

## Credits

Built by [Subhadeep Roy](https://x.com/mvp_Subha) with [Claude](https://claude.com) — pair-programmed end-to-end, from the velvet BRDF shader and fiber normal engine to the demo gallery, playground, and four compositing variants.

## License

MIT
