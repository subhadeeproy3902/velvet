import { Velvet } from 'velvet-fx'
import { useTheme } from '../hooks/useTheme'
import { PALETTES } from './palettes'

export function BorderExample() {
  const { color, sheen } = PALETTES.border[useTheme()]
  return (
    <Velvet
      variant="border"
      color={color}
      sheen={sheen}
      driver="auto"
      speed={3}
      grain={0.5}
      intensity={1}
      roughness={5}
      depth={0.4}
      borderWidth={6}
      borderRadius={18}
    >
      <div className="velvet-border-panel">
        <div className="velvet-border-inner">
          <span className="velvet-border-sub">Emerald · border ring</span>
          <h3 className="velvet-border-title">Velvet hairline</h3>
          <p className="velvet-border-body">
            The shader fills the canvas, then an SVG ring mask cuts the
            interior. Only the outline shimmers — content stays clean.
          </p>
        </div>
      </div>
    </Velvet>
  )
}
