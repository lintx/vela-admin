import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('example page surfaces', () => {
  it('does not use paper or card as example page surfaces', () => {
    const files = [
      ...collectVueFiles(resolve(__dirname, '../../../../examples/admin/src/pages')),
      ...collectVueFiles(resolve(__dirname, '../../../../examples/admin/src/components')),
    ]
    const surfaceFiles = files.filter((file) => {
      const source = readFileSync(file, 'utf8')

      return source.includes('<var-paper') || source.includes('<var-card')
    })

    expect(surfaceFiles).toEqual([])
  })

  it('keeps context menu targets full width in their panels', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/src/pages/context-menu.vue'),
      'utf8',
    )

    expect(source).toContain('.admin-context-menu__target {')
    expect(source).toContain('display: flex;')
    expect(source).toContain('width: 100%;')
    expect(source).toContain('box-sizing: border-box;')
  })
})

function collectVueFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name)

    return statSync(path).isDirectory() ? collectVueFiles(path) : path.endsWith('.vue') ? [path] : []
  })
}
