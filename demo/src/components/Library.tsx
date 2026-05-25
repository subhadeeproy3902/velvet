import { Velvet } from 'velvet-fx'
import { useTheme } from '../hooks/useTheme'
import { GALLERY, type GallerySwatch } from '../examples/gallery'

/**
 * Fabric library — twelve swatches, five fabric kinds, one shader.
 * Each card is the same Velvet component with a different preset of
 * (color, sheen, grain, depth, roughness, intensity).
 */
export function Library() {
  const theme = useTheme()
  const swatches = GALLERY[theme]
  return (
    <section className="example-section library-section" aria-label="Fabric library">
      <h2 className="example-title">Library</h2>
      <p className="example-caption">
        One shader, five fabric presets. Velvet, silk, satin, suede, crushed —
        the only difference is grain × depth × roughness × intensity.
      </p>
      <div className="library-grid">
        {swatches.map((s) => (
          <SwatchCard key={`${s.kind}-${s.name}`} swatch={s} />
        ))}
      </div>
    </section>
  )
}

function SwatchCard({ swatch }: { swatch: GallerySwatch }) {
  return (
    <figure className="library-cell">
      <Velvet
        variant="background"
        driver="auto"
        color={swatch.color}
        sheen={swatch.sheen}
        grain={swatch.grain}
        depth={swatch.depth}
        roughness={swatch.roughness}
        intensity={swatch.intensity}
        speed={swatch.speed ?? 1}
        style={{
          width: '100%',
          height: 150,
          borderRadius: 14,
          display: 'flex',
        }}
      />
      <figcaption className="library-meta">
        <span className="library-meta-name">{swatch.name}</span>
        <span className="library-meta-kind">{swatch.kind}</span>
      </figcaption>
    </figure>
  )
}
