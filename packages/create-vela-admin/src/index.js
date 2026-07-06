#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(packageRoot, '../..')
const packagedTemplateRoot = path.join(packageRoot, 'template/admin')
const workspaceTemplateRoot = path.join(workspaceRoot, 'examples/admin')
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

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
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

async function resolveTemplateRoot() {
  if (await pathExists(packagedTemplateRoot)) {
    return packagedTemplateRoot
  }

  return workspaceTemplateRoot
}

function isLocalDependency(version) {
  return typeof version === 'string' && (version.startsWith('workspace:') || version.startsWith('file:'))
}

function shouldIgnoreTemplateEntry(name) {
  return ignoredNames.has(name)
    || name === '.env'
    || name.startsWith('.env.')
    || name.endsWith('.local')
    || name.endsWith('.log')
}

function resolveProjectName(rawName) {
  const projectName = String(rawName ?? 'vela-admin-app').trim()

  if (!projectName) {
    throw new Error('项目名不能为空')
  }

  // 生成器只接受目录名，不接受路径，避免把文件写到当前目录之外。
  if (path.isAbsolute(projectName) || projectName.includes('/') || projectName.includes('\\')) {
    throw new Error('项目名不能包含路径分隔符')
  }

  return projectName
}

function assertTargetInsideCwd(cwd, targetDir) {
  const relativePath = path.relative(cwd, targetDir)

  if (relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))) {
    return
  }

  throw new Error('目标目录不能位于当前目录之外')
}

async function normalizeLocalFrameworkDependency(targetPackage) {
  const frameworkDependency = targetPackage.dependencies?.['vela-admin']

  if (!isLocalDependency(frameworkDependency)) {
    return
  }

  const frameworkPackage = await readJson(frameworkPackagePath)
  targetPackage.dependencies[frameworkPackage.name] = `^${frameworkPackage.version}`
}

function parseCliArgs(argv) {
  const args = argv.filter((argument) => argument !== '--')
  let projectName
  let autoImport = false

  for (const arg of args) {
    if (arg === '--auto-import') {
      autoImport = true
      continue
    }

    if (!projectName) {
      projectName = arg
      continue
    }

    throw new Error(`未知参数：${arg}`)
  }

  return {
    projectName: resolveProjectName(projectName),
    autoImport,
  }
}

function enableAutoImport(targetDir) {
  const scriptPath = path.join(targetDir, 'scripts/enable-auto-import.js')
  const result = spawnSync(process.execPath, [scriptPath, '--skip-install'], {
    cwd: targetDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || '自动导入启用失败')
  }
}

async function main() {
  const { projectName, autoImport } = parseCliArgs(process.argv.slice(2))
  const cwd = process.cwd()
  const targetDir = path.resolve(cwd, projectName)

  assertTargetInsideCwd(cwd, targetDir)

  if (await pathExists(targetDir)) {
    throw new Error(`目标目录已存在：${targetDir}`)
  }

  const templateRoot = await resolveTemplateRoot()
  await fs.mkdir(targetDir, { recursive: true })
  await copyTemplate(templateRoot, targetDir)

  const targetPackagePath = path.join(targetDir, 'package.json')
  const targetPackage = await readJson(targetPackagePath)

  targetPackage.name = projectName
  await normalizeLocalFrameworkDependency(targetPackage)

  await writeJson(targetPackagePath, targetPackage)

  if (autoImport) {
    enableAutoImport(targetDir)
  }

  console.log(`已创建 ${projectName}`)
  if (autoImport) {
    console.log('已启用自动导入')
  }
  console.log(`cd ${projectName}`)
  console.log('pnpm install')
  console.log('pnpm dev')
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
