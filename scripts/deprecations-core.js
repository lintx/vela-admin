function parseSemver(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)

  if (!match) {
    throw new Error(`版本必须使用完整 x.y.z 格式：${version}`)
  }

  return match.slice(1).map(Number)
}

function compareSemver(left, right) {
  const leftParts = parseSemver(left)
  const rightParts = parseSemver(right)

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index]
    }
  }

  return 0
}

function collectSourceAnnotations(sourceFiles) {
  const annotations = []
  const pattern = /@deprecated\s+\[([A-Z][A-Z0-9-]+)\]/g

  for (const sourceFile of sourceFiles) {
    for (const match of sourceFile.content.matchAll(pattern)) {
      annotations.push({ id: match[1], path: sourceFile.path })
    }
  }

  return annotations
}

export function validateDeprecations(registry, sourceFiles) {
  const errors = []

  if (registry?.schemaVersion !== 1 || !Array.isArray(registry.deprecations)) {
    throw new Error('deprecations.json 必须使用 schemaVersion 1 和 deprecations 数组')
  }

  const entriesById = new Map()

  for (const entry of registry.deprecations) {
    const requiredStrings = [
      'id',
      'package',
      'apiType',
      'symbol',
      'source',
      'deprecatedIn',
      'replacement',
      'migration',
      'status',
    ]

    for (const field of requiredStrings) {
      if (typeof entry?.[field] !== 'string' || !entry[field].trim()) {
        errors.push(`${entry?.id ?? '<unknown>'} 缺少字段 ${field}`)
      }
    }

    if (!/^VA-DEP-\d{3,}$/.test(entry?.id ?? '')) {
      errors.push(`弃用 ID 格式无效：${entry?.id ?? '<missing>'}`)
    }

    if (entriesById.has(entry.id)) {
      errors.push(`重复 ID：${entry.id}`)
    } else {
      entriesById.set(entry.id, entry)
    }

    if (!['active', 'removed'].includes(entry.status)) {
      errors.push(`${entry.id} status 只能是 active 或 removed`)
    }

    try {
      parseSemver(entry.deprecatedIn)
      parseSemver(entry.removal?.earliestVersion)
    } catch (error) {
      errors.push(`${entry.id} ${error.message}`)
    }

    if (typeof entry.removal?.condition !== 'string' || !entry.removal.condition.trim()) {
      errors.push(`${entry.id} 缺少 removal.condition`)
    }

    if (entry.status === 'removed') {
      try {
        parseSemver(entry.removedIn)
      } catch (error) {
        errors.push(`${entry.id} removed 状态必须记录 removedIn：${error.message}`)
      }
    }
  }

  const annotations = collectSourceAnnotations(sourceFiles)

  for (const annotation of annotations) {
    if (!entriesById.has(annotation.id)) {
      errors.push(`源码存在未登记的弃用 ID：${annotation.id} (${annotation.path})`)
    }
  }

  for (const entry of registry.deprecations) {
    const matches = annotations.filter(annotation => annotation.id === entry.id)

    if (entry.status === 'removed' && matches.length > 0) {
      errors.push(`已标记 removed 的 ${entry.id} 仍保留源码注释`)
      continue
    }

    if (entry.status === 'active' && matches.length === 0) {
      errors.push(`active 弃用项缺少源码注释：${entry.id}`)
      continue
    }

    if (entry.status === 'active' && matches.length > 1) {
      errors.push(`${entry.id} 源码注释重复出现 ${matches.length} 次`)
    }

    for (const match of matches) {
      if (match.path.replaceAll('\\', '/') !== entry.source.replaceAll('\\', '/')) {
        errors.push(`${entry.id} 源码注释位置与注册表不一致：${match.path}`)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }
}

function renderEntry(entry) {
  const lines = [
    `## ${entry.id}: \`${entry.symbol}\``,
    '',
    `- 包：\`${entry.package}\``,
    `- API 类型：\`${entry.apiType}\``,
    `- 弃用版本：\`${entry.deprecatedIn}\``,
    `- 状态：\`${entry.status}\``,
    `- 源码：\`${entry.source}\``,
    `- 替代方案：${entry.replacement}`,
    `- 迁移方式：${entry.migration}`,
    `- 最早移除版本：\`${entry.removal.earliestVersion}\``,
    `- 移除条件：${entry.removal.condition}`,
  ]

  if (entry.removedIn) {
    lines.push(`- 实际移除版本：\`${entry.removedIn}\``)
  }

  return lines.join('\n')
}

export function renderDeprecationsMarkdown(registry) {
  const entries = [...registry.deprecations].sort((left, right) => left.id.localeCompare(right.id))
  const body = entries.length > 0
    ? entries.map(renderEntry).join('\n\n')
    : '当前没有已登记的弃用 API。'

  return `# 弃用 API\n\n本文件由 \`deprecations.json\` 生成，请勿手工编辑。\n\n${body}\n`
}

export function findRemovalCandidates(registry, versionsByPackage) {
  return registry.deprecations.filter(entry => (
    entry.status === 'active'
    && versionsByPackage[entry.package]
    && compareSemver(versionsByPackage[entry.package], entry.removal.earliestVersion) >= 0
  ))
}
