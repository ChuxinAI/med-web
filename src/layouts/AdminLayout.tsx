import { Outlet } from 'react-router-dom'
import { ShellLayout } from './ShellLayout'
import { useCurrentUser } from '../api/queries'

const navItems = [
  { label: '用户管理', to: '/admin/users' },
  { label: '问诊记录', to: '/admin/stats/consultations' },
  { label: '病症管理', to: '/admin/catalog' },
  { label: '患者管理', to: '/admin/stats/patients' },
  { label: '数据统计', to: '/admin/stats/overview' },
  { label: '个人资料', to: '/admin/settings' },
]

export function AdminLayout() {
  const { data: profile } = useCurrentUser('admin')
  const userName = profile?.name || profile?.username || '管理员'

  return (
    <ShellLayout
      title="管理端"
      items={navItems}
      userName={userName}
      documentTitle="大用问证管理端"
      backgroundClassName="bg-gradient-to-br from-white via-mist to-slate-100"
      logoutTo="/admin/login"
      authScope="admin"
    >
      <Outlet />
    </ShellLayout>
  )
}
