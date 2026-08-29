import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('example page surfaces', () => {
  it('does not pass AdminLayout defaults redundantly from App.vue', () => {
    const appSource = readFileSync(resolve(__dirname, '../../../../examples/admin/src/App.vue'), 'utf8')

    expect(appSource).not.toContain('app-name="Vela Admin"')
  })

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

  it('uses Varlet grid primitives for representative multi-column pages', () => {
    const files = [
      'icons.vue',
      'index.vue',
      'context-menu.vue',
    ]

    for (const name of files) {
      const source = readFileSync(resolve(__dirname, `../../../../examples/admin/src/pages/${name}`), 'utf8')

      expect(source, name).toContain('<var-row')
      expect(source, name).toContain('<var-col')
      expect(source, name).toContain(':lg=')
      expect(source, name).toContain(':xl=')
    }
  })

  it('keeps dashboard grid rows out of Varlet Space spacer wrappers', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/src/pages/index.vue'),
      'utf8',
    )

    expect(source).toContain('<section class="admin-dashboard">')
    expect(source).not.toContain('<var-space class="admin-dashboard"')
  })

  it('keeps icon cards readable across the Varlet medium breakpoint', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/src/pages/icons.vue'),
      'utf8',
    )

    expect(source.match(/:md="12"/g) ?? []).toHaveLength(2)
  })

  it('does not keep the ineffective admin page span class', () => {
    const files = [
      ...collectVueFiles(resolve(__dirname, '../../../../examples/admin/src/pages')),
      ...collectVueFiles(resolve(__dirname, '../../../../examples/admin/src/components')),
    ]

    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toContain('admin-page-span')
    }
  })
})

function collectVueFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name)

    return statSync(path).isDirectory() ? collectVueFiles(path) : path.endsWith('.vue') ? [path] : []
  })
}
