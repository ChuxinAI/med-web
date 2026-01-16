import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarNav } from '../components/SidebarNav'

const navItems = [
  { label: '用户管理', to: '/admin/users' },
  { label: '知识管理', to: '/admin/catalog' },
  { label: '问诊管理', to: '/admin/stats/consultations' },
  { label: '病例管理', to: '/admin/stats/cases' },
  { label: '患者管理', to: '/admin/stats/patients' },
  { label: '个人资料', to: '/admin/settings' },
]

export function AdminLayout() {
  useEffect(() => {
    document.title = '大用问证管理端'
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-white via-mist to-slate-100">
      <SidebarNav title="管理端" items={navItems} userName="admin" />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-8">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
