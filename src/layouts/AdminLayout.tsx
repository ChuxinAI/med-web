import { Outlet } from 'react-router-dom'
import { ShellLayout } from './ShellLayout'

const navItems = [
  { label: '用户管理', to: '/admin/users' },
  { label: '知识管理', to: '/admin/catalog' },
  { label: '问诊管理', to: '/admin/stats/consultations' },
  { label: '病例管理', to: '/admin/stats/cases' },
  { label: '患者管理', to: '/admin/stats/patients' },
  { label: '个人资料', to: '/admin/settings' },
]

export function AdminLayout() {
  return (
    <ShellLayout
      title="管理端"
      items={navItems}
      userName="admin"
      documentTitle="大用问证管理端"
      backgroundClassName="bg-gradient-to-br from-white via-mist to-slate-100"
    >
      <Outlet />
    </ShellLayout>
  )
}
