import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const scriptDir = path.dirname(scriptPath)
const skillDir = path.resolve(scriptDir, '..')
const workspaceRoot = path.resolve(skillDir, '..', '..', '..')
const cacheRoot = path.join(skillDir, '.cache')

const packageCandidates = [
  path.join(workspaceRoot, 'examples/admin/node_modules/@varlet/ui/package.json'),
  path.join(workspaceRoot, 'packages/framework/node_modules/@varlet/ui/package.json'),
]

const copiedRoots = new Set(['docs', 'json', 'src', 'types'])
const copiedFiles = new Set([
  'README.md',
  'README.zh-CN.md',
  'package.json',
  'varlet.config.mjs',
])

export function createVarletTag(version) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`无法识别 Varlet 版本：${version}`)
  }

  return `v${version}`
}

export function createVersionCacheRelativePath(version) {
  return path.posix.join('versions', createVarletTag(version))
}

export function isAllowedArchivePath(archivePath) {
  const normalized = archivePath.replaceAll('\\', '/')
  const marker = '/packages/varlet-ui/'
  const markerIndex = normalized.indexOf(marker)

  if (markerIndex < 0) {
    return false
  }

  const relativePath = normalized.slice(markerIndex + marker.length)
  const [root] = relativePath.split('/')

  return copiedRoots.has(root) || copiedFiles.has(relativePath)
}

export function shouldSync(manifest, version, force, cacheReady = false) {
  return force || manifest?.version !== version || !cacheReady
}

async function readJson(targetPath) {
  try {
    return JSON.parse(await fs.readFile(targetPath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null
    }

    throw error
  }
}

export async function resolveInstalledVarlet(candidates = packageCandidates) {
  const installedPackages = []

  for (const packagePath of candidates) {
    const packageJson = await readJson(packagePath)

    if (packageJson?.name === '@varlet/ui' && packageJson.version) {
      installedPackages.push({
        packagePath,
        version: packageJson.version,
      })
    }
  }

  if (installedPackages.length === 0) {
    throw new Error('未找到已安装的 @varlet/ui，请先运行 pnpm install')
  }

  const versions = new Set(installedPackages.map(item => item.version))

  if (versions.size > 1) {
    const details = installedPackages.map(item => `${item.packagePath}: ${item.version}`).join('；')
    throw new Error(`example 与 framework 的 @varlet/ui 版本不一致：${details}`)
  }

  return {
    ...installedPackages[0],
    packagePaths: installedPackages.map(item => item.packagePath),
  }
}

export function assertSafeArchiveEntries(namesOutput, verboseOutput) {
  for (const entry of namesOutput.split(/\r?\n/).filter(Boolean)) {
    const normalized = entry.replaceAll('\\', '/')

    if (path.posix.isAbsolute(normalized) || normalized.split('/').includes('..')) {
      throw new Error(`Varlet 归档包含不安全路径：${entry}`)
    }
  }

  for (const entry of verboseOutput.split(/\r?\n/).filter(Boolean)) {
    if (entry.startsWith('l') || entry.startsWith('h')) {
      throw new Error(`Varlet 归档包含不安全的链接条目：${entry}`)
    }
  }
}

function listArchive(archivePath, args) {
  const result = spawnSync('tar', [...args, archivePath], {
    encoding: 'utf8',
    windowsHide: true,
  })

  if (result.status !== 0) {
    throw new Error(`无法读取 Varlet 归档：${result.stderr || 'tar 执行失败'}`)
  }

  return result.stdout
}

function validateArchiveEntries(archivePath) {
  const namesOutput = listArchive(archivePath, ['-tzf'])
  const verboseOutput = listArchive(archivePath, ['-tvzf'])
  assertSafeArchiveEntries(namesOutput, verboseOutput)
}

function extractArchive(archivePath, destination) {
  validateArchiveEntries(archivePath)
  const result = spawnSync('tar', ['-xzf', archivePath, '-C', destination], {
    stdio: 'inherit',
    windowsHide: true,
  })

  if (result.status !== 0) {
    throw new Error('解压 Varlet 归档失败')
  }
}

async function downloadArchive(tag, destination) {
  const url = `https://api.github.com/repos/varletjs/varlet/tarball/refs/tags/${tag}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'vela-admin-using-varlet-skill',
    },
    signal: AbortSignal.timeout(120_000),
  })

  if (!response.ok || !response.body) {
    throw new Error(`下载 Varlet ${tag} 失败：HTTP ${response.status}`)
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination))
}

async function walkFiles(root) {
  const files = []

  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        await walk(entryPath)
      } else if (entry.isFile()) {
        files.push(entryPath)
      }
    }
  }

  await walk(root)
  return files
}

export async function inspectCache(cacheRootPath, manifest) {
  if (!manifest?.cachePath || !manifest.version) {
    return { ready: false, reason: 'manifest missing or incomplete' }
  }

  const versionsRoot = path.join(cacheRootPath, 'versions')
  const cacheDirectory = path.resolve(cacheRootPath, manifest.cachePath)
  const relativePath = path.relative(versionsRoot, cacheDirectory)

  if (relativePath === '' || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return { ready: false, reason: 'manifest cachePath is outside versions' }
  }

  try {
    const completion = await readJson(path.join(cacheDirectory, '.complete.json'))
    const packageJson = await readJson(path.join(cacheDirectory, 'package.json'))

    if (completion?.version !== manifest.version
      || packageJson?.name !== '@varlet/ui'
      || packageJson.version !== manifest.version) {
      return { ready: false, reason: 'cache metadata mismatch' }
    }

    const files = await walkFiles(cacheDirectory)
    const hasDocumentation = files.some(file => /[\\/]docs[\\/](?:zh-CN|en-US)\.md$/i.test(file))
    return hasDocumentation
      ? { ready: true, cacheDirectory }
      : { ready: false, reason: 'component documentation missing' }
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { ready: false, reason: 'cache files missing' }
    }

    throw error
  }
}

async function copyAllowedFiles(extractedRoot, destination) {
  let copiedFilesCount = 0
  let documentationFilesCount = 0

  for (const sourcePath of await walkFiles(extractedRoot)) {
    const archivePath = path.relative(extractedRoot, sourcePath).replaceAll('\\', '/')

    if (!isAllowedArchivePath(`archive/${archivePath}`)) {
      continue
    }

    const marker = 'packages/varlet-ui/'
    const relativePath = archivePath.slice(archivePath.indexOf(marker) + marker.length)
    const targetPath = path.join(destination, relativePath)
    await fs.mkdir(path.dirname(targetPath), { recursive: true })
    await fs.copyFile(sourcePath, targetPath)
    copiedFilesCount += 1

    if (/\/docs\/(?:zh-CN|en-US)\.md$/i.test(relativePath.replaceAll('\\', '/'))) {
      documentationFilesCount += 1
    }
  }

  if (copiedFilesCount === 0 || documentationFilesCount === 0) {
    throw new Error('Varlet 归档结构不符合预期，未找到组件文档')
  }

  return { copiedFilesCount, documentationFilesCount }
}

async function writeJsonAtomically(targetPath, value) {
  const temporaryPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')

  try {
    await fs.rename(temporaryPath, targetPath)
  } finally {
    await fs.rm(temporaryPath, { force: true })
  }
}

export async function publishCache(nextCacheDir, nextManifest, options = {}) {
  const cacheRootPath = options.cacheRoot ?? cacheRoot
  const writeManifest = options.writeManifest ?? writeJsonAtomically
  const uniqueSuffix = options.uniqueSuffix ?? `${Date.now()}-${process.pid}`
  const relativeCachePath = path.posix.join(
    'versions',
    `${createVarletTag(nextManifest.version)}-${uniqueSuffix}`,
  )
  const versionCacheDir = path.join(cacheRootPath, relativeCachePath)
  const manifestPath = path.join(cacheRootPath, 'manifest.json')
  const publishedManifest = { ...nextManifest, cachePath: relativeCachePath }
  let manifestPublished = false

  await fs.mkdir(path.dirname(versionCacheDir), { recursive: true })

  try {
    await fs.cp(nextCacheDir, versionCacheDir, { recursive: true, errorOnExist: true })
    await fs.writeFile(
      path.join(versionCacheDir, '.complete.json'),
      `${JSON.stringify({ version: nextManifest.version })}\n`,
      'utf8',
    )

    const inspection = await inspectCache(cacheRootPath, publishedManifest)

    if (!inspection.ready) {
      throw new Error(`Varlet 缓存发布校验失败：${inspection.reason}`)
    }

    await writeManifest(manifestPath, publishedManifest)
    manifestPublished = true
  } finally {
    if (!manifestPublished) {
      await fs.rm(versionCacheDir, { recursive: true, force: true })
    }
  }

  const versionsRoot = path.join(cacheRootPath, 'versions')
  const activeDirectoryName = path.basename(versionCacheDir)

  for (const entry of await fs.readdir(versionsRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== activeDirectoryName) {
      await fs.rm(path.join(versionsRoot, entry.name), { recursive: true, force: true })
    }
  }

  return publishedManifest
}

async function printStatus(installed, options = {}) {
  const cacheRootPath = options.cacheRoot ?? cacheRoot
  const logger = options.logger ?? console
  const manifest = await readJson(path.join(cacheRootPath, 'manifest.json'))
  const inspection = await inspectCache(cacheRootPath, manifest)
  logger.log(`installed: @varlet/ui ${installed.version}`)
  logger.log(`package: ${installed.packagePaths.join(', ')}`)
  logger.log(`cache: ${inspection.ready ? `${manifest.version} (${inspection.cacheDirectory})` : `missing (${inspection.reason})`}`)
}

export async function updateCache(installed, force, options = {}) {
  const cacheRootPath = options.cacheRoot ?? cacheRoot
  const logger = options.logger ?? console
  const download = options.downloadArchive ?? downloadArchive
  const extract = options.extractArchive ?? extractArchive
  const copyFiles = options.copyAllowedFiles ?? copyAllowedFiles
  const publish = options.publishCache ?? publishCache
  const manifest = await readJson(path.join(cacheRootPath, 'manifest.json'))
  const inspection = await inspectCache(cacheRootPath, manifest)

  if (!shouldSync(manifest, installed.version, force, inspection.ready)) {
    logger.log(`Varlet ${installed.version} 官方资料缓存已存在，无需更新。`)
    return
  }

  const tag = createVarletTag(installed.version)
  const stagingRoot = path.join(cacheRootPath, `.staging-${process.pid}-${Date.now()}`)
  const archivePath = path.join(stagingRoot, 'varlet.tar.gz')
  const extractedRoot = path.join(stagingRoot, 'extracted')
  const nextCacheDir = path.join(stagingRoot, 'current')

  await fs.mkdir(extractedRoot, { recursive: true })
  await fs.mkdir(nextCacheDir, { recursive: true })

  try {
    logger.log(`正在下载 Varlet ${tag} 官方资料...`)
    await download(tag, archivePath)
    await extract(archivePath, extractedRoot)
    const counts = await copyFiles(extractedRoot, nextCacheDir)
    const nextManifest = {
      version: installed.version,
      tag,
      source: `https://github.com/varletjs/varlet/tree/${tag}`,
      syncedAt: new Date().toISOString(),
      ...counts,
    }
    await publish(nextCacheDir, nextManifest, { cacheRoot: cacheRootPath })
    logger.log(`同步完成：${counts.documentationFilesCount} 篇文档，${counts.copiedFilesCount} 个查询文件。`)
  } catch (error) {
    logger.error(error.message)
    logger.error(`可继续查询本地发布包：${path.dirname(installed.packagePath)}`)
    throw error
  } finally {
    await fs.rm(stagingRoot, { recursive: true, force: true })
  }
}

export function parseCliArgs(args) {
  const [command = 'status', ...commandArgs] = args

  if (!['status', 'update'].includes(command)) {
    throw new Error('用法：node sync-varlet-docs.mjs <status|update> [--force]')
  }

  if (command === 'status' && commandArgs.length > 0) {
    throw new Error('status 命令不支持额外参数')
  }

  const unknownArgs = commandArgs.filter(arg => arg !== '--force')

  if (unknownArgs.length > 0) {
    throw new Error(`未识别的参数：${unknownArgs.join(', ')}`)
  }

  if (commandArgs.filter(arg => arg === '--force').length > 1) {
    throw new Error('--force 不能重复指定')
  }

  return { command, force: commandArgs.includes('--force') }
}

async function main() {
  const { command, force } = parseCliArgs(process.argv.slice(2))
  const installed = await resolveInstalledVarlet()

  if (command === 'status') {
    await printStatus(installed)
    return
  }

  if (command === 'update') {
    await updateCache(installed, force)
    return
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
