import type { UserSummary } from '../types'
import { apiRequest, clearAuthTokens, getRefreshToken, setAuthScope, setAuthTokens } from './http'
import type { TokenResponseDto, UserSummaryDto } from './backendTypes'
import { toUserSummary } from './backendMappers'

export async function loginWithCredentials(identifier: string, password: string) {
  const token = await apiRequest<TokenResponseDto>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
  setAuthTokens(token.access_token, token.refresh_token)
  return token
}

export async function logout(refreshToken?: string) {
  const token = refreshToken ?? getRefreshToken()
  try {
    if (token) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: token }),
      })
    }
  } finally {
    clearAuthTokens()
  }
}

export async function fetchCurrentUser(scope?: 'doctor' | 'admin'): Promise<UserSummary> {
  if (scope) setAuthScope(scope)
  const dto = await apiRequest<UserSummaryDto>('/auth/me')
  return toUserSummary(dto)
}

export async function updateCurrentUser(patch: Partial<UserSummary>) {
  const body = {
    username: patch.username,
    name: patch.name,
    org: patch.org,
    province: patch.province,
    city: patch.city,
    county: patch.county,
    phone: patch.phone,
    email: patch.email,
    note: patch.note,
  }
  const dto = await apiRequest<UserSummaryDto>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return toUserSummary(dto)
}

export async function changeMyPassword(oldPassword: string, newPassword: string) {
  await apiRequest('/auth/me/password', {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  })
}

export async function registerDoctor(input: {
  username: string
  phone?: string
  email?: string
  password: string
  name?: string
  org?: string
  province?: string
  city?: string
  county?: string
  note?: string
}) {
  return apiRequest<UserSummaryDto>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: input.username,
      phone: input.phone,
      email: input.email,
      password: input.password,
      name: input.name,
      org: input.org,
      province: input.province,
      city: input.city,
      county: input.county,
      note: input.note,
      role: 'doctor',
    }),
  })
}
