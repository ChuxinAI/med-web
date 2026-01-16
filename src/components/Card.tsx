import type { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function Card({ title, action, children, className, bodyClassName }: CardProps) {
  return (
    <div className={clsx('glass-panel rounded-2xl p-4 sm:p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {title && <h3 className="text-lg font-semibold text-ink">{title}</h3>}
          {action}
        </div>
      )}
      <div className={clsx('text-sm text-slate-700', bodyClassName)}>{children}</div>
    </div>
  )}
