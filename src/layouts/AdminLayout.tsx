import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'

const items = [
  { label: '用户管理', to: '/admin/users' },
  { label: '疾病/证型/症状/方剂', to: '/admin/catalog' },
  { label: '病例审计', to: '/admin/cases' },
  { label: '系统日志', to: '/admin/audit' },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-mist to-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-8 py-4 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Admin Console</p>
          <p className="text-2xl font-bold text-ink">管理端</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">
            admin
          </span>
          <span className="pill bg-slate-100 text-slate-600">JWT · 频控 · 审计</span>
        </div>
      </header>
      <div className="px-8 pb-10 pt-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary-600 text-white shadow-soft-card'
                    : 'bg-white text-slate-700 shadow-soft-card hover:bg-primary-50',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  )
}
