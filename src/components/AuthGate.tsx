import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useCurrentUser } from '../api/queries'
import { getAccessToken, setAuthScope } from '../api/http'

const roleHomeMap: Record<string, string> = {
  admin: '/admin/users',
  doctor: '/doctor/consultations',
}

function resolveHome(role?: string) {
  if (!role) return '/doctor/login'
  return roleHomeMap[role] ?? '/doctor/consultations'
}

export function RequireAuth({
  allowedRoles,
  redirectTo,
  scope,
  children,
}: {
  allowedRoles: string[]
  redirectTo: string
  scope: 'doctor' | 'admin'
  children: ReactNode
}) {
  useEffect(() => {
    setAuthScope(scope)
  }, [scope])

  const token = getAccessToken(scope)
  const { data: user, isLoading, error } = useCurrentUser(scope)

  if (!token) {
    return <Navigate to={redirectTo} replace />
  }

  if (isLoading) {
    return <div className="flex h-full min-h-[50vh] items-center justify-center text-sm text-slate-500">正在验证登录...</div>
  }

  if (error || !user) {
    return <Navigate to={redirectTo} replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={resolveHome(user.role)} replace />
  }

  return <>{children}</>
}

export function GuestOnly({ scope, children }: { scope: 'doctor' | 'admin'; children: ReactNode }) {
  useEffect(() => {
    setAuthScope(scope)
  }, [scope])

  const token = getAccessToken(scope)
  const { data: user, isLoading } = useCurrentUser(scope)

  if (isLoading) return null
  if (!token) return <>{children}</>

  if (user) {
    return <Navigate to={resolveHome(user.role)} replace />
  }

  return <>{children}</>
}
