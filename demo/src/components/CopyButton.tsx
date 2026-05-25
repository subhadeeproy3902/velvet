import { useCallback, useState } from 'react'
import { CheckIcon, CopyIcon } from './icons'

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }, [text])
  return (
    <button
      className="copy-btn"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
    >
      <span className="copy-btn-icon">
        {copied ? <CheckIcon /> : <CopyIcon />}
      </span>
    </button>
  )
}
