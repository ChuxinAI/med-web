export const extractAssistantContent = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return ''
  const data = payload as {
    content?: string
    message?: { content?: string }
    assistant_message?: { content?: string }
    assistantMessage?: { content?: string }
  }
  return data.content ?? data.message?.content ?? data.assistant_message?.content ?? data.assistantMessage?.content ?? ''
}

export const isMarkdownStable = (content: string) => {
  return splitMarkdownStable(content).unstable.length === 0
}

export const splitMarkdownStable = (content: string) => {
  if (!content) {
    return { stable: '', unstable: '' }
  }

  let inFence = false
  let inInlineCode = false
  let boldStarOpen = false
  let boldUnderlineOpen = false
  let lastStableIndex = 0

  for (let i = 0; i < content.length; ) {
    if (!inInlineCode && content.startsWith('```', i)) {
      inFence = !inFence
      i += 3
      if (!inFence && !inInlineCode && !boldStarOpen && !boldUnderlineOpen) {
        lastStableIndex = i
      }
      continue
    }

    if (inFence) {
      i += 1
      continue
    }

    if (content[i] === '`') {
      inInlineCode = !inInlineCode
      i += 1
      if (!inFence && !inInlineCode && !boldStarOpen && !boldUnderlineOpen) {
        lastStableIndex = i
      }
      continue
    }

    if (!inInlineCode && content.startsWith('**', i)) {
      boldStarOpen = !boldStarOpen
      i += 2
      if (!inFence && !inInlineCode && !boldStarOpen && !boldUnderlineOpen) {
        lastStableIndex = i
      }
      continue
    }

    if (!inInlineCode && content.startsWith('__', i)) {
      boldUnderlineOpen = !boldUnderlineOpen
      i += 2
      if (!inFence && !inInlineCode && !boldStarOpen && !boldUnderlineOpen) {
        lastStableIndex = i
      }
      continue
    }

    i += 1
    if (!inFence && !inInlineCode && !boldStarOpen && !boldUnderlineOpen) {
      lastStableIndex = i
    }
  }

  return {
    stable: content.slice(0, lastStableIndex),
    unstable: content.slice(lastStableIndex),
  }
}
