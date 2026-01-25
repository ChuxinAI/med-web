export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8100'

type AuthScope = 'doctor' | 'admin'

const ACCESS_TOKEN_KEY = 'med:accessToken'
const REFRESH_TOKEN_KEY = 'med:refreshToken'
const AUTH_SCOPE_KEY = 'med:authScope'
let authScope: AuthScope = (localStorage.getItem(AUTH_SCOPE_KEY) as AuthScope) || 'doctor'

const AUTH_HEADER_SKIP_PATHS = new Set(['/auth/login', '/auth/register', '/auth/logout'])

function resolveKey(base: string, scope: AuthScope) {
  return `${base}:${scope}`
}

export function setAuthScope(scope: AuthScope) {
  authScope = scope
  localStorage.setItem(AUTH_SCOPE_KEY, scope)
}

export function getAuthScope() {
  return authScope
}

export function getAccessToken(scope: AuthScope = authScope) {
  return localStorage.getItem(resolveKey(ACCESS_TOKEN_KEY, scope))
}

export function getRefreshToken(scope: AuthScope = authScope) {
  return localStorage.getItem(resolveKey(REFRESH_TOKEN_KEY, scope))
}

export function setAuthTokens(accessToken: string, refreshToken?: string, scope: AuthScope = authScope) {
  localStorage.setItem(resolveKey(ACCESS_TOKEN_KEY, scope), accessToken)
  if (refreshToken) {
    localStorage.setItem(resolveKey(REFRESH_TOKEN_KEY, scope), refreshToken)
  }
}

export function clearAuthTokens(scope: AuthScope = authScope) {
  localStorage.removeItem(resolveKey(ACCESS_TOKEN_KEY, scope))
  localStorage.removeItem(resolveKey(REFRESH_TOKEN_KEY, scope))
}

export function clearAllAuthTokens() {
  ;(['doctor', 'admin'] as AuthScope[]).forEach((scope) => clearAuthTokens(scope))
}

function translateErrorCode(code: string) {
  const directMap: Record<string, string> = {
    'auth.invalid_credentials': '用户名或密码不正确',
    'auth.user.not_found': '账号不存在',
    'auth.password.incorrect': '密码错误',
    'auth.user.inactive': '账号已被停用',
    'auth.user.suspended': '账号已被封禁',
    'auth.refresh.invalid_token': '登录已过期，请重新登录',
    'auth.refresh.revoked': '登录已过期，请重新登录',
    'auth.refresh.user_not_found': '账号不存在',
    'auth.sms_login.disabled': '短信登录未开启',
    'auth.token.invalid': '登录已过期，请重新登录',
    'auth.unauthorized': '登录已过期或未登录',
    'auth.forbidden': '没有权限执行该操作',
    'user.username.duplicate': '用户名已存在',
    'user.email.duplicate': '邮箱已存在',
    'user.phone.duplicate': '电话已存在',
    'user.not_found': '未找到用户',
    'user.ban.self': '不能封禁当前登录账号',
    'user.ban.last_admin': '不能封禁最后一个管理员',
    'user.password.incorrect': '原密码不正确',
    'user.conflict.unknown': '用户信息冲突，请稍后重试',
    'patient.not_found': '未找到患者',
    'consultation.not_found': '未找到问诊记录',
    'consultation.dialogue.stream.mode.invalid': '当前仅支持模型决策模式流式对话',
    'case.not_found': '未找到病例',
    'disease.not_found': '未找到病症',
    'disease.name.duplicate': '病症名称已存在',
    'file.not_found': '未找到文件',
  }
  if (directMap[code]) return directMap[code]

  if (code.endsWith('.duplicate')) {
    const lower = code.toLowerCase()
    if (lower.includes('username')) return '用户名已存在'
    if (lower.includes('phone') || lower.includes('mobile') || lower.includes('tel')) return '电话已存在'
    if (lower.includes('email')) return '邮箱已存在'
    return '信息已存在'
  }
  if (code.endsWith('.not_found')) return '未找到对应资源'
  if (code.endsWith('.forbidden')) return '没有权限执行该操作'
  if (code.endsWith('.unauthorized')) return '登录已过期或未登录'
  if (code.endsWith('.invalid')) return '参数不正确'
  if (code.endsWith('.required')) return '缺少必填项'
  return ''
}

function resolveDuplicateFieldMessage(payload: unknown) {
  if (!payload) return ''
  if (typeof payload === 'string') {
    return parseDuplicateFieldFromText(payload)
  }
  if (typeof payload !== 'object') return ''
  const maybePayload = payload as {
    detail?:
      | Array<{ msg?: string; code?: string; message?: string; loc?: Array<string | number> }>
      | { code?: string; message?: string }
      | string
    message?: string
    code?: string
  }
  const fragments: string[] = []
  if (typeof maybePayload.code === 'string') fragments.push(maybePayload.code)
  if (typeof maybePayload.message === 'string') fragments.push(maybePayload.message)
  if (typeof maybePayload.detail === 'string') fragments.push(maybePayload.detail)
  if (
    maybePayload.detail &&
    typeof maybePayload.detail === 'object' &&
    !Array.isArray(maybePayload.detail)
  ) {
    const detail = maybePayload.detail as { code?: string; message?: string }
    if (typeof detail.code === 'string') fragments.push(detail.code)
    if (typeof detail.message === 'string') fragments.push(detail.message)
  }
  if (Array.isArray(maybePayload.detail)) {
    for (const item of maybePayload.detail) {
      if (!item) continue
      if (typeof item.code === 'string') fragments.push(item.code)
      if (typeof item.message === 'string') fragments.push(item.message)
      if (typeof item.msg === 'string') fragments.push(item.msg)
      if (Array.isArray(item.loc)) {
        const loc = item.loc.filter((value) => typeof value === 'string').join('.')
        if (loc) fragments.push(loc)
      }
    }
  }
  if (fragments.length === 0) return ''
  const raw = fragments.join(' ')
  return parseDuplicateFieldFromText(raw)
}

function parseDuplicateFieldFromText(raw: string) {
  if (!raw) return ''
  const lower = raw.toLowerCase()
  const isDuplicate =
    /(duplicate|exists|exist|unique|conflict)/.test(lower) || /重复|已存在/.test(raw)
  if (!isDuplicate) return ''
  if (/(username|user_name|user\.name)/.test(lower) || /用户名|账号/.test(raw)) return '用户名已存在'
  if (/(phone|mobile|tel|telephone)/.test(lower) || /手机号|电话/.test(raw)) return '电话已存在'
  if (/(email|e-mail)/.test(lower) || /邮箱/.test(raw)) return '邮箱已存在'
  return ''
}

function resolveErrorMessage(payload: unknown, fallback: string) {
  if (!payload) return fallback
  if (typeof payload === 'string') {
    const duplicateFieldMessage = resolveDuplicateFieldMessage(payload)
    if (duplicateFieldMessage) return duplicateFieldMessage
    if (/[^\x00-\x7F]/.test(payload)) return payload
    return payload
  }
  if (typeof payload !== 'object') return fallback
  const maybePayload = payload as {
    detail?:
      | Array<{ msg?: string; code?: string; message?: string }>
      | { code?: string; message?: string }
      | string
    message?: string
    code?: string
  }
  const duplicateFieldMessage = resolveDuplicateFieldMessage(payload)
  if (duplicateFieldMessage) return duplicateFieldMessage
  if (typeof maybePayload.code === 'string') {
    const translated = translateErrorCode(maybePayload.code)
    if (translated) return translated
  }
  if (
    maybePayload.detail &&
    typeof maybePayload.detail === 'object' &&
    !Array.isArray(maybePayload.detail)
  ) {
    const detail = maybePayload.detail as { code?: string; message?: string }
    if (typeof detail.code === 'string') {
      const translated = translateErrorCode(detail.code)
      if (translated) return translated
    }
    if (typeof detail.message === 'string') {
      if (/[^\x00-\x7F]/.test(detail.message)) return detail.message
      if (typeof detail.code === 'string') {
        const translated = translateErrorCode(detail.code)
        if (translated) return translated
      }
      return detail.message
    }
  }
  if (typeof maybePayload.message === 'string') {
    if (/[^\x00-\x7F]/.test(maybePayload.message)) return maybePayload.message
    if (typeof maybePayload.code === 'string') {
      const translated = translateErrorCode(maybePayload.code)
      if (translated) return translated
    }
    return maybePayload.message
  }
  if (typeof maybePayload.detail === 'string') return maybePayload.detail
  if (Array.isArray(maybePayload.detail) && maybePayload.detail[0]) {
    const first = maybePayload.detail[0]
    if (first.code) {
      const translated = translateErrorCode(first.code)
      if (translated) return translated
    }
    if (first.message) {
      if (/[^\x00-\x7F]/.test(first.message)) return first.message
    }
    if (first.msg) {
      if (/[^\x00-\x7F]/.test(first.msg)) return first.msg
      return first.msg
    }
  }
  return fallback
}

function getStatusMessage(status: number) {
  switch (status) {
    case 400:
      return '请求参数错误'
    case 401:
      return '登录已过期或未登录'
    case 403:
      return '没有权限执行该操作'
    case 404:
      return '未找到对应资源'
    case 409:
      return '请求冲突，请稍后重试'
    case 410:
      return '邮箱已存在'
    case 411:
      return '电话已存在'
    case 412:
      return '名称已存在'
    case 422:
      return '参数校验失败'
    case 429:
      return '请求过于频繁，请稍后再试'
    case 500:
      return '服务器异常，请稍后再试'
    default:
      return '请求失败，请稍后重试'
  }
}

export function buildApiError(payload: unknown, status: number) {
  const message = resolveErrorMessage(payload, getStatusMessage(status))
  const error = new Error(message)
  ;(error as Error & { status?: number; payload?: unknown }).status = status
  ;(error as Error & { status?: number; payload?: unknown }).payload = payload
  return error
}

async function requestRaw(path: string, options: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, options)
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await requestRaw('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!response.ok) {
      return null
    }
    const data = (await response.json()) as { access_token: string; refresh_token?: string }
    setAuthTokens(data.access_token, data.refresh_token ?? refreshToken)
    return data.access_token
  } catch {
    return null
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {})
  const hasBody = Boolean(options.body)

  if (hasBody && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!AUTH_HEADER_SKIP_PATHS.has(path)) {
    const token = getAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await requestRaw(path, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers.set('Authorization', `Bearer ${refreshed}`)
      const retry = await requestRaw(path, {
        ...options,
        headers,
      })
      if (retry.ok) {
        if (retry.status === 204) {
          return undefined as T
        }
        return (await retry.json()) as T
      }
    } else {
      clearAuthTokens()
    }
  }

  if (!response.ok) {
    let payload: unknown = null
    try {
      const raw = await response.text()
      if (raw) {
        try {
          payload = JSON.parse(raw)
        } catch {
          payload = raw
        }
      }
    } catch {
      payload = null
    }
    throw buildApiError(payload, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
