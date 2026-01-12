import { Outlet } from 'react-router-dom'
import { SidebarNav } from '../components/SidebarNav'

const navItems = [
  { label: '问诊列表', to: '/doctor/consultations', badge: '2' },
  { label: '病例概览', to: '/doctor/cases' },
  { label: '知识库', to: '/doctor/knowledge' },
  { label: '修改密码', to: '/doctor/settings' },
]

export function DoctorLayout() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-mist via-white to-primary-50">
      <SidebarNav title="医生端" items={navItems} />
      <main className="flex-1 space-y-6 p-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">今天 · 规则优先问诊</p>
            <h1 className="text-2xl font-bold text-ink">问诊工作台</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700">
              李医生
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-soft-card">
              数据实时保存 · JWT 模拟
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
