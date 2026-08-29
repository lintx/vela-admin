import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  findRemovalCandidates,
  renderDeprecationsMarkdown,
  validateDeprecations,
} from './deprecations-core.js'

function createEntry(overrides = {}) {
  return {
    id: 'VA-DEP-001',
    package: 'vela-admin',
    apiType: 'option',
    symbol: 'CreateTabsServiceOptions.homePath',
    source: 'packages/framework/src/tabs/create-tabs-service.ts',
    deprecatedIn: '0.3.0',
    replacement: '使用 fixedTabs 显式传入首页标签。',
    migration: '删除 homePath，并把固定首页作为 fixedTabs 的首项传入。',
    removal: {
      earliestVersion: '1.0.0',
      condition: '仅在下一个 major、调用方完成迁移且至少经过一个稳定版本后移除。',
    },
    status: 'active',
    ...overrides,
  }
}

function createRegistry(entries = [createEntry()]) {
  return { schemaVersion: 1, deprecations: entries }
}

function createSourceFiles(annotation = '@deprecated [VA-DEP-001] 使用 fixedTabs。') {
  return [{
    path: 'packages/framework/src/tabs/create-tabs-service.ts',
    content: `/** ${annotation} */\nexport interface CreateTabsServiceOptions {}`,
  }]
}

test('接受注册表与源码注释一致的 active 弃用项', () => {
  assert.doesNotThrow(() => validateDeprecations(createRegistry(), createSourceFiles()))
})

test('拒绝重复 ID', () => {
  assert.throws(
    () => validateDeprecations(createRegistry([createEntry(), createEntry()]), createSourceFiles()),
    /重复 ID.*VA-DEP-001/,
  )
})

test('拒绝 active 项缺少对应源码注释', () => {
  assert.throws(
    () => validateDeprecations(createRegistry(), createSourceFiles('ordinary comment')),
    /缺少源码注释.*VA-DEP-001/,
  )
})

test('拒绝源码存在未登记的弃用 ID', () => {
  assert.throws(
    () => validateDeprecations(createRegistry(), [
      ...createSourceFiles(),
      { path: 'packages/framework/src/other.ts', content: '/** @deprecated [VA-DEP-999] */' },
    ]),
    /未登记.*VA-DEP-999/,
  )
})

test('拒绝 removed 项仍保留源码注释', () => {
  assert.throws(
    () => validateDeprecations(
      createRegistry([createEntry({ status: 'removed', removedIn: '1.0.0' })]),
      createSourceFiles(),
    ),
    /已标记 removed.*VA-DEP-001/,
  )
})

test('生成稳定的用户弃用文档', () => {
  const markdown = renderDeprecationsMarkdown(createRegistry())

  assert.match(markdown, /^# 弃用 API\n/)
  assert.match(markdown, /`CreateTabsServiceOptions\.homePath`/)
  assert.match(markdown, /最早移除版本.*`1\.0\.0`/)
  assert.match(markdown, /请勿手工编辑/)
  assert.equal(markdown, renderDeprecationsMarkdown(createRegistry()))
})

test('仅报告已经达到最早移除版本的 active 项', () => {
  const registry = createRegistry([
    createEntry(),
    createEntry({
      id: 'VA-DEP-002',
      symbol: 'Legacy.removed',
      source: 'packages/framework/src/legacy.ts',
      status: 'removed',
      removedIn: '1.0.0',
    }),
  ])

  assert.deepEqual(findRemovalCandidates(registry, { 'vela-admin': '0.9.9' }), [])
  assert.deepEqual(
    findRemovalCandidates(registry, { 'vela-admin': '1.0.0' }).map(entry => entry.id),
    ['VA-DEP-001'],
  )
})
