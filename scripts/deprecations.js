import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  findRemovalCandidates,
  renderDeprecationsMarkdown,
  validateDeprecations,
} from './deprecations-core.js'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(scriptDirectory, '..')
const registryPath = path.join(workspaceRoot, 'deprecations.json')
const documentationPath = path.join(workspaceRoot, 'docs/deprecations.md')
const sourceRoots = [
  path.join(workspaceRoot, 'packages/framework/src'),
  path.join(workspaceRoot, 'packages/create-vela-admin/src'),
]
const sourceExtensions = new Set(['.js', '.mjs', '.ts', '.tsx', '.vue'])

async function readJson(targetPath) {
  return JSON.parse(await fs.readFile(targetPath, 'utf8'))
}

async function walkSourceFiles(root) {
  const files = []

  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        await walk(entryPath)
      } else if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
        files.push({
          path: path.relative(workspaceRoot, entryPath).replaceAll('\\', '/'),
          content: await fs.readFile(entryPath, 'utf8'),
        })
      }
    }
  }

  try {
    await walk(root)
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error
    }
  }

  return files
}

async function readWorkspaceState() {
  const registry = await readJson(registryPath)
  const sourceFiles = (await Promise.all(sourceRoots.map(walkSourceFiles))).flat()
  return { registry, sourceFiles }
}

async function readPackageVersions() {
  const packageDirectories = await fs.readdir(path.join(workspaceRoot, 'packages'), { withFileTypes: true })
  const versions = {}

  for (const entry of packageDirectories) {
    if (!entry.isDirectory()) {
      continue
    }

    try {
      const packageJson = await readJson(path.join(workspaceRoot, 'packages', entry.name, 'package.json'))

      if (packageJson.name && packageJson.version) {
        versions[packageJson.name] = packageJson.version
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error
      }
    }
  }

  return versions
}

async function check() {
  const { registry, sourceFiles } = await readWorkspaceState()
  validateDeprecations(registry, sourceFiles)
  const expectedDocumentation = renderDeprecationsMarkdown(registry)
  let currentDocumentation = null

  try {
    currentDocumentation = await fs.readFile(documentationPath, 'utf8')
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error
    }
  }

  if (currentDocumentation !== expectedDocumentation) {
    throw new Error('docs/deprecations.md 与注册表不一致，请运行 pnpm run deprecations:generate')
  }

  console.log(`弃用注册表检查通过：${registry.deprecations.length} 项。`)
}

async function generate() {
  const { registry, sourceFiles } = await readWorkspaceState()
  validateDeprecations(registry, sourceFiles)
  await fs.writeFile(documentationPath, renderDeprecationsMarkdown(registry), 'utf8')
  console.log('已生成 docs/deprecations.md。')
}

async function audit() {
  const { registry, sourceFiles } = await readWorkspaceState()
  validateDeprecations(registry, sourceFiles)
  const versions = await readPackageVersions()
  const candidates = findRemovalCandidates(registry, versions)

  if (candidates.length === 0) {
    console.log('没有达到最早移除版本的 active 弃用项。')
    return
  }

  console.log('以下 active 弃用项已达到最早移除版本，请人工确认迁移窗口和移除条件：')

  for (const entry of candidates) {
    console.log(`- ${entry.id} ${entry.symbol}（${entry.package} >= ${entry.removal.earliestVersion}）`)
  }
}

function parseCommand(args) {
  if (args.length !== 1 || !['check', 'generate', 'audit'].includes(args[0])) {
    throw new Error('用法：node scripts/deprecations.js <check|generate|audit>')
  }

  return args[0]
}

async function main() {
  const command = parseCommand(process.argv.slice(2))

  if (command === 'check') {
    await check()
  } else if (command === 'generate') {
    await generate()
  } else {
    await audit()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
