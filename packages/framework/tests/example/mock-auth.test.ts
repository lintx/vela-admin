import { describe, expect, it, vi } from 'vitest'

import { createPermissionService } from '../../src/index'

import {
  MOCK_AUTH_STORAGE_KEY,
  clearMockAuthSession,
  createMockAuthService,
  loadMockAuthSession,
  loginMockAccount,
  saveMockAuthSession,
} from '../../../../examples/admin/src/mock-auth.js'

describe('example mock auth', () => {
  it('creates an admin session from valid demo credentials', () => {
    const session = loginMockAccount({
      username: 'admin',
      password: 'admin123',
    })

    expect(session.token).toBe('mock-admin-token')
    expect(session.user?.name).toBe('Lin')
    expect(session.roles).toContain('admin')
    expect(session.permissions).toContain('system:role:list')
  })

  it('rejects invalid demo credentials', () => {
    expect(() => loginMockAccount({
      username: 'admin',
      password: 'wrong',
    })).toThrow('账号或密码不正确')
  })

  it('persists and clears the mock session', () => {
    const storage = createMemoryStorage()
    const session = loginMockAccount({
      username: 'operator',
      password: 'demo123',
    })

    saveMockAuthSession(session, storage)
    expect(loadMockAuthSession(storage)).toMatchObject({
      token: 'mock-operator-token',
      roles: ['operator'],
    })

    clearMockAuthSession(storage)
    expect(storage.getItem(MOCK_AUTH_STORAGE_KEY)).toBeNull()
  })

  it('ignores broken stored session data', () => {
    const storage = createMemoryStorage()
    storage.setItem(MOCK_AUTH_STORAGE_KEY, '{broken')

    expect(loadMockAuthSession(storage)).toBeNull()
  })

  it('syncs login and logout with the permission service and menu refresh', () => {
    const storage = createMemoryStorage()
    const permission = createPermissionService()
    const refreshMenus = vi.fn()
    const service = createMockAuthService({
      permission,
      storage,
      refreshMenus,
    })

    expect(service.session.value).toBeNull()
    expect(permission.isLoggedIn()).toBe(false)

    service.login({
      username: 'admin',
      password: 'admin123',
    })

    expect(service.session.value?.token).toBe('mock-admin-token')
    expect(permission.isLoggedIn()).toBe(true)
    expect(storage.getItem(MOCK_AUTH_STORAGE_KEY)).toContain('mock-admin-token')
    expect(refreshMenus).toHaveBeenCalledTimes(1)

    service.logout()

    expect(service.session.value).toBeNull()
    expect(permission.isLoggedIn()).toBe(false)
    expect(storage.getItem(MOCK_AUTH_STORAGE_KEY)).toBeNull()
    expect(refreshMenus).toHaveBeenCalledTimes(2)
  })
})

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key: string) {
      return values.get(key) ?? null
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null
    },
    removeItem(key: string) {
      values.delete(key)
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}
