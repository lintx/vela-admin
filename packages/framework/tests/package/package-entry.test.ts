import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const frameworkRoot = resolve(__dirname, '../../../')

/**
 * 校验 npm 发布入口的完整性。
 *
 * framework 以源码形式发布（main/exports 指向 src，不含预编译产物），
 * 用户项目通过 optimizeDeps 直接编译这些路径。任何一个 exports 指向的
 * 文件缺失，都会让 npm 安装路径下的 dev server 启动失败，
 * 而本地 workspace link 的 example 工程无法暴露这类问题。
 */
describe('npm package entry integrity', () => {
  const packageJson = JSON.parse(readFileSync(resolve(frameworkRoot, 'package.json'), 'utf8'))
  const exportsMap = packageJson.exports as Record<string, { import?: string } | string>

  it('publishes source entries instead of build output', () => {
    expect(packageJson.main).toBe('./src/index.ts')
    expect(packageJson.files).toEqual(expect.arrayContaining(['src', 'styles']))
    expect(packageJson.files).not.toContain('dist')
  })

  it('points every exports entry at an existing source file', () => {
    for (const [name, target] of Object.entries(exportsMap)) {
      const targetPath = typeof target === 'string' ? target : target.import

      expect(targetPath, `exports["${name}"] must define an import target`).toBeDefined()

      // style 入口是 CSS，其它入口都是源码
      const resolved = resolve(frameworkRoot, targetPath as string)

      expect(existsSync(resolved), `exports["${name}"] -> ${targetPath} 不存在`).toBe(true)
    }
  })

  it('exposes the documented subpath entries', () => {
    const subpaths = Object.keys(exportsMap)

    // quick-start.md 的 optimizeDeps 示例依赖这些子路径
    for (const subpath of ['.', './app', './router', './style']) {
      expect(subpaths, `缺少文档引用的子路径 ${subpath}`).toContain(subpath)
    }

    // icons.md 的 phosphor-only 示例依赖该子路径
    expect(subpaths, '缺少文档引用的子路径 ./icons/phosphor').toContain('./icons/phosphor')
  })
})
