import { FRAGMENT_SHADER, VERTEX_SHADER } from './shader'
import type { VelvetRenderOpts } from './types'

const UNIFORM_NAMES = [
  'u_resolution',
  'u_light',
  'u_time',
  'u_color',
  'u_sheen',
  'u_intensity',
  'u_grain',
  'u_depth',
  'u_roughness',
] as const

type UniformName = (typeof UNIFORM_NAMES)[number]

export interface VelvetTarget {
  canvas: HTMLCanvasElement
  ctx2d: CanvasRenderingContext2D
  opts: VelvetRenderOpts
  visible: boolean
  dpr: number
  update?: (dtMs: number) => void
}

/**
 * One WebGL context for the whole page.
 *
 * Mobile browsers cap simultaneous WebGL contexts (~8 on Safari).
 * With many Velvet instances, per-instance contexts trip that cap and
 * get evicted — which is the "scrolling loses the shader" bug. This
 * singleton owns ONE shared offscreen WebGL canvas, renders each
 * registered Velvet at its size, and `drawImage`s the result into the
 * instance's regular 2D canvas. 2D canvases are uncapped, so any
 * number of Velvets can coexist.
 *
 * The shared canvas is attached to the DOM (1×1, off-screen) because
 * Mobile Safari refuses to source `drawImage` pixels from a detached
 * WebGL canvas in some builds.
 */
class VelvetSharedRenderer {
  private static _instance: VelvetSharedRenderer | null = null
  static instance(): VelvetSharedRenderer {
    if (!VelvetSharedRenderer._instance) {
      VelvetSharedRenderer._instance = new VelvetSharedRenderer()
    }
    return VelvetSharedRenderer._instance
  }

  private glCanvas: HTMLCanvasElement
  private gl: WebGLRenderingContext | null = null
  private program: WebGLProgram | null = null
  private buffer: WebGLBuffer | null = null
  private attribLoc = -1
  private uniforms: Record<UniformName, WebGLUniformLocation | null> = {
    u_resolution: null,
    u_light: null,
    u_time: null,
    u_color: null,
    u_sheen: null,
    u_intensity: null,
    u_grain: null,
    u_depth: null,
    u_roughness: null,
  }
  private targets: VelvetTarget[] = []
  private rafId = 0
  private lastFrameMs = 0
  private initialized = false

  private constructor() {
    this.glCanvas = document.createElement('canvas')
    // Pre-allocate the shared canvas large enough for the biggest
    // realistic Velvet on the page. Per-target resizing inside the
    // render loop was wiping content between targets (each canvas.width
    // assignment recreates the WebGL drawing buffer and clobbers the
    // pending pixels of the target that just drew), leaving the early
    // targets blank. Static size = no surprise wipes.
    this.glCanvas.width = 2048
    this.glCanvas.height = 1024
    this.glCanvas.setAttribute('aria-hidden', 'true')
    this.glCanvas.setAttribute('data-velvet-fx-renderer', '')
    const s = this.glCanvas.style
    s.position = 'fixed'
    s.left = '0'
    s.top = '0'
    s.width = '1px'
    s.height = '1px'
    s.opacity = '0'
    s.pointerEvents = 'none'
    s.zIndex = '-1'
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(this.glCanvas)
    }

    this.glCanvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.program = null
      this.buffer = null
      this.initialized = false
      for (const name of UNIFORM_NAMES) this.uniforms[name] = null
      if (typeof console !== 'undefined') {
        console.warn('[velvet-fx] shared WebGL context lost; will auto-restore.')
      }
    })
    this.glCanvas.addEventListener('webglcontextrestored', () => {
      try {
        this.initGL()
      } catch (err) {
        if (typeof console !== 'undefined') {
          console.warn('[velvet-fx] restore failed:', err)
        }
      }
    })
  }

  private initGL(): void {
    const gl =
      (this.glCanvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      }) as WebGLRenderingContext | null) ??
      (this.glCanvas.getContext('experimental-webgl', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      }) as WebGLRenderingContext | null)

    if (!gl) throw new Error('velvet-fx: WebGL not supported')
    this.gl = gl

    const vs = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    const program = gl.createProgram()
    if (!program) throw new Error('velvet-fx: createProgram failed')
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? '(no log)'
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      throw new Error(`velvet-fx: link failed: ${log}`)
    }
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    this.program = program

    const buffer = gl.createBuffer()
    if (!buffer) throw new Error('velvet-fx: createBuffer failed')
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 1, -1, -1, 1,
        1, -1, 1, 1, -1, 1,
      ]),
      gl.STATIC_DRAW,
    )
    this.buffer = buffer

    this.attribLoc = gl.getAttribLocation(program, 'a_position')
    for (const name of UNIFORM_NAMES) {
      this.uniforms[name] = gl.getUniformLocation(program, name)
    }
    this.initialized = true
  }

  private compileShader(type: number, src: string): WebGLShader {
    const gl = this.gl
    if (!gl) throw new Error('velvet-fx: no gl')
    const sh = gl.createShader(type)
    if (!sh) throw new Error('velvet-fx: createShader failed')
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh) ?? '(no log)'
      gl.deleteShader(sh)
      throw new Error(`velvet-fx: compile failed: ${log}`)
    }
    return sh
  }

  register(canvas: HTMLCanvasElement): VelvetTarget | null {
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return null
    if (!this.initialized) {
      try {
        this.initGL()
      } catch (err) {
        if (typeof console !== 'undefined') {
          console.warn('[velvet-fx] renderer init failed:', err)
        }
        return null
      }
    }
    const dpr =
      typeof window !== 'undefined'
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1
    const target: VelvetTarget = {
      canvas,
      ctx2d,
      visible: true,
      dpr,
      opts: {
        lightX: 0.5,
        lightY: 0.5,
        time: 0,
        color: [0.5, 0.05, 0.1],
        sheen: [1, 0.7, 0.7],
        intensity: 0.85,
        grain: 0.6,
        depth: 0.4,
        roughness: 4,
      },
    }
    this.targets.push(target)
    if (this.rafId === 0) this.start()
    return target
  }

  unregister(target: VelvetTarget): void {
    const i = this.targets.indexOf(target)
    if (i >= 0) this.targets.splice(i, 1)
    if (this.targets.length === 0 && this.rafId !== 0) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  setVisible(target: VelvetTarget, visible: boolean): void {
    target.visible = visible
  }

  private start(): void {
    this.lastFrameMs = Date.now()
    const tick = () => {
      const now = Date.now()
      const dtMs = Math.min(now - this.lastFrameMs, 100)
      this.lastFrameMs = now
      this.frame(dtMs)
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  private frame(dtMs: number): void {
    const gl = this.gl
    if (!gl || !this.program || !this.buffer) return
    if (gl.isContextLost()) return

    gl.useProgram(this.program)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    if (this.attribLoc !== -1) {
      gl.enableVertexAttribArray(this.attribLoc)
      gl.vertexAttribPointer(this.attribLoc, 2, gl.FLOAT, false, 0, 0)
    }

    // Pass 1: per-instance state advance (time, lerp, driver-derived
    // light position). Each instance writes into its own target.opts.
    for (const t of this.targets) {
      if (!t.visible) continue
      t.update?.(dtMs)
    }

    // Pass 2: render each visible instance at its size, blit to its
    // 2D canvas. The shared GL canvas auto-grows to the largest target.
    for (const t of this.targets) {
      if (!t.visible) continue
      this.drawTarget(t, gl)
    }
  }

  private drawTarget(t: VelvetTarget, gl: WebGLRenderingContext): void {
    const cw = t.canvas.clientWidth || t.canvas.width
    const ch = t.canvas.clientHeight || t.canvas.height
    if (cw <= 0 || ch <= 0) return

    const w = Math.max(1, Math.round(cw * t.dpr))
    const h = Math.max(1, Math.round(ch * t.dpr))

    // Shared canvas is pre-allocated large enough — but if a target
    // somehow exceeds the pre-allocation, grow ONCE and keep going.
    // Avoid the per-frame width/height churn that breaks early targets.
    const needW = Math.max(this.glCanvas.width, w)
    const needH = Math.max(this.glCanvas.height, h)
    if (needW > this.glCanvas.width) this.glCanvas.width = needW
    if (needH > this.glCanvas.height) this.glCanvas.height = needH

    if (t.canvas.width !== w) t.canvas.width = w
    if (t.canvas.height !== h) t.canvas.height = h

    // gl.viewport uses WebGL window coords (y up, origin bottom-left).
    // drawImage reads using canvas image coords (y down, origin top-left).
    // Placing the viewport at the TOP of the framebuffer in window-coords
    // (== top of image after the y-flip the browser does when reading)
    // is what makes the bottom drawImage source rect line up.
    gl.viewport(0, this.glCanvas.height - h, w, h)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    const u = this.uniforms
    if (u.u_resolution !== null) gl.uniform2f(u.u_resolution, w, h)
    if (u.u_light !== null) gl.uniform2f(u.u_light, t.opts.lightX, t.opts.lightY)
    if (u.u_time !== null) gl.uniform1f(u.u_time, t.opts.time)
    if (u.u_color !== null) {
      gl.uniform3f(u.u_color, t.opts.color[0], t.opts.color[1], t.opts.color[2])
    }
    if (u.u_sheen !== null) {
      gl.uniform3f(u.u_sheen, t.opts.sheen[0], t.opts.sheen[1], t.opts.sheen[2])
    }
    if (u.u_intensity !== null) gl.uniform1f(u.u_intensity, t.opts.intensity)
    if (u.u_grain !== null) gl.uniform1f(u.u_grain, t.opts.grain)
    if (u.u_depth !== null) gl.uniform1f(u.u_depth, t.opts.depth)
    if (u.u_roughness !== null) gl.uniform1f(u.u_roughness, t.opts.roughness)

    gl.drawArrays(gl.TRIANGLES, 0, 6)

    t.ctx2d.clearRect(0, 0, w, h)
    t.ctx2d.drawImage(this.glCanvas, 0, 0, w, h, 0, 0, w, h)
  }
}

export function getRenderer(): VelvetSharedRenderer | null {
  if (typeof document === 'undefined') return null
  try {
    return VelvetSharedRenderer.instance()
  } catch {
    return null
  }
}
