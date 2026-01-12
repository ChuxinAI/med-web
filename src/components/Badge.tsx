import type { ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}

const toneMap: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-blue-100 text-blue-700',
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={clsx('pill inline-flex items-center gap-1', toneMap[tone])}>
      {children}
    </span>
  )
}
