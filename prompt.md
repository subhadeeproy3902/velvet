# prompt.md — Claude Code Kickoff Prompt for velvet-fx

> Paste this as your very first message in a fresh Claude Code session.
> Do not modify it. The specificity is intentional.

---

## The Prompt

Read CLAUDE.md completely and fully before doing anything else. It is the single source of truth. Do not contradict it under any circumstances.

You are building `velvet-fx` — a production-quality React npm package that applies a real-time WebGL velvet fabric shader to any element. Four compositing variants (background, border, text, overlay), five drivers (cursor, scroll, auto, gyroscope, static), a full playground, and a demo site that is a visual sibling of https://lenticular.mvp-subha.me.

---

BEFORE WRITING A SINGLE LINE OF CODE, do these two things:

1. Read CLAUDE.md fully. Every section. Including the shader code, the GL class spec, the component architecture, and the demo site requirements.

2. Read the lenticular repository at https://github.com/subhadeeproy3902/lenticular. Specifically study:
   - src/ file structure and how each file owns its responsibility
   - How styles.ts injects CSS once via a singleton pattern
   - How the RAF loop uses useRef for all animation values — never useState
   - How IntersectionObserver and ResizeObserver are set up and cleaned up
   - The demo/ folder structure — it's a completely standalone Vite app
   - The exact visual style of the demo site: dark #070707 background, the playground section, props table, footer credits format
   - The credits line in the footer — you will replicate this for velvet-fx

Only after reading both do you begin coding.

---

Work in this exact order. Complete each step fully and verify it before moving to the next.

---

STEP 1 — Scaffold

Create the exact directory structure from CLAUDE.md. Every file as a stub. Do not write any logic yet.

Root level: package.json, vite.config.ts, tsconfig.json, tsconfig.build.json, .gitignore, .npmignore, LICENSE (MIT), README.md (empty for now)

src/: index.ts, Velvet.tsx, types.ts, styles.ts, shader.ts, gl.ts — all empty stubs with the correct export signatures

demo/: its own package.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx, src/components/ (Hero, Playground, Examples, CodeBlock, PropsTable, Footer), src/examples/ (CardExample, BorderExample, TextExample, OverlayExample)

public/: copy velvet-texture.png here

Use the exact package.json from CLAUDE.md — name, version, exports map, peerDependencies, sideEffects: false, prepublishOnly script.
Use the exact vite.config.ts from CLAUDE.md — library mode, ESM + CJS, react externals.

---

STEP 2 — types.ts

Write VelvetProps interface with every prop from the props table in CLAUDE.md.
Write VelvetRenderOpts interface (the object passed to VelvetGL.render).
Add JSDoc to every prop.
Export both as named exports.

---

STEP 3 — shader.ts

Write the two GLSL string constants: VERTEX_SHADER and FRAGMENT_SHADER.

The fragment shader must implement the full velvet BRDF as specified in CLAUDE.md:
- hash() function
- noise() function using hash
- fbm() with 5 octaves, rotation matrix, for organic micro-fiber grain
- fiberNormal() that computes surface normal from the fbm height field using finite differences — uses u_grain and u_depth uniforms
- velvetBRDF() that computes pow(sinTL * sinTV, u_roughness) — high sheen at grazing angles
- main() that combines base color with ambient fbm variation + sheen contribution

All uniforms declared: u_resolution, u_light, u_time, u_color, u_sheen, u_intensity, u_grain, u_depth, u_roughness.

Test the shader by reading it yourself — trace through the math. The output should be dark base with a bright sheen sweep when u_light changes.

---

STEP 4 — gl.ts

Implement the VelvetGL class:

constructor(canvas): store canvas reference, get WebGLRenderingContext with { antialias: false, alpha: true }

init():
- Compile vertex shader from VERTEX_SHADER (compileShader helper)
- Compile fragment shader from FRAGMENT_SHADER (compileShader helper)
- createProgram, attachShader both, linkProgram
- Check link status — if failed, log the info log and throw
- Create full-screen quad: Float32Array of 6 vertices (two triangles covering NDC space: [-1,-1, 1,-1, -1,1, 1,-1, 1,1, -1,1])
- createBuffer, bindBuffer, bufferData
- Cache ALL uniform locations: u_resolution, u_light, u_time, u_color, u_sheen, u_intensity, u_grain, u_depth, u_roughness — store in this.uniforms record
- Cache attribute location for a_position
- Listen for 'webglcontextlost' on canvas — call this.destroy()

render(opts: VelvetRenderOpts):
- gl.viewport(0, 0, canvas.width, canvas.height)
- gl.clear(gl.COLOR_BUFFER_BIT)
- gl.useProgram(this.program)
- Set a_position attribute (enable, pointer)
- Set each uniform from cached location — ALWAYS guard: if (loc !== null) gl.uniform...(loc, ...)
- gl.drawArrays(gl.TRIANGLES, 0, 6)

destroy():
- gl.deleteProgram
- gl.deleteBuffer
- Remove webglcontextlost listener

TypeScript: no any. All WebGLUniformLocation | null. Guard every uniform set.

---

STEP 5 — styles.ts

Singleton CSS injection exactly like lenticular's styles.ts.

Create injectStyles() function:
- SSR guard: if (typeof document === 'undefined') return
- Check if document.querySelector('[data-velvet-fx]') already exists — if so, return
- Create <style> tag with data-velvet-fx attribute
- Inject the CSS from CLAUDE.md (velvet-root, velvet-canvas, velvet-children, variant-specific classes)
- Append to document.head

---

STEP 6 — Velvet.tsx (core — take your time)

Follow the architecture in CLAUDE.md exactly.

Props destructured with defaults in the function signature.
All animation refs as specified in CLAUDE.md.

SSR safety: use useState(false) + useEffect(() => setMounted(true), []) — render canvas only when mounted.

Mount effect (runs once after mount):
1. injectStyles()
2. new VelvetGL(canvas) → glRef.current → .init()
3. ResizeObserver on rootRef — debounce via RAF — on fire: update canvas dims, call updateBorderMask() if variant=border
4. IntersectionObserver on rootRef — sets isVisible.current
5. Attach driver event listener (cursor/scroll/gyroscope — auto and static have no listener)
6. Check prefers-reduced-motion — if true, treat ease as 1 internally
7. Start RAF loop via tick()
8. Cleanup: cancelAnimationFrame, disconnect both observers, remove event listeners, glRef.current?.destroy()

cssColorToRgb(): 1×1 canvas fillStyle trick — handles all CSS color formats.
lighten(): parse to HSL, increase L, return hsl() string — used when sheen prop is omitted.

updateBorderMask(): generate SVG data URL mask for border variant — full spec in CLAUDE.md.

tick(): exactly as specified in CLAUDE.md.
- Early return (but re-queue RAF) when paused or not visible
- Lerp currentX/Y toward targetX/Y using ease
- Resize canvas if dims changed
- Compute lx/ly based on driver (auto uses sin/cos of time, static uses angle prop, others use lerped cursor)
- Call glRef.current.render() with all shader opts
- Call onSheenChange if provided
- requestAnimationFrame(tick)

DOM structure: root div, canvas (aria-hidden), children div.
variant class goes on root: velvet-variant-${variant}

Forward ref to rootRef.
Spread all remaining HTMLDivElement props onto root div.

---

STEP 7 — src/index.ts

```ts
export { Velvet } from './Velvet'
export type { VelvetProps } from './types'
```

Nothing else.

---

STEP 8 — typecheck

Run: npm run typecheck from root.
Fix every error. Zero errors is the only acceptable outcome.
No @ts-ignore allowed.

---

STEP 9 — build

Run: npm run build from root.
Verify dist/ contains: index.es.js, index.cjs.js, index.d.ts.
If build fails, read the error and fix it. Do not skip.

---

STEP 10 — Demo site (most time-intensive step)

Study lenticular.mvp-subha.me visually before building anything. Your demo must look like it belongs in the same family.

Dark #070707 background. Same font treatment. Same section spacing. Same install command display. Same code block style.

Build components in this order:

App.tsx — imports all sections, renders them in order: Hero, Playground, Examples, PropsTable, Footer

Hero.tsx:
- Big "velvet-fx" heading using <Velvet variant="text" color="#2a0a0a" sheen="#ff4444" driver="auto" speed={0.5}> wrapping the heading text
- Subtitle: "WebGL velvet fabric shader for React. Four variants, one driver prop, zero dependencies."
- Install block: `bun add velvet-fx`
- GitHub + npm links styled like lenticular

Playground.tsx:
Left side: control panel with all sliders/pickers/selects as listed in CLAUDE.md.
Right side: live preview + live code snippet below it.
All controls use local React state — this is fine, this is not the animation loop.
The preview uses <Velvet> with all current control values as props.
The live code snippet regenerates as a JSX string from current prop values — only include props that differ from defaults.
The preview element type changes based on variant (card, border panel, big text, gradient overlay).

Examples.tsx:
Four examples from CLAUDE.md with dark backgrounds:
1. Crimson background card — variant="background", color="#8B0000", driver="cursor"
2. Emerald border panel — variant="border", color="#1a4a2a", borderWidth={3}, driver="cursor"
3. Purple text heading — variant="text", color="#1a0a3a", driver="scroll"
4. Midnight auto overlay — variant="overlay", color="#0a0a1a", driver="auto", speed={0.5}
Each with a code snippet beneath.

PropsTable.tsx:
Full props table matching CLAUDE.md's props API. Same table style as lenticular.

Footer.tsx — MUST MATCH LENTICULAR CREDITS FORMAT EXACTLY:
"Built by Subhadeep Roy with Claude — pair-programmed end-to-end, from the velvet BRDF shader and fiber normal engine to the demo gallery, playground, and four compositing variants."
MIT license. GitHub link. npm link.

---

STEP 11 — README.md

Sections in this order:
1. Title: velvet-fx
2. One-line description
3. Install
4. Quick start code block
5. Props table (same as CLAUDE.md props table)
6. Variants section — explain all four variants with code examples
7. Drivers section — explain all five drivers with code examples
8. How it works — 3 paragraphs: velvet BRDF physics, fiber normal computation, driver system
9. Browser support: WebGL 1.0 — all modern browsers
10. Credits: same format as footer
11. License: MIT

Tone: terse, technical, precise. Match lenticular's README voice. No marketing fluff.

---

STEP 12 — Run demo

cd demo && npm install && npm run dev
Verify it starts without errors.
Confirm all four variant examples render correctly.
Confirm playground controls update the live preview.
Confirm the velvet sheen visibly responds to cursor movement.
Confirm driver="auto" animates without cursor.
Confirm footer credits match lenticular format.

---

After all 12 steps, report:
- Full file tree of what was created
- npm install command
- Quick-start snippet
- Any decisions made that aren't covered in CLAUDE.md (should be minimal)

Do not ask clarifying questions. CLAUDE.md has all the answers. If something is genuinely ambiguous, make the most conservative choice and note it at the end.