import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(packageRoot, '../..')
const sourceTemplateRoot = path.join(workspaceRoot, 'examples/admin')
const targetTemplateRoot = path.join(packageRoot, 'template/admin')
const frameworkPackagePath = path.join(workspaceRoot, 'packages/framework/package.json')
const ignoredNames = new Set([
  'node_modules',
  'dist',
  '.vite',
  'logs',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
])

function shouldIgnoreTemplateEntry(name) {
  return ignoredNames.has(name)
    || name === '.env'
    || name.startsWith('.env.')
    || name.endsWith('.local')
    || name.endsWith('.log')
}

async function copyTemplate(source, target) {
  const entries = await fs.readdir(source, { withFileTypes: true })

  for (const entry of entries) {
    if (shouldIgnoreTemplateEntry(entry.name)) {
      continue
    }

    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)

    if (entry.isDirectory()) {
      await fs.mkdir(targetPath, { recursive: true })
      await copyTemplate(sourcePath, targetPath)
      continue
    }

    await fs.copyFile(sourcePath, targetPath)
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

await fs.rm(targetTemplateRoot, { recursive: true, force: true })
await fs.mkdir(targetTemplateRoot, { recursive: true })
await copyTemplate(sourceTemplateRoot, targetTemplateRoot)

const frameworkPackage = await readJson(frameworkPackagePath)
const templatePackagePath = path.join(targetTemplateRoot, 'package.json')
const templatePackage = await readJson(templatePackagePath)

templatePackage.dependencies = {
  ...templatePackage.dependencies,
  // 发布 create 包时，将 workspace 依赖固化为普通 npm 依赖。
  [frameworkPackage.name]: `^${frameworkPackage.version}`,
}

await writeJson(templatePackagePath, templatePackage)
console.log(`已同步模板：${path.relative(workspaceRoot, targetTemplateRoot)}`)
