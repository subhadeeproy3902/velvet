import { useId, useMemo, useRef, useState } from 'react'
import { Velvet } from 'velvet-fx'
import type { VelvetDriver, VelvetVariant } from 'velvet-fx'
import { CodeBlock } from './CodeBlock'

const DEFAULTS = {
  color: '#8B0000',
  sheen: '#ffb8b8',
  variant: 'background' as VelvetVariant,
  driver: 'auto' as VelvetDriver,
  grain: 0.6,
  intensity: 0.85,
  roughness: 4,
  depth: 0.45,
  ease: 0.08,
  borderWidth: 3,
  speed: 1,
  angle: 45,
}

function formatProps(state: typeof DEFAULTS) {
  const lines: string[] = []
  lines.push(`variant="${state.variant}"`)
  lines.push(`driver="${state.driver}"`)
  if (state.color !== DEFAULTS.color) lines.push(`color="${state.color}"`)
  if (state.sheen !== DEFAULTS.sheen) lines.push(`sheen="${state.sheen}"`)
  if (state.grain !== DEFAULTS.grain) lines.push(`grain={${state.grain}}`)
  if (state.intensity !== DEFAULTS.intensity) lines.push(`intensity={${state.intensity}}`)
  if (state.roughness !== DEFAULTS.roughness) lines.push(`roughness={${state.roughness}}`)
  if (state.depth !== DEFAULTS.depth) lines.push(`depth={${state.depth}}`)
  if (state.ease !== DEFAULTS.ease) lines.push(`ease={${state.ease}}`)
  if (state.variant === 'border' && state.borderWidth !== DEFAULTS.borderWidth) {
    lines.push(`borderWidth={${state.borderWidth}}`)
  }
  if (state.driver === 'auto' && state.speed !== DEFAULTS.speed) {
    lines.push(`speed={${state.speed}}`)
  }
  if (state.driver === 'static' && state.angle !== DEFAULTS.angle) {
    lines.push(`angle={${state.angle}}`)
  }
  return `<Velvet\n  ${lines.join('\n  ')}\n>\n  <YourContent />\n</Velvet>`
}

const VARIANTS: VelvetVariant[] = ['background', 'border', 'text', 'overlay']
const DRIVERS: VelvetDriver[] = ['cursor', 'scroll', 'auto', 'static']

export function Playground() {
  const [state, setState] = useState(DEFAULTS)
  const ids = {
    color: useId(),
    sheen: useId(),
    grain: useId(),
    intensity: useId(),
    roughness: useId(),
    depth: useId(),
    ease: useId(),
    borderWidth: useId(),
    speed: useId(),
    angle: useId(),
  }

  const fillRef = useRef<HTMLDivElement | null>(null)
  const valRef = useRef<HTMLSpanElement | null>(null)

  // onSheenChange writes straight to the DOM via refs — no React render per
  // frame. Stable identity so Velvet's prop-mirror effect for it never fires.
  const handleSheen = useMemo(() => {
    return (x: number, y: number, intensity: number) => {
      if (fillRef.current) {
        fillRef.current.style.width = `${(x * 100).toFixed(0)}%`
      }
      if (valRef.current) {
        valRef.current.textContent = `${x.toFixed(2)} · ${y.toFixed(2)} · ${intensity.toFixed(2)}`
      }
    }
  }, [])

  const update = <K extends keyof typeof DEFAULTS>(
    key: K,
    value: (typeof DEFAULTS)[K],
  ) => {
    setState((s) => ({ ...s, [key]: value }))
  }

  const reset = () => setState(DEFAULTS)

  const codeStr = useMemo(() => formatProps(state), [state])

  // Single Velvet instance that lives across every variant switch — only
  // its children swap. Keeps the GL context (and the RAF loop) alive when
  // you flip variants, exactly the way the inline preview should behave.
  const previewChild = (() => {
    if (state.variant === 'border') {
      return (
        <div className="pg-border">
          <div className="pg-border-inner">
            <span className="pg-border-eyebrow">Border · ring mask</span>
            <h3 className="pg-border-title">Velvet rim</h3>
          </div>
        </div>
      )
    }
    if (state.variant === 'text') {
      return <span className="pg-text-big">velvet</span>
    }
    if (state.variant === 'overlay') {
      return (
        <div className="pg-overlay-card">
          <span className="pg-card-eyebrow">Overlay · blend</span>
          <h3 className="pg-card-title">Drape</h3>
          <p className="pg-card-sub">Velvet sheen on top of any gradient.</p>
        </div>
      )
    }
    return (
      <div className="pg-card">
        <span className="pg-card-eyebrow">Background</span>
        <h3 className="pg-card-title">velvet</h3>
        <p className="pg-card-sub">The shader auto-animates. Try the cursor driver too.</p>
      </div>
    )
  })()

  const preview = (
    <Velvet
      color={state.color}
      sheen={state.sheen}
      variant={state.variant}
      driver={state.driver}
      grain={state.grain}
      intensity={state.intensity}
      roughness={state.roughness}
      depth={state.depth}
      ease={state.ease}
      speed={state.speed}
      angle={state.angle}
      borderWidth={state.borderWidth}
      borderRadius={18}
      onSheenChange={handleSheen}
      style={{ borderRadius: state.variant === 'border' ? 18 : 18 }}
    >
      {previewChild}
    </Velvet>
  )

  return (
    <section className="playground-section" aria-label="Playground">
      <h2 className="section-title">Playground</h2>
      <p className="example-caption">
        Tweak every prop live. The code block below updates as you go — only
        non-default props are shown.
      </p>

      <div className="pg-preview" style={{ minHeight: state.variant === 'text' ? 240 : 360 }}>
        <div className="pg-stage">{preview}</div>
      </div>

      <div className="pg-readout">
        <span className="pg-readout-label">Sheen</span>
        <div className="pg-readout-bar">
          <div ref={fillRef} className="pg-readout-fill" />
        </div>
        <span ref={valRef} className="pg-readout-value">0.50 · 0.50 · {state.intensity.toFixed(2)}</span>
      </div>

      <div className="pg-controls">
        <div className="pg-group pg-group--full">
          <label className="control-label">Variant</label>
          <div className="control-options">
            {VARIANTS.map((v) => (
              <button
                key={v}
                type="button"
                className="tab-btn"
                data-active={state.variant === v}
                onClick={() => update('variant', v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="pg-group pg-group--full">
          <label className="control-label">Driver</label>
          <div className="control-options">
            {DRIVERS.map((d) => (
              <button
                key={d}
                type="button"
                className="tab-btn"
                data-active={state.driver === d}
                onClick={() => update('driver', d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="pg-group">
          <label className="control-label" htmlFor={ids.color}>Base color</label>
          <input
            id={ids.color}
            className="pg-color"
            type="color"
            value={state.color}
            onChange={(e) => update('color', e.target.value)}
          />
        </div>

        <div className="pg-group">
          <label className="control-label" htmlFor={ids.sheen}>Sheen color</label>
          <input
            id={ids.sheen}
            className="pg-color"
            type="color"
            value={state.sheen}
            onChange={(e) => update('sheen', e.target.value)}
          />
        </div>

        <div className="pg-group pg-group--actions">
          <label className="control-label">&nbsp;</label>
          <button type="button" className="pg-reset" onClick={reset}>
            Reset
          </button>
        </div>

        <div className="pg-group pg-group--range">
          <label className="control-label" htmlFor={ids.grain}>
            Grain <span className="pg-val">{state.grain.toFixed(2)}</span>
          </label>
          <input
            id={ids.grain}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.grain}
            onChange={(e) => update('grain', parseFloat(e.target.value))}
            className="pg-range"
          />
        </div>

        <div className="pg-group pg-group--range">
          <label className="control-label" htmlFor={ids.intensity}>
            Intensity <span className="pg-val">{state.intensity.toFixed(2)}</span>
          </label>
          <input
            id={ids.intensity}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.intensity}
            onChange={(e) => update('intensity', parseFloat(e.target.value))}
            className="pg-range"
          />
        </div>

        <div className="pg-group pg-group--range">
          <label className="control-label" htmlFor={ids.roughness}>
            Roughness <span className="pg-val">{state.roughness.toFixed(1)}</span>
          </label>
          <input
            id={ids.roughness}
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={state.roughness}
            onChange={(e) => update('roughness', parseFloat(e.target.value))}
            className="pg-range"
          />
        </div>

        <div className="pg-group pg-group--range">
          <label className="control-label" htmlFor={ids.depth}>
            Depth <span className="pg-val">{state.depth.toFixed(2)}</span>
          </label>
          <input
            id={ids.depth}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.depth}
            onChange={(e) => update('depth', parseFloat(e.target.value))}
            className="pg-range"
          />
        </div>

        <div className="pg-group pg-group--range">
          <label className="control-label" htmlFor={ids.ease}>
            Ease <span className="pg-val">{state.ease.toFixed(2)}</span>
          </label>
          <input
            id={ids.ease}
            type="range"
            min={0.01}
            max={1}
            step={0.01}
            value={state.ease}
            onChange={(e) => update('ease', parseFloat(e.target.value))}
            className="pg-range"
          />
        </div>

        {state.variant === 'border' && (
          <div className="pg-group pg-group--range">
            <label className="control-label" htmlFor={ids.borderWidth}>
              Border width <span className="pg-val">{state.borderWidth}px</span>
            </label>
            <input
              id={ids.borderWidth}
              type="range"
              min={1}
              max={20}
              step={1}
              value={state.borderWidth}
              onChange={(e) => update('borderWidth', parseInt(e.target.value, 10))}
              className="pg-range"
            />
          </div>
        )}

        {state.driver === 'auto' && (
          <div className="pg-group pg-group--range">
            <label className="control-label" htmlFor={ids.speed}>
              Speed <span className="pg-val">{state.speed.toFixed(2)}</span>
            </label>
            <input
              id={ids.speed}
              type="range"
              min={0.1}
              max={3}
              step={0.05}
              value={state.speed}
              onChange={(e) => update('speed', parseFloat(e.target.value))}
              className="pg-range"
            />
          </div>
        )}

        {state.driver === 'static' && (
          <div className="pg-group pg-group--range">
            <label className="control-label" htmlFor={ids.angle}>
              Angle <span className="pg-val">{state.angle}°</span>
            </label>
            <input
              id={ids.angle}
              type="range"
              min={0}
              max={360}
              step={1}
              value={state.angle}
              onChange={(e) => update('angle', parseInt(e.target.value, 10))}
              className="pg-range"
            />
          </div>
        )}
      </div>

      <CodeBlock code={codeStr} lang="tsx" label="Copy playground code" />
    </section>
  )
}
