import { Velvet } from 'velvet-fx'
import { useTheme } from '../hooks/useTheme'
import { PALETTES } from './palettes'

export function OverlayExample() {
  const { color, sheen } = PALETTES.overlay[useTheme()]
  return (
    <Velvet
      variant="overlay"
      color={color}
      sheen={sheen}
      driver="auto"
      speed={0.5}
      grain={0.5}
      intensity={0.9}
      roughness={4}
      depth={0.4}
      style={{ borderRadius: 18 }}
    >
      <div className="velvet-overlay-card">
        <span className="velvet-overlay-eyebrow">Midnight · auto orbit</span>
        <h3 className="velvet-overlay-title">Ambient sweep</h3>
        <p className="velvet-overlay-sub">
          Overlay sits on top of any gradient and the fabric texture
          rolls across it on its own. No cursor input needed.
        </p>
      </div>
    </Velvet>
  )
}
