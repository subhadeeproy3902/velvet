import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CSSProperties } from 'react'
import type { VelvetDriver, VelvetProps, VelvetVariant } from './types'
import { injectStyles } from './styles'
import { getRenderer, type VelvetTarget } from './renderer'

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v

/** Resolve any CSS color string to linear-ish 0–1 RGB via a 1×1 canvas. */
function cssColorToRgb(css: string): [number, number, number] {
  if (typeof document === 'undefined') return [0, 0, 0]
  const c = document.createElement('canvas')
  c.width = 1
  c.height = 1
  const ctx = c.getContext('2d')
  if (!ctx) return [0, 0, 0]
  ctx.fillStyle = '#000'
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const d = ctx.getImageData(0, 0, 1, 1).data
  return [d[0] / 255, d[1] / 255, d[2] / 255]
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s, l]
}

/** Lighten a CSS color by parsing through HSL and bumping L. */
function lighten(css: string, amount: number): string {
  const [r, g, b] = cssColorToRgb(css)
  const [h, s, l] = rgbToHsl(r, g, b)
  const newL = clamp(l + amount, 0, 1)
  return `hsl(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(newL * 100).toFixed(1)}%)`
}

export const Velvet = forwardRef<HTMLDivElement, VelvetProps>(
  function Velvet(props, forwardedRef) {
    const {
      color = '#8B0000',
      sheen,
      variant = 'background',
      grain = 0.6,
      intensity = 0.8,
      roughness = 4,
      depth = 0.4,
      driver = 'auto',
      speed = 1,
      angle = 45,
      ease = 0.08,
      trackWindow = false,
      gyroscope = false,
      borderWidth = 2,
      borderRadius = 12,
      paused = false,
      onSheenChange,
      className,
      style,
      children,
      ...rest
    } = props

    const effectiveDriver: VelvetDriver = gyroscope ? 'gyroscope' : driver

    const rootRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const childrenRef = useRef<HTMLDivElement | null>(null)
    const targetRef = useRef<VelvetTarget | null>(null)
    const currentX = useRef(0.5)
    const currentY = useRef(0.5)
    const targetX = useRef(0.5)
    const targetY = useRef(0.5)
    // Accumulated, speed-scaled clock fed to the shader as u_time. Using a
    // monotonic accumulator (instead of `Date.now() - startTime`) lets the
    // `speed` prop scale the drift rate without time jumps when it changes.
    const shaderTime = useRef(0)
    const lastFrame = useRef(0)
    const isVisible = useRef(true)
    const reduceMotion = useRef(false)

    // Prop mirrors so the RAF tick always reads the latest values
    // without re-binding the loop or re-mounting GL each prop change.
    const colorRef = useRef(color)
    const sheenColorRef = useRef<string>(sheen ?? lighten(color, 0.45))
    const variantRef = useRef<VelvetVariant>(variant)
    const grainRef = useRef(grain)
    const intensityRef = useRef(intensity)
    const roughnessRef = useRef(roughness)
    const depthRef = useRef(depth)
    const driverRef = useRef<VelvetDriver>(effectiveDriver)
    const speedRef = useRef(speed)
    const angleRef = useRef(angle)
    const easeRef = useRef(ease)
    const pausedRef = useRef(paused)
    const borderWidthRef = useRef(borderWidth)
    const borderRadiusRef = useRef(borderRadius)
    const trackWindowRef = useRef(trackWindow)
    const onSheenChangeRef = useRef(onSheenChange)
    const colorRgbRef = useRef<[number, number, number]>([0, 0, 0])
    const sheenRgbRef = useRef<[number, number, number]>([1, 1, 1])

    const [mounted, setMounted] = useState(false)

    useImperativeHandle(
      forwardedRef,
      () => rootRef.current as HTMLDivElement,
      [],
    )

    useEffect(() => {
      setMounted(true)
    }, [])

    // Recompute resolved colors when color / sheen props change.
    useEffect(() => {
      colorRef.current = color
      colorRgbRef.current = cssColorToRgb(color)
      const resolvedSheen = sheen ?? lighten(color, 0.45)
      sheenColorRef.current = resolvedSheen
      sheenRgbRef.current = cssColorToRgb(resolvedSheen)
    }, [color, sheen])

    useEffect(() => { variantRef.current = variant }, [variant])
    useEffect(() => { grainRef.current = clamp(grain, 0, 1) }, [grain])
    useEffect(() => { intensityRef.current = clamp(intensity, 0, 1) }, [intensity])
    useEffect(() => { roughnessRef.current = Math.max(0.1, roughness) }, [roughness])
    useEffect(() => { depthRef.current = clamp(depth, 0, 1) }, [depth])
    useEffect(() => { driverRef.current = effectiveDriver }, [effectiveDriver])
    useEffect(() => { speedRef.current = speed }, [speed])
    useEffect(() => { angleRef.current = angle }, [angle])
    useEffect(() => { easeRef.current = clamp(ease, 0.001, 1) }, [ease])
    useEffect(() => { pausedRef.current = paused }, [paused])
    useEffect(() => { borderWidthRef.current = Math.max(0, borderWidth) }, [borderWidth])
    useEffect(() => { borderRadiusRef.current = Math.max(0, borderRadius) }, [borderRadius])
    useEffect(() => { trackWindowRef.current = trackWindow }, [trackWindow])
    useEffect(() => { onSheenChangeRef.current = onSheenChange }, [onSheenChange])

    const updateBorderMask = useCallback(() => {
      if (variantRef.current !== 'border') return
      const root = rootRef.current
      const canvas = canvasRef.current
      if (!root || !canvas) return
      const w = root.offsetWidth
      const h = root.offsetHeight
      if (w <= 0 || h <= 0) return
      const bw = borderWidthRef.current
      const br = borderRadiusRef.current
      const innerR = Math.max(0, br - bw)
      const innerW = Math.max(0, w - bw * 2)
      const innerH = Math.max(0, h - bw * 2)
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
        `<defs><mask id="m">` +
        `<rect width="${w}" height="${h}" rx="${br}" ry="${br}" fill="white"/>` +
        `<rect x="${bw}" y="${bw}" width="${innerW}" height="${innerH}" rx="${innerR}" ry="${innerR}" fill="black"/>` +
        `</mask></defs>` +
        `<rect width="${w}" height="${h}" fill="white" mask="url(#m)"/>` +
        `</svg>`
      const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
      canvas.style.maskImage = url
      canvas.style.webkitMaskImage = url
      canvas.style.maskRepeat = 'no-repeat'
      canvas.style.webkitMaskRepeat = 'no-repeat'
      canvas.style.maskSize = '100% 100%'
      canvas.style.webkitMaskSize = '100% 100%'
    }, [])

    const clearMask = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.style.maskImage = ''
      canvas.style.webkitMaskImage = ''
    }, [])

    /**
     * Text variant — make the text glyphs a window into the velvet.
     *
     * Drawn into an offscreen 2D canvas (NOT an SVG data URL): SVG used
     * via mask-image is rendered in a sandboxed context that has no
     * access to document @font-face webfonts — Prata/Manrope/anything
     * loaded by the page would silently fall back to a system serif.
     * canvas2D's text rendering, on the other hand, does see document
     * fonts. We also await document.fonts.load() so the very first
     * paint uses the real face, not a fallback.
     */
    const updateTextMask = useCallback(() => {
      if (variantRef.current !== 'text') return
      const root = rootRef.current
      const canvas = canvasRef.current
      const childrenEl = childrenRef.current
      if (!root || !canvas || !childrenEl) return

      const w = root.offsetWidth
      const h = root.offsetHeight
      if (w <= 0 || h <= 0) return

      // Prefer the deepest single text-bearing element so getComputedStyle
      // reflects the actual rendered font, not the wrapper's defaults.
      let textEl: Element = childrenEl
      let cursor: Element | null = childrenEl
      while (cursor) {
        const next: Element | null = cursor.firstElementChild
        if (!next) break
        textEl = next
        cursor = next
      }
      const rawText = (textEl.textContent ?? '').trim()
      if (!rawText) {
        clearMask()
        return
      }

      const cs = getComputedStyle(textEl as HTMLElement)
      const fontFamily = cs.fontFamily || 'sans-serif'
      const fontSize = cs.fontSize || '32px'
      const fontWeight = cs.fontWeight || '400'
      const fontStyle = cs.fontStyle || 'normal'
      const letterSpacingRaw = cs.letterSpacing
      const letterSpacing =
        !letterSpacingRaw || letterSpacingRaw === 'normal'
          ? '0px'
          : letterSpacingRaw
      const textTransform = cs.textTransform || 'none'
      const fontShorthand = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`

      // Apply text-transform so the mask renders the same casing the
      // visible HTML text would have. Without this, CSS `text-transform:
      // uppercase` on the children left the canvas drawing the raw
      // (lowercase) textContent, and the velvet was clipped to the
      // wrong glyph shapes.
      let text = rawText
      if (textTransform === 'uppercase') text = rawText.toUpperCase()
      else if (textTransform === 'lowercase') text = rawText.toLowerCase()
      else if (textTransform === 'capitalize') {
        text = rawText.replace(/\b\w/g, (c) => c.toUpperCase())
      }

      // Backing store at DPR for crisp glyph edges
      const dpr =
        typeof window !== 'undefined'
          ? Math.min(window.devicePixelRatio || 1, 2)
          : 1
      const pw = Math.max(1, Math.round(w * dpr))
      const ph = Math.max(1, Math.round(h * dpr))

      const draw = () => {
        const mc = document.createElement('canvas')
        mc.width = pw
        mc.height = ph
        const ctx = mc.getContext('2d')
        if (!ctx) return
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, w, h)

        // canvas2D font shorthand parser is stricter than CSS — if the
        // assignment "doesn't take" it silently retains the previous
        // value (default "10px sans-serif"), and the masked text ends
        // up minuscule. Try the spec-canonical shorthand first; if
        // ctx.font ends up reflecting the default, fall back to a
        // simpler form that strips alternate families.
        ctx.font = fontShorthand
        if (ctx.font === '10px sans-serif' && fontSize !== '10px') {
          const firstFamily = fontFamily
            .split(',')[0]
            .trim()
            .replace(/^['"]|['"]$/g, '')
          ctx.font = `${fontWeight} ${fontSize} ${firstFamily}, sans-serif`
          // If even that fails, drop the weight too — some parsers choke
          // on numeric weights with quoted families.
          if (ctx.font === '10px sans-serif') {
            ctx.font = `${fontSize} ${firstFamily}, sans-serif`
          }
        }

        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const ctxAny = ctx as CanvasRenderingContext2D & {
          letterSpacing?: string
        }
        if ('letterSpacing' in ctxAny) {
          ctxAny.letterSpacing = letterSpacing
        }
        ctx.fillText(text, w / 2, h / 2)
        const url = `url("${mc.toDataURL('image/png')}")`
        canvas.style.maskImage = url
        canvas.style.webkitMaskImage = url
        canvas.style.maskRepeat = 'no-repeat'
        canvas.style.webkitMaskRepeat = 'no-repeat'
        canvas.style.maskSize = '100% 100%'
        canvas.style.webkitMaskSize = '100% 100%'
      }

      // Draw once immediately so the velvet appears at hydration time,
      // then redraw on three signals so we catch every late-binding
      // scenario: the targeted .load(), all-fonts-ready, and one
      // RAF-tick delay (the SAFEST signal that the font metrics are
      // queryable in canvas2D after the document's @font-face fetched).
      draw()
      if (
        typeof document !== 'undefined' &&
        'fonts' in document &&
        document.fonts
      ) {
        document.fonts.load(fontShorthand, text).then(draw).catch(() => {})
        if (document.fonts.ready) {
          document.fonts.ready.then(() => {
            draw()
            // One more RAF later — some browsers report fonts.ready
            // resolved before canvas2D's internal font metric cache
            // has refreshed.
            requestAnimationFrame(draw)
          }).catch(() => {})
        }
      }
    }, [clearMask])

    useEffect(() => {
      if (variant === 'border') updateBorderMask()
      else if (variant === 'text') updateTextMask()
      else clearMask()
    }, [
      variant,
      borderWidth,
      borderRadius,
      mounted,
      updateBorderMask,
      updateTextMask,
      clearMask,
      children,
    ])

    // Per-instance per-frame update, called BY the shared renderer's
    // RAF loop (no per-Velvet RAF — one global loop for the whole page).
    // Advances time / lerp / driver-derived light position and writes
    // them into target.opts; the renderer reads those and renders.
    const targetUpdate = useCallback((dtMs: number) => {
      const target = targetRef.current
      if (!target) return
      if (pausedRef.current) return

      const e = reduceMotion.current ? 1 : easeRef.current
      currentX.current += (targetX.current - currentX.current) * e
      currentY.current += (targetY.current - currentY.current) * e

      // Speed-scaled monotonic clock, wrapped at 1000s so mediump
      // float (mobile) keeps full precision indexing the noise field.
      shaderTime.current =
        (shaderTime.current + (dtMs / 1000) * speedRef.current) % 1000

      const drv = driverRef.current
      let lx: number
      let ly: number
      if (drv === 'auto') {
        lx = 0.5
        ly = 0.5
      } else if (drv === 'static') {
        const rad = (angleRef.current * Math.PI) / 180
        lx = 0.5 + Math.sin(rad) * 0.45
        ly = 0.5 - Math.cos(rad) * 0.45
      } else {
        lx = currentX.current
        ly = currentY.current
      }

      target.opts.lightX = lx
      target.opts.lightY = ly
      target.opts.time = shaderTime.current
      target.opts.color = colorRgbRef.current
      target.opts.sheen = sheenRgbRef.current
      target.opts.intensity = intensityRef.current
      target.opts.grain = grainRef.current
      target.opts.depth = depthRef.current
      target.opts.roughness = roughnessRef.current

      onSheenChangeRef.current?.(lx, ly, intensityRef.current)
    }, [])

    useEffect(() => {
      if (!mounted) return
      const root = rootRef.current
      const canvas = canvasRef.current
      if (!root || !canvas) return

      injectStyles()
      lastFrame.current = Date.now()
      shaderTime.current = 0
      colorRgbRef.current = cssColorToRgb(colorRef.current)
      sheenRgbRef.current = cssColorToRgb(sheenColorRef.current)

      // Register with the SHARED renderer — one WebGL context for the
      // whole page. Each <Velvet>'s canvas is a regular 2D canvas that
      // receives the shader output via drawImage. 2D contexts are
      // uncapped, so the browser's per-page WebGL cap is never tripped
      // no matter how many Velvets are on the page, and the context
      // can't be lost by rapid scrolling because there's only one.
      const renderer = getRenderer()
      let registered = false
      const tryRegister = () => {
        if (registered || targetRef.current) return
        registered = true
        if (!renderer) {
          // No WebGL at all: solid-color 2D fallback so the wrapper
          // doesn't read as transparent (which is page-bg-white in
          // light mode).
          try {
            const ctx2d = canvas.getContext('2d')
            if (ctx2d) {
              canvas.width = Math.max(1, root.offsetWidth)
              canvas.height = Math.max(1, root.offsetHeight)
              ctx2d.fillStyle = colorRef.current
              ctx2d.fillRect(0, 0, canvas.width, canvas.height)
            }
          } catch {}
          return
        }
        const target = renderer.register(canvas)
        if (!target) {
          registered = false
          return
        }
        target.update = targetUpdate
        targetRef.current = target
        if (typeof window !== 'undefined') {
          ;(window as unknown as { __VELVET_FX__?: string }).__VELVET_FX__ = '1.0.0'
        }
        // Mask drawing depends on the canvas being at its final size.
        if (variantRef.current === 'border') updateBorderMask()
        else if (variantRef.current === 'text') updateTextMask()
      }

      const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
      reduceMotion.current = mql.matches
      const handleMql = (ev: MediaQueryListEvent) => {
        reduceMotion.current = ev.matches
      }
      mql.addEventListener('change', handleMql)

      let resizeRaf: number | null = null
      const ro = new ResizeObserver(() => {
        if (resizeRaf != null) cancelAnimationFrame(resizeRaf)
        resizeRaf = requestAnimationFrame(() => {
          resizeRaf = null
          updateBorderMask()
          updateTextMask()
        })
      })
      ro.observe(root)

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            isVisible.current = entry.isIntersecting
            // First scroll-into-view registers with the shared renderer
            // (idempotent). Subsequent transitions toggle target.visible
            // so the renderer can skip off-screen targets cheaply
            // without ever losing them.
            if (entry.isIntersecting) tryRegister()
            if (renderer && targetRef.current) {
              renderer.setVisible(targetRef.current, entry.isIntersecting)
            }
          }
        },
        { threshold: 0, rootMargin: '300px' },
      )
      io.observe(root)

      // Synchronous check for elements that are already inside the
      // viewport at mount — avoids the one-frame gap before the
      // IntersectionObserver fires its first callback.
      const rect = root.getBoundingClientRect()
      const initiallyVisible =
        rect.top < (window.innerHeight || 0) + 300 &&
        rect.bottom > -300 &&
        rect.left < (window.innerWidth || 0) + 300 &&
        rect.right > -300
      if (initiallyVisible) {
        isVisible.current = true
        tryRegister()
      }

      // Stylesheet mutation observer — regenerates the text/border mask
      // when CSS rules affecting the children change (Vite HMR style
      // swaps, devtools edits, dynamically-added stylesheets). Without
      // this the canvas2D mask is frozen at first paint and CSS edits
      // like `text-transform: uppercase` only show up on a hard refresh.
      let maskRaf: number | null = null
      const queueMaskUpdate = () => {
        if (maskRaf != null) return
        maskRaf = requestAnimationFrame(() => {
          maskRaf = null
          if (variantRef.current === 'text') updateTextMask()
          else if (variantRef.current === 'border') updateBorderMask()
        })
      }
      const headObserver = new MutationObserver(queueMaskUpdate)
      headObserver.observe(document.head, { childList: true, subtree: true })
      // Also watch the document element so theme toggle (data-theme
      // attribute) re-runs the mask with the new computed font color.
      const docObserver = new MutationObserver(queueMaskUpdate)
      docObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class'],
      })

      if (variantRef.current === 'border') {
        // Run once after mount in case ResizeObserver hasn't fired yet.
        updateBorderMask()
      } else if (variantRef.current === 'text') {
        updateTextMask()
      }

      // No per-instance RAF — the shared renderer owns the loop and
      // calls target.update on each registered target every frame.

      return () => {
        if (resizeRaf != null) cancelAnimationFrame(resizeRaf)
        if (maskRaf != null) cancelAnimationFrame(maskRaf)
        ro.disconnect()
        io.disconnect()
        headObserver.disconnect()
        docObserver.disconnect()
        mql.removeEventListener('change', handleMql)
        if (renderer && targetRef.current) {
          renderer.unregister(targetRef.current)
        }
        targetRef.current = null
      }
    }, [mounted, targetUpdate, updateBorderMask, updateTextMask])

    // Cursor driver (mouse / touch)
    useEffect(() => {
      if (!mounted) return
      if (effectiveDriver !== 'cursor') return
      const root = rootRef.current
      if (!root) return

      const setFromClient = (clientX: number, clientY: number) => {
        const rect = root.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return
        targetX.current = clamp((clientX - rect.left) / rect.width, 0, 1)
        targetY.current = clamp((clientY - rect.top) / rect.height, 0, 1)
      }

      const onMove = (e: MouseEvent) => setFromClient(e.clientX, e.clientY)
      const onTouch = (e: TouchEvent) => {
        const t = e.touches[0]
        if (t) setFromClient(t.clientX, t.clientY)
      }

      if (trackWindowRef.current) {
        window.addEventListener('mousemove', onMove, { passive: true })
        window.addEventListener('touchmove', onTouch, { passive: true })
        return () => {
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('touchmove', onTouch)
        }
      }

      root.addEventListener('mousemove', onMove, { passive: true })
      root.addEventListener('touchmove', onTouch, { passive: true })
      return () => {
        root.removeEventListener('mousemove', onMove)
        root.removeEventListener('touchmove', onTouch)
      }
    }, [mounted, effectiveDriver, trackWindow])

    // Scroll driver
    useEffect(() => {
      if (!mounted) return
      if (effectiveDriver !== 'scroll') return
      const root = rootRef.current
      if (!root) return

      const compute = () => {
        const rect = root.getBoundingClientRect()
        const vh = window.innerHeight || 1
        const p = clamp(1 - rect.top / vh, 0, 1)
        targetY.current = p
        // Sweep X horizontally with scroll progress too for visual interest.
        targetX.current = p
      }

      compute()
      window.addEventListener('scroll', compute, { passive: true })
      window.addEventListener('resize', compute, { passive: true })
      return () => {
        window.removeEventListener('scroll', compute)
        window.removeEventListener('resize', compute)
      }
    }, [mounted, effectiveDriver])

    // Gyroscope driver
    useEffect(() => {
      if (!mounted) return
      if (effectiveDriver !== 'gyroscope') return
      if (typeof window === 'undefined') return
      if (!('DeviceOrientationEvent' in window)) return

      const onOrient = (e: DeviceOrientationEvent) => {
        if (e.gamma != null) {
          // gamma: -90..90 → 0..1
          targetX.current = clamp((e.gamma + 90) / 180, 0, 1)
        }
        if (e.beta != null) {
          // beta: -180..180 → 0..1
          targetY.current = clamp((e.beta + 180) / 360, 0, 1)
        }
      }

      window.addEventListener('deviceorientation', onOrient)
      return () => window.removeEventListener('deviceorientation', onOrient)
    }, [mounted, effectiveDriver])

    const composedClassName = useMemo(() => {
      const parts = ['velvet-root', `velvet-variant-${variant}`]
      if (className) parts.push(className)
      return parts.join(' ')
    }, [variant, className])

    const rootStyle = useMemo<CSSProperties>(() => {
      const s: CSSProperties = { ...style }
      if (variant === 'border' && s.borderRadius == null) {
        s.borderRadius = borderRadius
      }
      return s
    }, [style, variant, borderRadius])

    return (
      <div
        ref={rootRef}
        className={composedClassName}
        style={rootStyle}
        {...rest}
      >
        {mounted && (
          <canvas
            ref={canvasRef}
            className="velvet-canvas"
            aria-hidden="true"
          />
        )}
        <div ref={childrenRef} className="velvet-children">{children}</div>
      </div>
    )
  },
)

Velvet.displayName = 'Velvet'
