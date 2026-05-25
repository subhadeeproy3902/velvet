import { useEffect, useState } from 'react'
import type { HighlighterCore } from 'shiki'
import { CopyButton } from './CopyButton'

type Lang = 'tsx' | 'ts' | 'bash' | 'json'
type ShikiTheme = 'github-dark-default' | 'github-light'

let highlighterPromise: Promise<HighlighterCore> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const [
        { createHighlighterCore },
        { createJavaScriptRegexEngine },
        themeDark,
        themeLight,
        tsx,
        bash,
        json,
      ] = await Promise.all([
        import('shiki/core'),
        import('shiki/engine/javascript'),
        import('shiki/themes/github-dark-default.mjs'),
        import('shiki/themes/github-light.mjs'),
        import('shiki/langs/tsx.mjs'),
        import('shiki/langs/bash.mjs'),
        import('shiki/langs/json.mjs'),
      ])
      return createHighlighterCore({
        themes: [themeDark.default, themeLight.default],
        langs: [tsx.default, bash.default, json.default],
        engine: createJavaScriptRegexEngine(),
      })
    })()
  }
  return highlighterPromise
}

function readShikiTheme(): ShikiTheme {
  if (typeof document === 'undefined') return 'github-dark-default'
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'github-light'
    : 'github-dark-default'
}

const cache = new Map<string, string>()

export function CodeBlock({
  code,
  lang = 'tsx',
  label,
  compact = false,
}: {
  code: string
  lang?: Lang
  label: string
  compact?: boolean
}) {
  const [shikiTheme, setShikiTheme] = useState<ShikiTheme>(readShikiTheme)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const update = () => setShikiTheme(readShikiTheme())
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => obs.disconnect()
  }, [])

  const cacheKey = `${lang}:${shikiTheme}:${code}`
  const [html, setHtml] = useState<string | null>(
    () => cache.get(cacheKey) ?? null,
  )

  useEffect(() => {
    let cancelled = false
    const cached = cache.get(cacheKey)
    if (cached) {
      setHtml(cached)
      return
    }
    getHighlighter()
      .then((hl) => {
        if (cancelled) return
        const out = hl.codeToHtml(code, {
          lang: lang === 'ts' ? 'tsx' : lang,
          theme: shikiTheme,
        })
        cache.set(cacheKey, out)
        setHtml(out)
      })
      .catch(() => {
        if (!cancelled) setHtml(null)
      })
    return () => {
      cancelled = true
    }
  }, [cacheKey, code, lang, shikiTheme])

  return (
    <div className={`code-block${compact ? '' : ' code-block--multi'}`}>
      {html ? (
        <div
          className="code-block-rendered"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <code>{code}</code>
      )}
      <CopyButton text={code} label={label} />
    </div>
  )
}
