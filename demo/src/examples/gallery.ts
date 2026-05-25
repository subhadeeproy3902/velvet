import type { Theme } from '../hooks/useTheme'

export type FabricKind = 'Velvet' | 'Silk' | 'Suede' | 'Satin' | 'Crushed'

export type GallerySwatch = {
  name: string
  kind: FabricKind
  color: string
  sheen: string
  grain: number
  depth: number
  roughness: number
  intensity: number
  speed?: number
}

/**
 * The five fabric "kinds" the shader can render are just preset bundles
 * of (grain, depth, roughness, intensity):
 *
 *   Silk     — smooth (low grain), sharp highlights (high roughness), shallow folds
 *   Satin    — like silk but slightly more grain & a softer highlight
 *   Velvet   — high grain (pile), medium folds, medium roughness
 *   Crushed  — high depth (dramatic folds), medium grain, low-medium roughness
 *   Suede    — very high grain, low roughness (matte), shallow folds
 */
const KIND_PRESET: Record<FabricKind, Pick<GallerySwatch, 'grain' | 'depth' | 'roughness' | 'intensity'>> = {
  Silk:    { grain: 0.18, depth: 0.55, roughness: 9.5, intensity: 1.0 },
  Satin:   { grain: 0.32, depth: 0.45, roughness: 8.0, intensity: 1.0 },
  Velvet:  { grain: 0.70, depth: 0.55, roughness: 4.0, intensity: 0.9 },
  Crushed: { grain: 0.55, depth: 0.92, roughness: 5.5, intensity: 1.0 },
  Suede:   { grain: 0.92, depth: 0.30, roughness: 2.2, intensity: 0.75 },
}

function swatch(
  name: string,
  kind: FabricKind,
  color: string,
  sheen: string,
  speed = 1.0,
): GallerySwatch {
  return { name, kind, color, sheen, speed, ...KIND_PRESET[kind] }
}

/**
 * Six swatches, one per kind plus two extras. Browsers cap simultaneous
 * WebGL contexts (~16); the rest of the page already runs the Hero, the
 * logo badge, four example sections, and the live playground — about
 * eight contexts — so the library stays under the budget.
 */
export const GALLERY: Record<Theme, GallerySwatch[]> = {
  dark: [
    swatch('Sapphire', 'Silk',    '#0d1a4a', '#bcd4ff', 1.1),
    swatch('Champagne','Satin',   '#4a3a2a', '#ffe4c4', 1.2),
    swatch('Plum',     'Velvet',  '#3a0d5a', '#d2b6ff'),
    swatch('Slate',    'Suede',   '#2a2a2a', '#a0a0a0', 0.6),
    swatch('Wine',     'Crushed', '#3a0a14', '#ff8aa0', 1.3),
    swatch('Forest',   'Velvet',  '#0a2a14', '#a4e0bc'),
  ],
  light: [
    swatch('Sapphire', 'Silk',    '#2c3a7a', '#dde6ff', 1.1),
    swatch('Champagne','Satin',   '#806a4a', '#fff0d4', 1.2),
    swatch('Plum',     'Velvet',  '#5a2a7a', '#e8d4ff'),
    swatch('Slate',    'Suede',   '#5a5a5a', '#c0c0c0', 0.6),
    swatch('Wine',     'Crushed', '#7a1c32', '#ffb4c4', 1.3),
    swatch('Forest',   'Velvet',  '#2a5a3a', '#c8ecd4'),
  ],
}
