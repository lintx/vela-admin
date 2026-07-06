import { describe, expect, it } from 'vitest'

import iconMeta from '../../../../examples/admin/src/pages/icons.meta.js'

describe('example icon page', () => {
  it('defines a top-level menu entry for icon usage', () => {
    expect(iconMeta).toMatchObject({
      title: '图标',
      icon: 'icons',
      order: expect.any(Number),
    })
  })
})
