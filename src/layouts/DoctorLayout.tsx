import { Outlet } from 'react-router-dom'
import { ShellLayout } from './ShellLayout'

const navItems = [
  { label: '开始问诊', to: '/doctor/chat' },
  { label: '问诊记录', to: '/doctor/consultations' },
  { label: '患者管理', to: '/doctor/patients' },
  { label: '病例管理', to: '/doctor/cases' },
  { label: '个人资料', to: '/doctor/settings' },
]

export function DoctorLayout() {
  return (
    <ShellLayout
      title="医生端"
      items={navItems}
      userName="李医生"
      documentTitle="大用问证医生端"
      backgroundClassName="bg-gradient-to-br from-mist via-white to-primary-50"
    >
      <Outlet />
    </ShellLayout>
  )
}
