import { Outlet } from 'react-router-dom'
import { ShellLayout } from './ShellLayout'
import { useCurrentUser } from '../api/queries'

const navItems = [
  { label: '开始问诊', to: '/doctor/chat' },
  { label: '问诊记录', to: '/doctor/consultations' },
  { label: '患者管理', to: '/doctor/patients' },
  { label: '个人资料', to: '/doctor/settings' },
]

export function DoctorLayout() {
  const { data: profile } = useCurrentUser('doctor')
  const userName = profile?.name || profile?.username || '医生'

  return (
    <ShellLayout
      title="医生端"
      items={navItems}
      userName={userName}
      documentTitle="大用问证医生端"
      backgroundClassName="bg-gradient-to-br from-mist via-white to-primary-50"
      logoutTo="/doctor/login"
      authScope="doctor"
    >
      <Outlet />
    </ShellLayout>
  )
}
