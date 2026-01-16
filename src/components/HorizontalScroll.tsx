import { useRef, useState } from 'react'
import clsx from 'clsx'

export function HorizontalScroll({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<{ active: boolean; startX: number; scrollLeft: number; pointerId: number | null }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
    pointerId: null,
  })
  const [dragging, setDragging] = useState(false)

  return (
    <div
      ref={containerRef}
      className={clsx('scroll-x', dragging ? 'select-none' : '', className)}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        const el = containerRef.current
        if (!el) return

        dragStateRef.current = {
          active: true,
          startX: event.clientX,
          scrollLeft: el.scrollLeft,
          pointerId: event.pointerId,
        }
        setDragging(true)
        el.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        const el = containerRef.current
        const state = dragStateRef.current
        if (!el || !state.active) return
        if (state.pointerId != null && event.pointerId !== state.pointerId) return

        const delta = event.clientX - state.startX
        el.scrollLeft = state.scrollLeft - delta
      }}
      onPointerUp={(event) => {
        const el = containerRef.current
        const state = dragStateRef.current
        if (!el || !state.active) return
        if (state.pointerId != null && event.pointerId !== state.pointerId) return

        dragStateRef.current = { active: false, startX: 0, scrollLeft: 0, pointerId: null }
        setDragging(false)
      }}
      onPointerCancel={(event) => {
        const el = containerRef.current
        const state = dragStateRef.current
        if (!el || !state.active) return
        if (state.pointerId != null && event.pointerId !== state.pointerId) return

        dragStateRef.current = { active: false, startX: 0, scrollLeft: 0, pointerId: null }
        setDragging(false)
      }}
    >
      {children}
    </div>
  )
}

