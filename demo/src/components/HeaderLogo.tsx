import { Velvet } from 'velvet-fx'

/**
 * The logo IS the shader. A small live velvet badge that runs the same
 * GL pipeline as everything else on the page.
 */
export function HeaderLogo() {
  return (
    <div className="header-logo" aria-hidden="true">
      <Velvet
        variant="background"
        color="#ff0022"
        sheen="#ffffff"
        driver="auto"
        speed={3}
        grain={0.45}
        intensity={1}
        roughness={7}
        depth={1}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
