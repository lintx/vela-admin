import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')
const skillName = 'vela-admin-maintainer'
const sourceDir = path.join(workspaceRoot, '.agents/skills', skillName)
const dryRun = process.argv.includes('--dry-run')
const linkMode = process.argv.includes('--link')

function resolveCodexHome() {
  if (process.env.CODEX_HOME) {
    return path.resolve(process.env.CODEX_HOME)
  }

  const home = process.env.USERPROFILE || process.env.HOME

  if (!home) {
    throw new Error('未找到 USERPROFILE/HOME，请设置 CODEX_HOME 后重试')
  }

  return path.join(home, '.codex')
}

function assertInside(parent, child) {
  const relativePath = path.relative(parent, child)

  if (relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))) {
    return
  }

  throw new Error(`目标路径不在预期目录内：${child}`)
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function main() {
  if (!await pathExists(path.join(sourceDir, 'SKILL.md'))) {
    throw new Error(`未找到项目 skill：${sourceDir}`)
  }

  const codexHome = resolveCodexHome()
  const skillsRoot = path.join(codexHome, 'skills')
  const targetDir = path.join(skillsRoot, skillName)

  assertInside(skillsRoot, targetDir)

  if (dryRun) {
    console.log(`source: ${sourceDir}`)
    console.log(`target: ${targetDir}`)
    console.log(`mode: ${linkMode ? 'link' : 'copy'}`)
    console.log('dry-run: no files changed')
    return
  }

  // 安装时替换目标 skill，确保本机版本与项目内权威版本一致。
  await fs.mkdir(skillsRoot, { recursive: true })
  await fs.rm(targetDir, { recursive: true, force: true })

  if (linkMode) {
    await fs.symlink(sourceDir, targetDir, process.platform === 'win32' ? 'junction' : 'dir')
    console.log(`已链接 Codex skill：${targetDir} -> ${sourceDir}`)
    return
  }

  await fs.cp(sourceDir, targetDir, { recursive: true })
  console.log(`已安装 Codex skill：${targetDir}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
