import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('example app tabs cache', () => {
  it('keeps opened tab route instances alive and manages route scroll state', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/src/App.vue'),
      'utf8',
    )

    expect(source).toContain('<KeepAlive v-if="layoutFeatures.tagsView" :max="20">')
    expect(source).toContain('getRouteCacheKey(viewRoute)')
    expect(source).toContain('tabScrollPositions')
    expect(source).toContain('saveTabScroll(previousPath)')
    expect(source).toContain('restoreTabScroll(nextPath)')
    expect(source).toContain('clearTabsState')
    expect(source).toContain('bumpTabCacheVersion')
  })

  it('redirects when batch closing tabs removes the current route tab', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/src/App.vue'),
      'utf8',
    )

    expect(source.match(/navigateAfterTabsRemoved\(removed, path\)/g)).toHaveLength(3)
    expect(source).toContain('navigateAfterTabsRemoved(removed, resolveFallbackPathAfterBatchClose(previousTabs, removed, route.path))')
    expect(source).toContain('function resolveFallbackPathAfterBatchClose(previousTabs, removedTabs, activePath)')
    expect(source).toContain('tab.fixed || tab.closable === false')
    expect(source).toContain('router.push(fallbackPath)')
  })
})
