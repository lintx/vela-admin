import { ref } from 'vue'

export const MOCK_AUTH_STORAGE_KEY = 'varlet-admin:mock-auth'
export const mockAuthInjectionKey = Symbol('varlet-admin-example-auth')

export const mockAccounts = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Lin',
    title: '系统管理员',
    roles: ['admin'],
    permissions: [
      'dashboard:view',
      'system:user:list',
      'system:user:view',
      'system:user:add',
      'system:user:edit',
      'system:role:list',
      'system:role:edit',
      'permission:button:view',
      'demo:level:view',
    ],
  },
  {
    id: 2,
    username: 'operator',
    password: 'demo123',
    name: 'Chen',
    title: '运营人员',
    roles: ['operator'],
    permissions: [
      'dashboard:view',
      'system:user:list',
      'system:user:view',
      'permission:button:view',
    ],
  },
]

export function loginMockAccount(credentials) {
  const username = String(credentials?.username ?? '').trim()
  const password = String(credentials?.password ?? '')
  const account = mockAccounts.find((item) => item.username === username && item.password === password)

  if (!account) {
    throw new Error('账号或密码不正确')
  }

  return createMockSession(account)
}

export function createMockSession(account) {
  return {
    token: `mock-${account.username}-token`,
    user: {
      id: account.id,
      name: account.name,
      username: account.username,
      title: account.title,
    },
    roles: [...account.roles],
    permissions: [...account.permissions],
  }
}

export function loadMockAuthSession(storage = getDefaultStorage()) {
  if (!storage) {
    return null
  }

  const raw = storage.getItem(MOCK_AUTH_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return normalizeStoredSession(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveMockAuthSession(session, storage = getDefaultStorage()) {
  if (!storage) {
    return
  }

  storage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(normalizeStoredSession(session)))
}

export function clearMockAuthSession(storage = getDefaultStorage()) {
  storage?.removeItem(MOCK_AUTH_STORAGE_KEY)
}

export function createMockAuthService(options) {
  const permission = options.permission
  const storage = options.storage ?? getDefaultStorage()
  const refreshMenus = options.refreshMenus ?? (() => {})
  const session = ref(loadMockAuthSession(storage))

  if (session.value) {
    permission.setSession(session.value)
  } else {
    permission.clearSession()
  }

  return {
    session,
    accounts: mockAccounts,

    login(credentials) {
      const nextSession = loginMockAccount(credentials)
      session.value = nextSession
      permission.setSession(nextSession)
      saveMockAuthSession(nextSession, storage)
      refreshMenus()

      return nextSession
    },

    logout() {
      session.value = null
      permission.clearSession()
      clearMockAuthSession(storage)
      refreshMenus()
    },
  }
}

function normalizeStoredSession(session) {
  if (!session || typeof session !== 'object') {
    return null
  }

  return {
    ...session,
    roles: Array.isArray(session.roles) ? [...session.roles] : [],
    permissions: Array.isArray(session.permissions) ? [...session.permissions] : [],
  }
}

function getDefaultStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}
