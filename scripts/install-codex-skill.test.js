import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { promisify } from 'node:util'

import { fileURLToPath } from 'node:url'

import { installSkills, parseInstallArgs } from './install-codex-skill.js'

const execFileAsync = promisify(execFile)
const testDirectory = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(testDirectory, '..')
const installerPath = path.join(testDirectory, 'install-codex-skill.js')

async function createTempDirectory(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'vela-skill-install-'))
  t.after(() => fs.rm(directory, { recursive: true, force: true }))
  return directory
}

async function runInstaller(codexHome, args) {
  return execFileAsync(process.execPath, [installerPath, ...args], {
    cwd: workspaceRoot,
    env: { ...process.env, CODEX_HOME: codexHome },
    windowsHide: true,
  })
}

test('默认安装 vela-admin-maintainer skill', () => {
  assert.deepEqual(parseInstallArgs([]), {
    skillNames: ['vela-admin-maintainer'],
    dryRun: false,
    linkMode: false,
    all: false,
  })
})

test('支持指定 skill 和 link 模式', () => {
  assert.deepEqual(parseInstallArgs(['using-varlet', '--link']), {
    skillNames: ['using-varlet'],
    dryRun: false,
    linkMode: true,
    all: false,
  })
})

test('支持 dry-run 和全部 skill 模式', () => {
  assert.deepEqual(parseInstallArgs(['--all', '--dry-run']), {
    skillNames: [],
    dryRun: true,
    linkMode: false,
    all: true,
  })
})

test('忽略 pnpm 透传的参数分隔符', () => {
  assert.deepEqual(parseInstallArgs(['--', 'using-varlet', '--link', '--dry-run']), {
    skillNames: ['using-varlet'],
    dryRun: true,
    linkMode: true,
    all: false,
  })
})

test('拒绝路径形式的 skill 名称', () => {
  assert.throws(() => parseInstallArgs(['../outside']), /skill 名称/)
})

test('复制安装 skill 并替换旧目标内容', async t => {
  const codexHome = await createTempDirectory(t)
  const targetDirectory = path.join(codexHome, 'skills/using-varlet')
  await fs.mkdir(targetDirectory, { recursive: true })
  await fs.writeFile(path.join(targetDirectory, 'stale.txt'), 'stale', 'utf8')

  await runInstaller(codexHome, ['using-varlet'])

  assert.match(await fs.readFile(path.join(targetDirectory, 'SKILL.md'), 'utf8'), /name: using-varlet/)
  await assert.rejects(fs.access(path.join(targetDirectory, 'stale.txt')), /ENOENT/)
})

test('link 模式创建指向项目 skill 的目录链接', async t => {
  const codexHome = await createTempDirectory(t)
  const targetDirectory = path.join(codexHome, 'skills/using-varlet')
  const sourceDirectory = path.join(workspaceRoot, '.agents/skills/using-varlet')

  await runInstaller(codexHome, ['using-varlet', '--link'])

  assert.equal(await fs.realpath(targetDirectory), await fs.realpath(sourceDirectory))
})

test('--all 真实安装全部项目 skill', async t => {
  const codexHome = await createTempDirectory(t)

  await runInstaller(codexHome, ['--all'])

  for (const skillName of ['using-varlet', 'vela-admin-maintainer']) {
    assert.match(
      await fs.readFile(path.join(codexHome, 'skills', skillName, 'SKILL.md'), 'utf8'),
      new RegExp(`name: ${skillName}`),
    )
  }
})

test('批量安装遇错后停止，不继续处理后续 skill', async () => {
  const installed = []

  await assert.rejects(
    installSkills(['first', 'broken', 'last'], {}, async skillName => {
      installed.push(skillName)

      if (skillName === 'broken') {
        throw new Error('simulated install failure')
      }
    }),
    /simulated install failure/,
  )

  assert.deepEqual(installed, ['first', 'broken'])
})
