import type { CSSProperties, HTMLAttributes } from 'react'

export type VelvetVariant = 'background' | 'border' | 'text' | 'overlay'

export type VelvetDriver = 'cursor' | 'scroll' | 'auto' | 'gyroscope' | 'static'

export interface VelvetProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /**
   * Base velvet color. Any valid CSS color string.
   * @default '#8B0000'
   */
  color?: string

  /**
   * Sheen / highlight color. Defaults to a lightened tint of `color`.
   */
  sheen?: string

  /**
   * How the shader composites onto the element.
   *  - `background`: canvas fills behind children (default)
   *  - `border`: canvas masked to a border ring around children
   *  - `text`: canvas behind children, children use `mix-blend-mode: color-dodge`
   *  - `overlay`: canvas on top of children with `mix-blend-mode: overlay`
   * @default 'background'
   */
  variant?: VelvetVariant

  /**
   * Fiber noise frequency. 0 = smooth, 1 = coarse micro-fiber.
   * Clamped to [0, 1].
   * @default 0.6
   */
  grain?: number

  /**
   * Sheen brightness multiplier. 0 = flat matte, 1 = full sheen.
   * @default 0.8
   */
  intensity?: number

  /**
   * BRDF roughness exponent. Low (2) = broad soft glow, high (10) = tight specular.
   * @default 4
   */
  roughness?: number

  /**
   * Fiber normal deviation strength. 0 = flat, 1 = deep pile.
   * @default 0.4
   */
  depth?: number

  /**
   * What drives the light direction.
   *  - `auto`: orbit via sin/cos of time (default — shader auto-animates)
   *  - `cursor`: lerp toward pointer position
   *  - `scroll`: lerp toward element scroll progress
   *  - `gyroscope`: device orientation gamma / beta
   *  - `static`: fixed light at `angle` degrees
   * @default 'auto'
   */
  driver?: VelvetDriver

  /**
   * Animation speed when `driver="auto"`. 1 = default pace.
   * @default 1
   */
  speed?: number

  /**
   * Static light angle in degrees when `driver="static"`. 0=top, 90=right.
   * @default 45
   */
  angle?: number

  /**
   * Lerp factor for cursor smoothing each animation frame.
   * 1 = instant snap, 0.01 = very slow.
   * @default 0.08
   */
  ease?: number

  /**
   * Track cursor across the whole viewport when `driver="cursor"`.
   * @default false
   */
  trackWindow?: boolean

  /**
   * Shorthand for `driver="gyroscope"`.
   * @default false
   */
  gyroscope?: boolean

  /**
   * Border ring thickness in px. Only applies when `variant="border"`.
   * @default 2
   */
  borderWidth?: number

  /**
   * Border radius of the ring mask in px. Only for `variant="border"`.
   * @default 12
   */
  borderRadius?: number

  /**
   * Freeze the shader on the current frame.
   * @default false
   */
  paused?: boolean

  /**
   * Called each frame with current light position (0–1) and intensity.
   * Use a ref in the callback, never setState.
   */
  onSheenChange?: (x: number, y: number, intensity: number) => void

  /**
   * Extra class names applied to the wrapper `<div>`.
   */
  className?: string

  /**
   * Extra inline styles applied to the wrapper `<div>`.
   */
  style?: CSSProperties
}

/**
 * The flat options bag that `Velvet.tsx` hands to `VelvetGL.render` each
 * frame. Decoupled from the React prop shape so the GL layer never has to
 * know about CSS color strings or driver semantics.
 */
export interface VelvetRenderOpts {
  /** Cursor / driver light X in 0–1 range, mapped to hemisphere. */
  lightX: number
  /** Cursor / driver light Y in 0–1 range, mapped to hemisphere. */
  lightY: number
  /** Elapsed time in seconds since component mount. */
  time: number
  /** Base velvet RGB, each channel 0–1. */
  color: [number, number, number]
  /** Sheen highlight RGB, each channel 0–1. */
  sheen: [number, number, number]
  /** Sheen brightness multiplier, 0–1. */
  intensity: number
  /** Fiber noise frequency, 0–1. */
  grain: number
  /** Fiber normal deviation strength, 0–1. */
  depth: number
  /** BRDF roughness exponent (typically 2–10). */
  roughness: number
}
