type Row = {
  name: string
  type: string
  default: string
  description: string
}

const rows: Row[] = [
  {
    name: 'color',
    type: 'string',
    default: "'#8B0000'",
    description: 'Base velvet color. Any valid CSS color string.',
  },
  {
    name: 'sheen',
    type: 'string',
    default: 'auto',
    description:
      'Sheen / highlight color. Defaults to a lightened tint of color.',
  },
  {
    name: 'variant',
    type: "'background' | 'border' | 'text' | 'overlay'",
    default: "'background'",
    description:
      'How the shader composites onto the element. background fills behind, border masks to a ring, text uses color-dodge on children, overlay floats on top with overlay blend.',
  },
  {
    name: 'grain',
    type: 'number',
    default: '0.6',
    description:
      'Fiber noise frequency. 0 = smooth, 1 = coarse micro-fiber. Clamped to [0, 1].',
  },
  {
    name: 'intensity',
    type: 'number',
    default: '0.8',
    description:
      'Sheen brightness multiplier. 0 = flat matte, 1 = full sheen.',
  },
  {
    name: 'roughness',
    type: 'number',
    default: '4',
    description:
      'BRDF roughness exponent. Low (2) = broad soft glow. High (10) = tight specular.',
  },
  {
    name: 'depth',
    type: 'number',
    default: '0.4',
    description:
      'Fiber normal deviation strength. 0 = flat, 1 = deep pile.',
  },
  {
    name: 'driver',
    type: "'cursor' | 'scroll' | 'auto' | 'gyroscope' | 'static'",
    default: "'cursor'",
    description:
      'What drives the light direction. cursor lerps toward the pointer, scroll uses page scroll progress, auto orbits via sin/cos of time, gyroscope reads deviceorientation, static fixes the angle.',
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'Animation speed when driver="auto". 1 = default pace.',
  },
  {
    name: 'angle',
    type: 'number',
    default: '45',
    description:
      'Static light angle in degrees when driver="static". 0=top, 90=right.',
  },
  {
    name: 'ease',
    type: 'number',
    default: '0.08',
    description:
      'Lerp factor for cursor smoothing. 1 = instant snap, 0.01 = very slow.',
  },
  {
    name: 'trackWindow',
    type: 'boolean',
    default: 'false',
    description:
      'Track cursor across the whole viewport when driver="cursor". Cursor X/Y still normalize against the wrapper bounds.',
  },
  {
    name: 'gyroscope',
    type: 'boolean',
    default: 'false',
    description: 'Shorthand for driver="gyroscope".',
  },
  {
    name: 'borderWidth',
    type: 'number',
    default: '2',
    description:
      'Border ring thickness in px. Only applies when variant="border".',
  },
  {
    name: 'borderRadius',
    type: 'number',
    default: '12',
    description:
      'Border radius of the ring mask in px. Only for variant="border".',
  },
  {
    name: 'paused',
    type: 'boolean',
    default: 'false',
    description: 'Freeze the shader on the current frame.',
  },
  {
    name: 'onSheenChange',
    type: '(x, y, intensity) => void',
    default: '—',
    description:
      'Called each frame with current light position (0–1) and intensity. Use a ref in the callback, never setState.',
  },
  {
    name: 'className',
    type: 'string',
    default: '—',
    description: 'Extra class names applied to the wrapper <div>.',
  },
  {
    name: 'style',
    type: 'CSSProperties',
    default: '—',
    description: 'Extra inline styles applied to the wrapper <div>.',
  },
]

export function PropsTable() {
  return (
    <section className="section props-section" aria-label="Component props">
      <h2 className="section-title">Props</h2>
      <p className="example-caption">
        All standard <code className="inline-code">HTMLDivElement</code>{' '}
        attributes are forwarded to the wrapper. <code className="inline-code">ref</code> resolves to the wrapper <code className="inline-code">&lt;div&gt;</code>.
      </p>
      <div className="props-table-wrap">
        <table className="props-table">
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>
                  <code className="props-cell-name">{row.name}</code>
                </td>
                <td>
                  <code className="props-cell-type">{row.type}</code>
                </td>
                <td>
                  <code className="props-cell-default">{row.default}</code>
                </td>
                <td className="props-cell-desc">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
