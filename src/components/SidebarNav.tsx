import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

interface SidebarNavProps {
  items: { label: string; to: string; icon?: string; badge?: string }[]
  title: string
  userName?: string
}

export function SidebarNav({ items, title, userName }: SidebarNavProps) {
  return (
    <nav className="flex h-screen w-56 shrink-0 flex-col gap-5 bg-white/90 p-5 shadow-soft-card">
      <div className="flex items-center gap-3">
        <img
          src="/logo-full.png"
          alt="大用问证"
          className="h-8 w-auto select-none"
          draggable={false}
        />
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
          {title}
        </span>
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
      {userName ? (
        <div className="mt-auto flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
          <span className="text-xs text-slate-500">当前用户</span>
          <span className="text-sm font-semibold text-ink">{userName}</span>
        </div>
      ) : null}
    </nav>
  )
}
