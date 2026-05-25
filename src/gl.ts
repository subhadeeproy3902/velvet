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

/**
 * WebGL has a per-page simultaneous-context cap (~16 in Chrome/Edge,
 * similar in Firefox/Safari). Pages with many Velvet instances can hit
 * that cap; the oldest contexts get evicted and their canvases go
 * transparent.
 *
 * VelvetGL handles this by:
 *   1. catching `webglcontextlost` and marking the context as lost
 *   2. listening for `webglcontextrestored` and re-running all the GL
 *      setup (shaders / program / buffer / uniforms) on the fresh
 *      context the browser hands back
 *   3. skipping render() calls while in the lost state — RAF can keep
 *      calling render() safely and resume painting once restored
 */
export class VelvetGL {
  private canvas: HTMLCanvasElement
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
  private onContextLost: ((e: Event) => void) | null = null
  private onContextRestored: (() => void) | null = null
  private contextLost = false
  private disposed = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  init(): void {
    this.onContextLost = (e) => {
      e.preventDefault()
      this.contextLost = true
      // Drop our references to the now-invalid GL objects. The browser
      // will hand back a fresh context via `webglcontextrestored`.
      this.program = null
      this.buffer = null
      for (const name of UNIFORM_NAMES) this.uniforms[name] = null
      if (typeof console !== 'undefined') {
        console.warn(
          '[velvet-fx] WebGL context lost (page likely has too many WebGL canvases); will auto-restore.',
        )
      }
    }
    this.onContextRestored = () => {
      if (this.disposed) return
      try {
        this.initContext()
        this.contextLost = false
        if (typeof console !== 'undefined') {
          console.info('[velvet-fx] WebGL context restored, shader reinitialized.')
        }
      } catch (err) {
        if (typeof console !== 'undefined') {
          console.warn('[velvet-fx] reinit after restore failed:', err)
        }
      }
    }
    this.canvas.addEventListener('webglcontextlost', this.onContextLost, false)
    this.canvas.addEventListener(
      'webglcontextrestored',
      this.onContextRestored,
      false,
    )

    this.initContext()
  }

  /**
   * Single-shot setup of the GL context, shader program, buffer and
   * uniform locations. Called once at first init and again every time
   * the browser fires `webglcontextrestored`.
   */
  private initContext(): void {
    const gl =
      (this.canvas.getContext('webgl', {
        antialias: false,
        alpha: true,
        premultipliedAlpha: false,
      }) as WebGLRenderingContext | null) ??
      (this.canvas.getContext('experimental-webgl', {
        antialias: false,
        alpha: true,
        premultipliedAlpha: false,
      }) as WebGLRenderingContext | null)

    if (!gl) {
      throw new Error('velvet-fx: WebGL is not supported in this browser')
    }
    this.gl = gl

    const vs = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)

    const program = gl.createProgram()
    if (!program) throw new Error('velvet-fx: failed to create program')
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? '(no log)'
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      throw new Error(`velvet-fx: program link failed: ${log}`)
    }

    gl.deleteShader(vs)
    gl.deleteShader(fs)
    this.program = program

    const buffer = gl.createBuffer()
    if (!buffer) throw new Error('velvet-fx: failed to create buffer')
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
  }

  render(opts: VelvetRenderOpts): void {
    if (this.disposed || this.contextLost) return
    const gl = this.gl
    const program = this.program
    const buffer = this.buffer
    if (!gl || !program || !buffer) return
    // Defensive: if the context was lost without firing our listener
    // for some reason, the GL methods return errors. isContextLost()
    // is the canonical check.
    if (gl.isContextLost()) {
      this.contextLost = true
      return
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    if (this.attribLoc !== -1) {
      gl.enableVertexAttribArray(this.attribLoc)
      gl.vertexAttribPointer(this.attribLoc, 2, gl.FLOAT, false, 0, 0)
    }

    const u = this.uniforms
    if (u.u_resolution !== null) {
      gl.uniform2f(u.u_resolution, this.canvas.width, this.canvas.height)
    }
    if (u.u_light !== null) {
      gl.uniform2f(u.u_light, opts.lightX, opts.lightY)
    }
    if (u.u_time !== null) {
      gl.uniform1f(u.u_time, opts.time)
    }
    if (u.u_color !== null) {
      gl.uniform3f(u.u_color, opts.color[0], opts.color[1], opts.color[2])
    }
    if (u.u_sheen !== null) {
      gl.uniform3f(u.u_sheen, opts.sheen[0], opts.sheen[1], opts.sheen[2])
    }
    if (u.u_intensity !== null) {
      gl.uniform1f(u.u_intensity, opts.intensity)
    }
    if (u.u_grain !== null) {
      gl.uniform1f(u.u_grain, opts.grain)
    }
    if (u.u_depth !== null) {
      gl.uniform1f(u.u_depth, opts.depth)
    }
    if (u.u_roughness !== null) {
      gl.uniform1f(u.u_roughness, opts.roughness)
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  destroy(): void {
    if (this.disposed) return
    this.disposed = true
    const gl = this.gl
    if (gl && !gl.isContextLost()) {
      if (this.program) gl.deleteProgram(this.program)
      if (this.buffer) gl.deleteBuffer(this.buffer)
    }
    this.program = null
    this.buffer = null
    if (this.onContextLost) {
      this.canvas.removeEventListener(
        'webglcontextlost',
        this.onContextLost,
        false,
      )
      this.onContextLost = null
    }
    if (this.onContextRestored) {
      this.canvas.removeEventListener(
        'webglcontextrestored',
        this.onContextRestored,
        false,
      )
      this.onContextRestored = null
    }
    this.gl = null
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl
    if (!gl) throw new Error('velvet-fx: no GL context')
    const shader = gl.createShader(type)
    if (!shader) throw new Error('velvet-fx: failed to create shader')
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? '(no log)'
      gl.deleteShader(shader)
      throw new Error(`velvet-fx: shader compile failed: ${log}`)
    }
    return shader
  }
}
