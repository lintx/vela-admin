#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const packagePath = path.join(projectRoot, 'package.json')
const viteConfigPath = path.join(projectRoot, 'vite.config.js')
const skipInstall = process.argv.includes('--skip-install') || process.env.VELA_ADMIN_SKIP_INSTALL === '1'

const autoImportDevDependencies = {
  'unplugin-auto-import': '^0.18.6',
  'unplugin-vue-components': '^0.27.5',
}

const autoImportImports = [
  'import AutoImport from \'unplugin-auto-import/vite\'',
  'import Components from \'unplugin-vue-components/vite\'',
]

const autoImportPlugins = `    AutoImport({
      imports: [
        'vue',
        'vue-router',
        {
          'vela-admin/app': [
            'createAdminApp',
            'defineAdminConfig',
          ],
          'vela-admin/router': [
            'createAdminRouter',
            'parseAdminMenuMeta',
          ],
          'vela-admin/menu': [
            'createMenuService',
            'menuInjectionKey',
          ],
          'vela-admin/permission': [
            'createPermissionGuard',
            'createPermissionService',
            'permissionDirective',
            'permissionInjectionKey',
          ],
        },
      ],
      dts: './src/auto-imports.d.ts',
    }),
    Components({
      dts: './src/components.d.ts',
      resolvers: [
        (componentName) => {
          if (['VaDialog', 'VaIcon', 'VaContextMenu', 'VaContextMenuGroup', 'VaContextMenuItem'].includes(componentName)) {
            return { name: componentName, from: 'vela-admin/components' }
          }
        },
      ],
    }),`

async function main() {
  const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'))
  packageJson.devDependencies = {
    ...(packageJson.devDependencies ?? {}),
    ...autoImportDevDependencies,
  }
  await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')

  const viteConfig = await fs.readFile(viteConfigPath, 'utf8')
  await fs.writeFile(viteConfigPath, enableAutoImport(viteConfig), 'utf8')

  if (!skipInstall) {
    installDependencies()
  }

  console.log('已启用自动导入')
}

function enableAutoImport(viteConfig) {
  if (viteConfig.includes('unplugin-auto-import/vite')) {
    return viteConfig
  }

  const withImports = viteConfig.replace(
    'import vue from \'@vitejs/plugin-vue\'',
    `import vue from '@vitejs/plugin-vue'\n${autoImportImports.join('\n')}`,
  )

  if (!withImports.includes('plugins: [vue()],')) {
    throw new Error('未找到可自动更新的 Vite plugins 配置')
  }

  return withImports.replace(
    'plugins: [vue()],',
    `plugins: [
    vue(),
${autoImportPlugins}
  ],`,
  )
}

function installDependencies() {
  const packageManager = detectPackageManager()
  const result = spawnSync(packageManager, ['install'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    throw new Error(`${packageManager} install 执行失败，请手动运行依赖安装命令`)
  }
}

function detectPackageManager() {
  if (process.env.npm_config_user_agent?.startsWith('yarn')) {
    return 'yarn'
  }

  if (process.env.npm_config_user_agent?.startsWith('npm')) {
    return 'npm'
  }

  return 'pnpm'
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
