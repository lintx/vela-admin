import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('example users page', () => {
  it('keeps user actions reachable on narrow screens with a mobile list', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/src/pages/system/user/index.vue'),
      'utf8',
    )

    expect(source).toContain('admin-users__mobile-list')
    expect(source).toContain('admin-users__desktop-table')
    expect(source).toContain('@media (max-width: 720px)')
    expect(source).toContain('openDetail(user.id)')
  })
})
