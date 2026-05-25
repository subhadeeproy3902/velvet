import { CodeBlock } from './components/CodeBlock'
import { Examples } from './components/Examples'
import { Footer } from './components/Footer'
import { HeaderLogo } from './components/HeaderLogo'
import { Hero } from './components/Hero'
import { GitHubIcon, NpmIcon, XIcon } from './components/icons'
import { Library } from './components/Library'
import { Playground } from './components/Playground'
import { PropsTable } from './components/PropsTable'
import { ThemeToggle } from './components/ThemeToggle'

const installCmd = 'bun add velvet-fx'

const usageCode = `import { Velvet } from 'velvet-fx'

<Velvet
  variant="background"
  color="#8B0000"
  driver="cursor"
>
  <ProductCard />
</Velvet>`

export function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <main id="main-content" className="app">
        <header className="header">
          <nav aria-label="External links" className="top-bar-links">
            <ThemeToggle />
            <a
              className="icon-btn"
              href="https://github.com/subhadeeproy3902/velvet"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <GitHubIcon />
            </a>
            <a
              className="icon-btn"
              href="https://www.npmjs.com/package/velvet-fx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="npm"
            >
              <NpmIcon />
            </a>
            <a
              className="icon-btn"
              href="https://x.com/mvp_Subha"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
            >
              <XIcon />
            </a>
          </nav>
          <HeaderLogo />
          <Hero />
          <p className="subtitle-sm">
            WebGL velvet fabric shader for React. Four compositing variants,
            one driver prop, zero runtime dependencies.
          </p>
        </header>

        <section className="section" aria-label="Installation">
          <h2 className="section-title">Installation</h2>
          <CodeBlock code={installCmd} lang="bash" label="Copy install command" compact />
        </section>

        <section className="section" aria-label="Usage">
          <h2 className="section-title section-title--muted">Usage</h2>
          <CodeBlock code={usageCode} lang="tsx" label="Copy usage example" />
        </section>

        <Examples />

        <PropsTable />

        <Playground />

        <Library />

        <Footer />
      </main>
    </>
  )
}
