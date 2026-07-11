import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const exampleRoot = resolve(__dirname, '../../../../examples/admin')

describe('example preview build targets', () => {
  it('always includes the overflow menu in the user-facing preview', () => {
    const source = readFileSync(resolve(exampleRoot, 'src/main.js'), 'utf8')

    expect(source).toContain('return [...menus, createOverflowMenu()]')
    expect(source).not.toContain('import.meta.env.DEV ? [...menus, createOverflowMenu()] : menus')
  })

  it('ships a Cloudflare Workers static asset build with native SPA fallback', () => {
    const rootPackageJson = JSON.parse(readFileSync(resolve(exampleRoot, '../../package.json'), 'utf8'))
    const packageJson = JSON.parse(readFileSync(resolve(exampleRoot, 'package.json'), 'utf8'))
    const wranglerConfig = JSON.parse(readFileSync(resolve(exampleRoot, '../../wrangler.jsonc'), 'utf8'))

    expect(rootPackageJson.scripts['build:cloudflare-pages']).toBe('pnpm --filter vela-admin-example build:cloudflare-pages')
    expect(packageJson.scripts['build:cloudflare-pages']).toBe('vite build --mode cloudflare-pages')
    expect(wranglerConfig.name).toBe('vela-admin-demo')
    expect(wranglerConfig.assets).toEqual({
      directory: './examples/admin/dist',
      not_found_handling: 'single-page-application',
    })
    expect(existsSync(resolve(exampleRoot, 'public/_redirects'))).toBe(false)
    expect(existsSync(resolve(exampleRoot, 'public/404.html'))).toBe(false)
  })
})
