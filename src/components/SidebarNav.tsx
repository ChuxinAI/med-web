import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

interface SidebarNavProps {
  items: { label: string; to: string; icon?: string; badge?: string }[]
  title: string
}

export function SidebarNav({ items, title }: SidebarNavProps) {
  return (
    <nav className="w-64 shrink-0 space-y-6 bg-white/90 p-6 shadow-soft-card">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-1 text-xl font-bold text-ink">Med Assist</p>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-primary-100 text-primary-700 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100',
              )
            }
          >
            <span className="flex items-center gap-2">
              {item.icon && (
                <span className="text-lg text-primary-500" aria-hidden>
                  {item.icon}
                </span>
              )}
              {item.label}
            </span>
            {item.badge && (
              <span className="rounded-full bg-primary-500 px-2 py-0.5 text-xs text-white">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
      <div className="rounded-xl bg-gradient-to-r from-primary-500 to-emerald-500 p-4 text-white">
        <p className="text-sm font-semibold">规则优先 · 模型兜底</p>
        <p className="mt-1 text-xs text-white/80">保持病例完整，确认来源再采纳。</p>
      </div>
    </nav>
  )
}
