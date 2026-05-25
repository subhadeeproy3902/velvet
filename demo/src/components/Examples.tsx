import { useMemo } from 'react'
import { CodeBlock } from './CodeBlock'
import { CardExample } from '../examples/CardExample'
import { BorderExample } from '../examples/BorderExample'
import { TextExample } from '../examples/TextExample'
import { OverlayExample } from '../examples/OverlayExample'
import { useTheme } from '../hooks/useTheme'
import { PALETTES } from '../examples/palettes'

export function Examples() {
  const theme = useTheme()

  // Code snippets pull from the same PALETTES table the components use,
  // so what you see in the code block is exactly what's running on the
  // page — including the live theme.
  const { cardCode, borderCode, textCode, overlayCode } = useMemo(() => {
    const card = PALETTES.card[theme]
    const border = PALETTES.border[theme]
    const text = PALETTES.text[theme]
    const overlay = PALETTES.overlay[theme]
    return {
      cardCode: `<Velvet
  variant="background"
  color="${card.color}"
  sheen="${card.sheen}"
  driver="auto"
  grain={0.6}
  intensity={0.85}
  roughness={3.5}
  depth={0.45}
>
  <ProductCard />
</Velvet>`,
      borderCode: `<Velvet
  variant="border"
  color="${border.color}"
  sheen="${border.sheen}"
  borderWidth={3}
  borderRadius={18}
  driver="auto"
  speed={3}
>
  <Panel />
</Velvet>`,
      textCode: `<Velvet
  variant="text"
  color="${text.color}"
  sheen="${text.sheen}"
  driver="auto"
>
  <span>light catches</span>
</Velvet>`,
      overlayCode: `<Velvet
  variant="overlay"
  color="${overlay.color}"
  sheen="${overlay.sheen}"
  driver="auto"
  speed={0.5}
>
  <GradientCard />
</Velvet>`,
    }
  }, [theme])

  return (
    <>
      <section className="example-section" aria-label="Background variant">
        <h2 className="example-title">Background — crimson card</h2>
        <p className="example-caption">
          Canvas fills the element; the shader drifts on its own.{' '}
          <code className="inline-code">variant="background"</code>{' '}
          <code className="inline-code">driver="auto"</code>
        </p>
        <div className="example-row-full">
          <CardExample />
        </div>
        <CodeBlock code={cardCode} lang="tsx" label="Copy background example" />
      </section>

      <section className="example-section" aria-label="Border variant">
        <h2 className="example-title">Border — emerald hairline</h2>
        <p className="example-caption">
          Same shader, masked to a ring. Only the outline shimmers — content
          stays untouched. <code className="inline-code">variant="border"</code>{' '}
          <code className="inline-code">borderWidth={'{3}'}</code>
        </p>
        <div className="example-row-full">
          <BorderExample />
        </div>
        <CodeBlock code={borderCode} lang="tsx" label="Copy border example" />
      </section>

      <section className="example-section" aria-label="Text variant">
        <h2 className="example-title">Text — purple headline</h2>
        <p className="example-caption">
          Text glyphs are the window; the velvet only renders inside the
          letters via a CSS text-shape mask on the canvas.
        </p>
        <div className="example-row-full example-row-full--mid">
          <TextExample />
        </div>
        <CodeBlock code={textCode} lang="tsx" label="Copy text example" />
      </section>

      <section className="example-section" aria-label="Overlay variant">
        <h2 className="example-title">Overlay — midnight ambient</h2>
        <p className="example-caption">
          Canvas floats on top with <code className="inline-code">mix-blend-mode: overlay</code>
          {' '}and <code className="inline-code">pointer-events: none</code>. Drape
          velvet over any content.
        </p>
        <div className="example-row-full">
          <OverlayExample />
        </div>
        <CodeBlock code={overlayCode} lang="tsx" label="Copy overlay example" />
      </section>
    </>
  )
}
