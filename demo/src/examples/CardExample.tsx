import { Velvet } from 'velvet-fx'
import { useTheme } from '../hooks/useTheme'
import { PALETTES } from './palettes'

export function CardExample() {
  const { color, sheen } = PALETTES.card[useTheme()]
  return (
    <Velvet
      variant="background"
      color={color}
      sheen={sheen}
      driver="auto"
      grain={0.6}
      intensity={0.85}
      roughness={3.5}
      depth={0.45}
      style={{ borderRadius: 18 }}
    >
      <div className="velvet-card">
        <span className="velvet-card-eyebrow">FW · 26 — crimson velvet</span>
        <h3 className="velvet-card-name">Crimson</h3>
        <p className="velvet-card-desc">
          Hand-stretched cotton velvet, dyed in 4 passes. Drape it across
          the card and the texture breathes on its own.
        </p>
      </div>
    </Velvet>
  )
}
