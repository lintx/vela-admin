import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'

const workspaceRoot = path.resolve(import.meta.dirname, '../../..')
const createPackageRoot = path.join(workspaceRoot, 'packages/create-vela-admin')
const frameworkPackagePath = path.join(workspaceRoot, 'packages/framework/package.json')

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function runFailure(command, args, cwd) {
  try {
    execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    return error
  }

  throw new Error('Expected command to fail')
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'create-vela-admin-'))
}

function expectedFrameworkDependency() {
  return `^${readJson(frameworkPackagePath).version}`
}

test('root create script creates project relative to workspace root', () => {
  const projectName = 'root-script-app'
  const rootTarget = path.join(workspaceRoot, projectName)
  const packageTarget = path.join(createPackageRoot, projectName)

  fs.rmSync(rootTarget, { recursive: true, force: true })
  fs.rmSync(packageTarget, { recursive: true, force: true })

  try {
    run('pnpm', ['run', 'create', '--', projectName], workspaceRoot)

    assert.equal(fs.existsSync(rootTarget), true)
    assert.equal(fs.existsSync(packageTarget), false)
    assert.equal(readJson(path.join(rootTarget, 'package.json')).dependencies['vela-admin'], expectedFrameworkDependency())
  } finally {
    fs.rmSync(rootTarget, { recursive: true, force: true })
    fs.rmSync(packageTarget, { recursive: true, force: true })
  }
})

test('create script refuses project names that resolve outside cwd', () => {
  const tempDir = createTempDir()
  const outsideTarget = path.resolve(tempDir, '..', 'escaped-app')

  fs.rmSync(outsideTarget, { recursive: true, force: true })

  try {
    const error = runFailure('node', [path.join(createPackageRoot, 'src/index.js'), '../escaped-app'], tempDir)

    assert.match(error.stderr, /项目名不能包含路径分隔符|目标目录不能位于当前目录之外/)
    assert.equal(fs.existsSync(outsideTarget), false)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
    fs.rmSync(outsideTarget, { recursive: true, force: true })
  }
})

test('create script can enable auto import during generation', () => {
  const tempDir = createTempDir()
  const appDir = path.join(tempDir, 'auto-import-app')

  try {
    const output = run('node', [path.join(createPackageRoot, 'src/index.js'), 'auto-import-app', '--auto-import'], tempDir)
    const packageJson = readJson(path.join(appDir, 'package.json'))
    const viteConfig = fs.readFileSync(path.join(appDir, 'vite.config.js'), 'utf8')

    assert.match(output, /已启用自动导入/)
    assert.equal(packageJson.devDependencies['unplugin-auto-import'], '^0.18.6')
    assert.equal(packageJson.devDependencies['unplugin-vue-components'], '^0.27.5')
    assert.equal(viteConfig.includes('unplugin-auto-import/vite'), true)
    assert.equal(viteConfig.includes('unplugin-vue-components/vite'), true)
    assert.equal(viteConfig.includes('\'vela-admin/app\''), true)
    assert.equal(viteConfig.includes('\'vela-admin/router\''), true)
    assert.equal(viteConfig.includes('\'vela-admin/menu\''), true)
    assert.equal(viteConfig.includes('\'vela-admin/permission\''), true)
    assert.equal(viteConfig.includes('\'vela-admin/components\''), true)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('packed create package uses packaged template dependency', () => {
  const tempDir = createTempDir()
  const extractedDir = path.join(tempDir, 'extracted')
  const appDir = path.join(tempDir, 'published-app')

  try {
    const packOutput = run('pnpm', ['pack', '--pack-destination', tempDir], createPackageRoot)
    const tarballName = packOutput.trim().split(/\r?\n/).at(-1)
    const tarballPath = path.isAbsolute(tarballName) ? tarballName : path.join(tempDir, tarballName)

    fs.mkdirSync(extractedDir, { recursive: true })
    run('tar', ['-xzf', tarballPath, '-C', extractedDir], tempDir)

    const packageRoot = path.join(extractedDir, 'package')
    const packageJsonPath = path.join(packageRoot, 'package.json')
    const templatePackagePath = path.join(packageRoot, 'template/admin/package.json')

    const packageJson = readJson(packageJsonPath)
    packageJson.version = '9.9.9'
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')

    const templatePackage = readJson(templatePackagePath)
    templatePackage.dependencies['vela-admin'] = '^1.2.3'
    fs.writeFileSync(templatePackagePath, `${JSON.stringify(templatePackage, null, 2)}\n`, 'utf8')

    run('node', [path.join(packageRoot, 'src/index.js'), 'published-app'], tempDir)

    assert.equal(fs.existsSync(appDir), true)
    assert.equal(readJson(path.join(appDir, 'package.json')).dependencies['vela-admin'], '^1.2.3')
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
    fs.rmSync(path.join(createPackageRoot, 'template'), { recursive: true, force: true })
  }
})

test('packed create package excludes local env and log files from template', () => {
  const tempDir = createTempDir()
  const extractedDir = path.join(tempDir, 'extracted')
  const localOnlyFiles = [
    '.env',
    '.env.local',
    'debug.log',
    'demo.local',
  ]

  try {
    for (const fileName of localOnlyFiles) {
      fs.writeFileSync(path.join(workspaceRoot, 'examples/admin', fileName), 'LOCAL_ONLY=1\n', 'utf8')
    }

    const packOutput = run('pnpm', ['pack', '--pack-destination', tempDir], createPackageRoot)
    const tarballName = packOutput.trim().split(/\r?\n/).at(-1)
    const tarballPath = path.isAbsolute(tarballName) ? tarballName : path.join(tempDir, tarballName)

    fs.mkdirSync(extractedDir, { recursive: true })
    run('tar', ['-xzf', tarballPath, '-C', extractedDir], tempDir)

    const templateRoot = path.join(extractedDir, 'package', 'template/admin')

    for (const fileName of localOnlyFiles) {
      assert.equal(fs.existsSync(path.join(templateRoot, fileName)), false)
    }
  } finally {
    for (const fileName of localOnlyFiles) {
      fs.rmSync(path.join(workspaceRoot, 'examples/admin', fileName), { force: true })
    }

    fs.rmSync(tempDir, { recursive: true, force: true })
    fs.rmSync(path.join(createPackageRoot, 'template'), { recursive: true, force: true })
  }
})
