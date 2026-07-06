import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('example favicon', () => {
  it('uses the Vela logo as the browser favicon', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/index.html'),
      'utf8',
    )

    expect(source).toContain('<link rel="icon" type="image/svg+xml" href="/src/assets/vela-logo.svg" />')
  })
})
