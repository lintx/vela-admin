import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('example header tools', () => {
  it('provides notification and user menus without the old apply button', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/src/App.vue'),
      'utf8',
    )

    expect(source).toContain('const notifications = ref')
    expect(source).toContain('const notificationMenuOpen = ref(false)')
    expect(source).toContain('const userMenuOpen = ref(false)')
    expect(source).toContain('admin-preview__notification-menu')
    expect(source).toContain('admin-preview__user-menu')
    expect(source).toContain('<var-menu')
    expect(source).toContain('<var-list class="admin-preview__notification-list" finished>')
    expect(source).toContain('ripple')
    expect(source).not.toContain(':teleport="false"')
    expect(source).toContain('<var-badge')
    expect(source).toContain(':value="unreadNotificationCount"')
    expect(source).toContain(':hidden="!unreadNotificationCount"')
    expect(source).toContain('markAllNotificationsRead')
    expect(source).toContain('function closeHeaderToolMenus()')
    expect(source).toContain('headerToolMenuVersion.value += 1')
    expect(source).toContain(':key="`notification-${headerToolMenuVersion}`"')
    expect(source).toContain(':key="`user-${headerToolMenuVersion}`"')
    expect(source).toContain('@close-header-tools="closeHeaderToolMenus"')
    expect(source).toContain('openNotification(item)')
    expect(source).toContain('openPreferenceSettings')
    expect(source).not.toContain('admin-preview__popover-scrim')
    expect(source).not.toContain('admin-preview__notification-badge')
    expect(source).not.toContain('type="primary" @click="applyCurrentTheme"')
  })

  it('delegates button-origin theme transition details to the framework', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/src/App.vue'),
      'utf8',
    )

    expect(source).toContain('@click="toggleThemeMode"')
    expect(source).toContain('createAdminThemeModeTransition')
    expect(source).not.toContain('toggleThemeMode($event)')
    expect(source).not.toContain('runAdminThemeTransition')
    expect(source).not.toContain('document.startViewTransition')
    expect(source).not.toContain('::view-transition-new(root)')
    expect(source).not.toContain('prefers-reduced-motion: reduce')
  })

  it('keeps generated theme preview in a floating review bar before applying', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/src/App.vue'),
      'utf8',
    )

    expect(source).toContain('const themePreviewBarOpen = ref(false)')
    expect(source).toContain('const previewThemePayload = ref(null)')
    expect(source).toContain('const currentThemeSnapshot = ref(null)')
    expect(source).toContain('function previewGeneratedTheme(payload)')
    expect(source).toContain('themeGeneratorOpen.value = false')
    expect(source).toContain('themePreviewBarOpen.value = true')
    expect(source).toContain('function cancelGeneratedThemePreview()')
    expect(source).toContain('themeGeneratorOpen.value = true')
    expect(source).toContain('function openThemeGenerator()')
    expect(source).toContain('cancelGeneratedThemePreview()')
    expect(source).toContain('@open-theme-generator="openThemeGenerator"')
    expect(source).toContain('function applyPreviewedTheme()')
    expect(source).toContain('admin-preview__theme-preview-bar')
    expect(source).toContain('admin-preview__theme-preview-bar--md3')
    expect(source).toContain('admin-preview__theme-preview-bar--md2')
    expect(source).toContain('z-index: 2400')
    expect(source).toContain('padding: 5px 10px 5px 6px;')
    expect(source).toContain('当前主题')
    expect(source).toContain('预览主题')
    expect(source).toContain('取消预览')
  })

  it('persists custom theme colors with the example settings', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/src/App.vue'),
      'utf8',
    )

    expect(source).toContain('customColors: defaultCustomColors()')
    expect(source).toContain('const customColors = ref(persistedSettings.customColors)')
    expect(source).toContain('customColors: customColors.value')
    expect(source).toContain('function normalizeCustomColors')
    expect(source).toContain('updateCustomColors(value)')
    expect(source).toContain('commitAdminSettings()')
  })
})
