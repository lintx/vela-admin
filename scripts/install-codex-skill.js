import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')
const defaultSkillName = 'vela-admin-maintainer'
const projectSkillsRoot = path.join(workspaceRoot, '.agents/skills')

export function parseInstallArgs(args) {
  const normalizedArgs = args.filter(arg => arg !== '--')
  const options = new Set(normalizedArgs.filter(arg => arg.startsWith('--')))
  const skillNames = normalizedArgs.filter(arg => !arg.startsWith('--'))
  const unknownOptions = [...options].filter(option => !['--all', '--dry-run', '--link'].includes(option))

  if (unknownOptions.length > 0) {
    throw new Error(`未识别的选项：${unknownOptions.join(', ')}`)
  }

  if (skillNames.some(skillName => !/^[a-z0-9-]+$/.test(skillName))) {
    throw new Error('skill 名称只能包含小写字母、数字和连字符')
  }

  if (options.has('--all') && skillNames.length > 0) {
    throw new Error('使用 --all 时不能同时指定 skill 名称')
  }

  if (skillNames.length > 1) {
    throw new Error('一次只能指定一个 skill，批量安装请使用 --all')
  }

  const all = options.has('--all')

  return {
    skillNames: all ? [] : (skillNames.length > 0 ? skillNames : [defaultSkillName]),
    dryRun: options.has('--dry-run'),
    linkMode: options.has('--link'),
    all,
  }
}

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

async function listProjectSkillNames() {
  const entries = await fs.readdir(projectSkillsRoot, { withFileTypes: true })
  const skillNames = []

  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-z0-9-]+$/.test(entry.name)) {
      continue
    }

    if (await pathExists(path.join(projectSkillsRoot, entry.name, 'SKILL.md'))) {
      skillNames.push(entry.name)
    }
  }

  return skillNames.sort()
}

async function installSkill(skillName, { codexHome, dryRun, linkMode }) {
  const sourceDir = path.join(projectSkillsRoot, skillName)

  if (!await pathExists(path.join(sourceDir, 'SKILL.md'))) {
    throw new Error(`未找到项目 skill：${sourceDir}`)
  }

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

export async function installSkills(skillNames, options, installer = installSkill) {
  for (const skillName of skillNames) {
    await installer(skillName, options)
  }
}

async function main() {
  const options = parseInstallArgs(process.argv.slice(2))
  const skillNames = options.all ? await listProjectSkillNames() : options.skillNames
  const codexHome = resolveCodexHome()
  await installSkills(skillNames, { ...options, codexHome })
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
