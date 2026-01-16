import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarNav } from '../components/SidebarNav'

const navItems = [
  { label: '开始问诊', to: '/doctor/chat' },
  { label: '问诊记录', to: '/doctor/consultations' },
  { label: '患者管理', to: '/doctor/patients' },
  { label: '病例管理', to: '/doctor/cases' },
  { label: '个人资料', to: '/doctor/settings' },
]

export function DoctorLayout() {
  useEffect(() => {
    document.title = '大用问证医生端'
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-mist via-white to-primary-50">
      <SidebarNav title="医生端" items={navItems} userName="李医生" />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-8">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
