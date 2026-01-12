import type { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ title, action, children, className }: CardProps) {
  return (
    <div className={clsx('glass-panel rounded-2xl p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold text-ink">{title}</h3>}
          {action}
        </div>
      )}
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  )}
