import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const testDirectory = path.dirname(fileURLToPath(import.meta.url))
const skillsRoot = path.resolve(testDirectory, '../.agents/skills')

async function listProjectSkills() {
  const entries = await fs.readdir(skillsRoot, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  assert.ok(match, 'SKILL.md 必须包含 YAML frontmatter')

  const fields = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line => {
        const separator = line.indexOf(':')
        assert.notEqual(separator, -1, `无法解析 frontmatter：${line}`)
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
      }),
  )

  return fields
}

test('所有项目 skill 都具有合法目录名和最小 frontmatter', async () => {
  const skillNames = await listProjectSkills()
  assert.deepEqual(skillNames, ['using-varlet', 'vela-admin-maintainer'])

  for (const skillName of skillNames) {
    assert.match(skillName, /^[a-z0-9-]+$/)
    const markdown = await fs.readFile(path.join(skillsRoot, skillName, 'SKILL.md'), 'utf8')
    const fields = parseFrontmatter(markdown)
    assert.equal(fields.name, skillName)
    assert.match(fields.description, /^Use /)
    assert.ok(fields.description.length <= 1024)
    assert.deepEqual(Object.keys(fields).sort(), ['description', 'name'])
  }
})

test('存在 openai.yaml 时包含必要界面元数据', async () => {
  for (const skillName of await listProjectSkills()) {
    const metadataPath = path.join(skillsRoot, skillName, 'agents/openai.yaml')

    try {
      const metadata = await fs.readFile(metadataPath, 'utf8')
      assert.match(metadata, /^interface:\r?$/m)
      assert.match(metadata, /^\s+display_name:\s+".+"\r?$/m)
      assert.match(metadata, /^\s+short_description:\s+".+"\r?$/m)
      assert.match(metadata, /^\s+default_prompt:\s+".+"\r?$/m)
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error
      }
    }
  }
})

test('维护者 skill 要求 checkpoint 或 commit 前执行一次弃用审计', async () => {
  const markdown = await fs.readFile(
    path.join(skillsRoot, 'vela-admin-maintainer/SKILL.md'),
    'utf8',
  )

  assert.match(markdown, /pnpm run deprecations:audit/)
  assert.match(markdown, /checkpoint.*commit.*exactly once|commit.*checkpoint.*exactly once/)
})
