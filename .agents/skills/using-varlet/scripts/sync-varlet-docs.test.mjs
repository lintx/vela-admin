import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import {
  assertSafeArchiveEntries,
  inspectCache,
  parseCliArgs,
  publishCache,
  resolveInstalledVarlet,
  updateCache,
  createVersionCacheRelativePath,
  createVarletTag,
  isAllowedArchivePath,
  shouldSync,
} from './sync-varlet-docs.mjs'

async function createTempDirectory(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'vela-varlet-skill-'))
  t.after(() => fs.rm(directory, { recursive: true, force: true }))
  return directory
}

async function writeJson(targetPath, value) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function createCompleteCache(cacheRoot, version = '3.18.2', cachePath = 'versions/v3.18.2-old') {
  const versionDirectory = path.join(cacheRoot, cachePath)
  await writeJson(path.join(versionDirectory, 'package.json'), {
    name: '@varlet/ui',
    version,
  })
  await fs.mkdir(path.join(versionDirectory, 'src/button/docs'), { recursive: true })
  await fs.writeFile(path.join(versionDirectory, 'src/button/docs/zh-CN.md'), '# Button\n', 'utf8')
  await writeJson(path.join(versionDirectory, '.complete.json'), { version })

  const manifest = {
    version,
    tag: `v${version}`,
    cachePath,
  }
  await writeJson(path.join(cacheRoot, 'manifest.json'), manifest)
  return manifest
}

test('将安装版本映射为不可变 Git tag', () => {
  assert.equal(createVarletTag('3.18.2'), 'v3.18.2')
})

test('拒绝不符合 semver 的安装版本', () => {
  assert.throws(() => createVarletTag('latest'), /Varlet 版本/)
})

test('为每个 Varlet tag 使用独立缓存目录', () => {
  assert.equal(createVersionCacheRelativePath('3.18.2'), 'versions/v3.18.2')
})

test('归档白名单只保留 varlet-ui 查询资料', () => {
  assert.equal(
    isAllowedArchivePath('varlet-e04e888/packages/varlet-ui/src/button/docs/zh-CN.md'),
    true,
  )
  assert.equal(
    isAllowedArchivePath('varlet-e04e888/packages/varlet-ui/varlet.config.mjs'),
    true,
  )
  assert.equal(
    isAllowedArchivePath('varlet-e04e888/packages/varlet-cli/src/index.ts'),
    false,
  )
})

test('缓存版本一致时跳过同步', () => {
  assert.equal(shouldSync({ version: '3.18.2' }, '3.18.2', false, true), false)
  assert.equal(shouldSync({ version: '3.18.1' }, '3.18.2', false, true), true)
  assert.equal(shouldSync({ version: '3.18.2' }, '3.18.2', true, true), true)
  assert.equal(shouldSync({ version: '3.18.2' }, '3.18.2', false, false), true)
  assert.equal(shouldSync(null, '3.18.2', false, false), true)
})

test('缓存目录或完成标记缺失时判定需要重新同步', async t => {
  const cacheRoot = await createTempDirectory(t)
  const manifest = await createCompleteCache(cacheRoot)

  assert.equal((await inspectCache(cacheRoot, manifest)).ready, true)

  await fs.rm(path.join(cacheRoot, manifest.cachePath, '.complete.json'))
  assert.equal((await inspectCache(cacheRoot, manifest)).ready, false)
})

test('拒绝包含符号链接或硬链接的归档', () => {
  const safeNames = 'repo/packages/varlet-ui/package.json\n'
  const safeDetails = '-rw-r--r-- user/group 10 2026-01-01 00:00 repo/packages/varlet-ui/package.json\n'

  assert.doesNotThrow(() => assertSafeArchiveEntries(safeNames, safeDetails))
  assert.throws(
    () => assertSafeArchiveEntries(
      'repo/packages/varlet-ui/src/link\n',
      'lrwxrwxrwx user/group 0 2026-01-01 00:00 repo/packages/varlet-ui/src/link -> ../../outside\n',
    ),
    /链接条目/,
  )
  assert.throws(
    () => assertSafeArchiveEntries(
      'repo/packages/varlet-ui/src/hard-link\n',
      'hrw-r--r-- user/group 0 2026-01-01 00:00 repo/packages/varlet-ui/src/hard-link link to repo/outside\n',
    ),
    /链接条目/,
  )
})

test('example 与 framework 的 Varlet 版本不一致时拒绝同步', async t => {
  const root = await createTempDirectory(t)
  const examplePackage = path.join(root, 'example/package.json')
  const frameworkPackage = path.join(root, 'framework/package.json')
  await writeJson(examplePackage, { name: '@varlet/ui', version: '3.18.2' })
  await writeJson(frameworkPackage, { name: '@varlet/ui', version: '3.18.1' })

  await assert.rejects(
    resolveInstalledVarlet([examplePackage, frameworkPackage]),
    /版本不一致/,
  )
})

test('CLI 严格拒绝未知参数和 status 附加参数', () => {
  assert.deepEqual(parseCliArgs(['status']), { command: 'status', force: false })
  assert.deepEqual(parseCliArgs(['update', '--force']), { command: 'update', force: true })
  assert.throws(() => parseCliArgs(['update', '--froce']), /未识别的参数/)
  assert.throws(() => parseCliArgs(['status', '--force']), /不支持额外参数/)
})

test('发布 manifest 失败时保留旧缓存和旧 manifest', async t => {
  const cacheRoot = await createTempDirectory(t)
  const oldManifest = await createCompleteCache(cacheRoot)
  const nextCache = path.join(cacheRoot, 'next')
  await writeJson(path.join(nextCache, 'package.json'), { name: '@varlet/ui', version: '3.18.2' })
  await fs.mkdir(path.join(nextCache, 'src/button/docs'), { recursive: true })
  await fs.writeFile(path.join(nextCache, 'src/button/docs/zh-CN.md'), '# New\n', 'utf8')

  await assert.rejects(
    publishCache(nextCache, {
      version: '3.18.2',
      tag: 'v3.18.2',
    }, {
      cacheRoot,
      writeManifest: async () => {
        throw new Error('simulated manifest failure')
      },
    }),
    /simulated manifest failure/,
  )

  assert.deepEqual(
    JSON.parse(await fs.readFile(path.join(cacheRoot, 'manifest.json'), 'utf8')),
    oldManifest,
  )
  assert.equal((await inspectCache(cacheRoot, oldManifest)).ready, true)
})

test('下载失败时保留已有可用缓存', async t => {
  const cacheRoot = await createTempDirectory(t)
  const oldManifest = await createCompleteCache(cacheRoot)

  await assert.rejects(
    updateCache({
      packagePath: path.join(cacheRoot, 'node_modules/@varlet/ui/package.json'),
      version: '3.18.2',
    }, true, {
      cacheRoot,
      downloadArchive: async () => {
        throw new Error('simulated download failure')
      },
      logger: { log() {}, error() {} },
    }),
    /simulated download failure/,
  )

  assert.deepEqual(
    JSON.parse(await fs.readFile(path.join(cacheRoot, 'manifest.json'), 'utf8')),
    oldManifest,
  )
  assert.equal((await inspectCache(cacheRoot, oldManifest)).ready, true)
})
