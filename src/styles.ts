const STYLE_TAG_ATTR = 'data-velvet-fx'

export function injectStyles(): void {
  if (typeof document === 'undefined') return
  const css = buildCSS()
  const existing = document.querySelector<HTMLStyleElement>(
    `style[${STYLE_TAG_ATTR}]`,
  )
  if (existing) {
    // Update in place when the CSS body has actually changed — keeps
    // Vite HMR working without leaving stale rules around after a save.
    if (existing.textContent !== css) existing.textContent = css
    return
  }
  const style = document.createElement('style')
  style.setAttribute(STYLE_TAG_ATTR, '')
  style.textContent = css
  document.head.appendChild(style)
}

function buildCSS(): string {
  return `
.velvet-root {
  position: relative;
  display: inline-flex;
  isolation: isolate;
}

.velvet-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

.velvet-children {
  position: relative;
  width: 100%;
  z-index: 2;
}

.velvet-variant-background .velvet-canvas { z-index: 0; }
.velvet-variant-background .velvet-children { z-index: 2; }

.velvet-variant-border .velvet-canvas { z-index: 0; }
.velvet-variant-border .velvet-children { z-index: 2; }

/* Text variant — canvas is masked to the text glyphs in Velvet.tsx,
 * so velvet only renders inside the letters. Children stay in the
 * tree for layout sizing, hidden via plain visibility so the DOM text
 * never paints. */
.velvet-variant-text .velvet-canvas { z-index: 1; }
.velvet-variant-text .velvet-children {
  z-index: 0;
  visibility: hidden;
  /* In the inline-flex .velvet-root, the child's width:100% creates a
   * circular size: parent sizes to child, child takes 100% of parent.
   * width:auto makes the child size to its content (the text), which
   * the inline-flex wrapper then resolves against — so the canvas
   * actually has the text-bounds dimensions instead of collapsing. */
  width: auto;
}

.velvet-variant-overlay .velvet-children { z-index: 1; }
.velvet-variant-overlay .velvet-canvas {
  z-index: 2;
  mix-blend-mode: overlay;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .velvet-canvas { transition: none !important; }
}
`
}
