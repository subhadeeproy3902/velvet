import { Velvet } from 'velvet-fx'
import { useTheme } from '../hooks/useTheme'
import { PALETTES } from './palettes'

export function TextExample() {
  const { color, sheen } = PALETTES.text[useTheme()]
  return (
    <div className="velvet-text-heading">
      <Velvet
        variant="text"
        color={color}
        sheen={sheen}
        driver="auto"
        grain={0.65}
        intensity={0.85}
        depth={0.6}
        roughness={6}
      >
        <span className="velvet-text-heading-text">light&nbsp;catches</span>
      </Velvet>
    </div>
  )
}
