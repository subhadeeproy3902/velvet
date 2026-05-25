import { Velvet } from 'velvet-fx'
import { useTheme } from '../hooks/useTheme'
import { PALETTES } from '../examples/palettes'

export function Hero() {
  const { color, sheen } = PALETTES.hero[useTheme()]
  return (
    <div className="hero-word">
      <Velvet
        variant="text"
        color={color}
        sheen={sheen}
        driver="auto"
        grain={1}
        intensity={1}
        depth={1}
        roughness={10}
        speed={3}
      >
        <span className="hero-word-text">Velvet</span>
      </Velvet>
    </div>
  )
}
