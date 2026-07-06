import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const pagesRoot = resolve(__dirname, '../../../../examples/admin/src/pages')

describe('example page structure', () => {
  it('keeps only reserved flat pages at the root and groups demos by domain directories', () => {
    expect(existsSync(resolve(pagesRoot, 'index.vue'))).toBe(true)
    expect(existsSync(resolve(pagesRoot, 'login.vue'))).toBe(true)
    expect(existsSync(resolve(pagesRoot, 'icons.vue'))).toBe(true)
    expect(existsSync(resolve(pagesRoot, 'context-menu.vue'))).toBe(true)
    expect(existsSync(resolve(pagesRoot, 'permission.button.vue'))).toBe(true)

    expect(existsSync(resolve(pagesRoot, '403.vue'))).toBe(false)
    expect(existsSync(resolve(pagesRoot, '[...path].vue'))).toBe(false)
    expect(existsSync(resolve(pagesRoot, 'system.user.vue'))).toBe(false)
    expect(existsSync(resolve(pagesRoot, 'overflow-menu.[item].vue'))).toBe(false)
    expect(existsSync(resolve(pagesRoot, 'icons/index.vue'))).toBe(false)
    expect(existsSync(resolve(pagesRoot, 'context-menu/index.vue'))).toBe(false)
    expect(existsSync(resolve(pagesRoot, 'permission/button.vue'))).toBe(false)

    expect(existsSync(resolve(pagesRoot, 'system/user/index.vue'))).toBe(true)
    expect(existsSync(resolve(pagesRoot, 'system/user/[id].vue'))).toBe(true)
    expect(existsSync(resolve(pagesRoot, 'system/role/index.vue'))).toBe(true)
    expect(existsSync(resolve(pagesRoot, 'overflow-menu/[item].vue'))).toBe(true)
  })

  it('groups error pages and catch-all fallback under errors without changing navigation paths', () => {
    expect(existsSync(resolve(pagesRoot, 'exception.meta.js'))).toBe(true)
    expect(existsSync(resolve(pagesRoot, 'errors.meta.js'))).toBe(false)
    expect(existsSync(resolve(pagesRoot, 'errors/403.vue'))).toBe(true)
    expect(existsSync(resolve(pagesRoot, 'errors/404.vue'))).toBe(true)
    expect(existsSync(resolve(pagesRoot, 'errors/500.vue'))).toBe(true)
    expect(existsSync(resolve(pagesRoot, 'errors/[...path].vue'))).toBe(true)

    expect(readFileSync(resolve(pagesRoot, 'errors/403.vue'), 'utf8')).toContain("path: '/exception/403'")
    expect(readFileSync(resolve(pagesRoot, 'errors/404.vue'), 'utf8')).toContain("path: '/exception/404'")
    expect(readFileSync(resolve(pagesRoot, 'errors/500.vue'), 'utf8')).toContain("path: '/exception/500'")
  })

  it('keeps the physical 404 fallback under errors while hooking unknown routes globally', () => {
    const source = readFileSync(resolve(pagesRoot, 'errors/[...path].vue'), 'utf8')

    expect(source).toContain("path: '/:path(.*)'")
    expect(source).toContain("name: 'not-found'")
    expect(existsSync(resolve(pagesRoot, '[...path].vue'))).toBe(false)
  })
})
