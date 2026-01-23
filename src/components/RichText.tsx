import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true,
})

export function RichText({ content, className }: { content: string; className?: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(content ?? '')
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
  }, [content])

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
