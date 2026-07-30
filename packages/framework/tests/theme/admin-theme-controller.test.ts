import { describe, expect, it, vi } from 'vitest'

import {
  createAdminTheme,
  createSettingsService,
  createSourceColorAdminTheme,
  mergeAdminConfig,
  type AdminThemeColor,
  type AdminThemeTransitionDocument,
  type AdminThemeTransitionTarget,
  type AdminThemeTransitionWindow,
} from '../../src/index'
import { useAdminTheme, useThemePreview } from '../../src/theme'
import type { AdminThemeGeneratorPayload } from '../../src/layout'
import { createMemoryStorage } from '../settings/settings-test-utils'

describe('useAdminTheme', () => {
  it('applies the current source theme immediately and resolves system dark mode', () => {
    const settings = createThemeSettings({
      base: 'md2Light',
      mode: 'system',
      sourceColor: '#123456',
    })
    const applyTheme = vi.fn()
    const controller = useAdminTheme({
      settings,
      applyTheme,
      windowRef: createWindowRef({ dark: true }),
    })

    expect(controller.themeBase.value).toBe('md2Light')
    expect(controller.themeMode.value).toBe('system')
    expect(controller.resolvedThemeMode.value).toBe('dark')
    expect(controller.resolvedThemeBase.value).toBe('md2Dark')
    expect(controller.sourceColor.value).toBe('#123456')
    expect(controller.currentTheme.value.base).toBe('md2Dark')
    expect(applyTheme).toHaveBeenCalledWith(controller.currentTheme.value)
  })

  it('updates settings through the service and keeps base suffixes aligned with resolved mode', () => {
    const settings = createThemeSettings()
    const updateSettings = vi.spyOn(settings, 'updateSettings')
    const applyTheme = vi.fn()
    const controller = useAdminTheme({ settings, applyTheme })

    controller.updateMode('dark')
    expect(settings.getSettings().theme).toMatchObject({ mode: 'dark', base: 'md3Dark' })
    expect(applyTheme.mock.calls.at(-1)?.[0].base).toBe('md3Dark')

    controller.updateBase('md2Light')
    expect(settings.getSettings().theme.base).toBe('md2Dark')
    expect(applyTheme.mock.calls.at(-1)?.[0].base).toBe('md2Dark')

    controller.updateSourceColor('#B141C8')
    expect(settings.getSettings().theme.sourceColor).toBe('#B141C8')
    expect(controller.currentTheme.value.base).toBe('md2Dark')
    expect(updateSettings).toHaveBeenCalledTimes(3)
  })

  it('runs explicit and toggle mode transitions from the supplied control target', async () => {
    const settings = createThemeSettings()
    const transition = { ready: Promise.resolve() }
    const animate = vi.fn()
    const documentRef = {
      documentElement: { animate },
      startViewTransition: vi.fn((update: () => void) => {
        update()
        return transition
      }),
    } as unknown as AdminThemeTransitionDocument
    const windowRef = createWindowRef({ dark: false, width: 900, height: 600 })
    const target = createTransitionTarget()
    const controller = useAdminTheme({ settings, applyTheme: vi.fn(), windowRef, documentRef })

    controller.updateMode('dark', target)
    await transition.ready
    await Promise.resolve()

    expect(controller.themeMode.value).toBe('dark')
    expect(animate.mock.calls[0]?.[0].clipPath[0]).toBe('circle(0px at 140px 100px)')

    controller.toggleMode({ currentTarget: target } as unknown as Event)
    expect(controller.themeMode.value).toBe('light')
    expect(documentRef.startViewTransition).toHaveBeenCalledTimes(2)
  })

  it('still updates mode without a view transition when reduced motion is enabled', () => {
    const settings = createThemeSettings()
    const documentRef = {
      documentElement: { animate: vi.fn() },
      startViewTransition: vi.fn(),
    } as unknown as AdminThemeTransitionDocument
    const controller = useAdminTheme({
      settings,
      applyTheme: vi.fn(),
      windowRef: createWindowRef({ dark: false, reduceMotion: true }),
      documentRef,
    })

    controller.updateMode('dark', createTransitionTarget())

    expect(controller.themeMode.value).toBe('dark')
    expect(documentRef.startViewTransition).not.toHaveBeenCalled()
  })

  it('falls back to light mode and synchronous updates without browser globals', () => {
    const settings = createThemeSettings({ mode: 'system' })
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    try {
      const controller = useAdminTheme({ settings })

      expect(controller.resolvedThemeMode.value).toBe('light')
      controller.toggleMode()
      expect(controller.themeMode.value).toBe('light')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('resets only the existing theme fields and preserves custom colors', () => {
    const customColors = [{ color: '#B141C8', label: '品牌紫', removable: false }]
    const settings = createThemeSettings({
      base: 'md2Dark',
      mode: 'dark',
      sourceColor: '#B141C8',
      customColors,
    })
    const applyTheme = vi.fn()
    const controller = useAdminTheme({ settings, applyTheme })

    controller.reset()

    expect(settings.getSettings().theme).toMatchObject({
      sourceColor: '#6750A4',
      mode: 'light',
      base: 'md3Light',
      customColors,
    })
    expect(applyTheme.mock.calls.at(-1)?.[0]).toEqual(createAdminTheme())
  })

  it('normalizes custom colors with preset exclusion, last-value dedupe, defaults, and current source inclusion', () => {
    const settings = createThemeSettings({
      sourceColor: '#ABCDEF',
      customColors: [
        { color: '#6750A4', label: '预设紫' },
        { color: '#B141C8', label: '旧名称', removable: false },
        { color: '#B141C8', label: '', removable: undefined },
      ],
    })
    const controller = useAdminTheme({ settings, applyTheme: vi.fn() })

    expect(controller.customColors.value).toEqual([
      { color: '#B141C8', label: '自定义 #B141C8', removable: true },
      { color: '#ABCDEF', label: '自定义 #ABCDEF', removable: true },
    ])

    controller.updateCustomColors([
      { color: '#2563EB' },
      { color: '#102030', removable: false },
    ] as AdminThemeColor[])

    expect(settings.getSettings().theme.customColors).toEqual([
      { color: '#102030', label: '自定义 #102030', removable: false },
      { color: '#ABCDEF', label: '自定义 #ABCDEF', removable: true },
    ])
  })
})

describe('useThemePreview', () => {
  it('uses the theme controller applier for preview, view switching, and cancellation by default', () => {
    const settings = createThemeSettings()
    const applyTheme = vi.fn()
    const theme = useAdminTheme({ settings, applyTheme })
    const preview = useThemePreview({ theme })
    const currentTheme = theme.currentTheme.value
    const payload = createPayload()
    applyTheme.mockClear()

    preview.preview(payload)
    preview.showCurrent()
    preview.showGenerated()
    preview.cancel()

    expect(applyTheme.mock.calls.map(([appliedTheme]) => appliedTheme)).toEqual([
      payload.theme,
      currentTheme,
      payload.theme,
      currentTheme,
    ])
  })

  it('keeps preview and view switching safe without browser globals', () => {
    const settings = createThemeSettings()
    const payload = createPayload()
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    try {
      const theme = useAdminTheme({ settings })
      const preview = useThemePreview({ theme })

      preview.preview(payload)
      preview.showCurrent()
      preview.showGenerated()
      preview.cancel()

      expect(preview.generatorOpen.value).toBe(true)
      expect(preview.barOpen.value).toBe(false)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('reuses the settings service associated with an explicitly configured theme controller', () => {
    const settings = createThemeSettings()
    const applyTheme = vi.fn()
    const theme = useAdminTheme({ settings, applyTheme })
    const preview = useThemePreview({ theme, applyTheme })
    const payload = createPayload({ sourceColor: '#B141C8' })

    preview.apply(payload)

    expect(settings.getSettings().theme.sourceColor).toBe('#B141C8')
    expect(theme.sourceColor.value).toBe('#B141C8')
  })

  it('previews generated themes and switches safely between current and generated views', () => {
    const { theme, settings, applyTheme } = createThemeController()
    const preview = useThemePreview({ theme, applyTheme })
    const payload = createPayload()
    const currentTheme = theme.currentTheme.value

    preview.openGenerator()
    expect(preview.generatorOpen.value).toBe(true)

    preview.preview(payload)
    expect(preview.generatorOpen.value).toBe(false)
    expect(preview.barOpen.value).toBe(true)
    expect(preview.previewVisible.value).toBe(true)
    expect(applyTheme).toHaveBeenLastCalledWith(payload.theme)

    preview.showCurrent()
    expect(preview.previewVisible.value).toBe(false)
    expect(applyTheme).toHaveBeenLastCalledWith(currentTheme)

    preview.showGenerated()
    expect(preview.previewVisible.value).toBe(true)
    expect(applyTheme).toHaveBeenLastCalledWith(payload.theme)
  })

  it('restores the snapshot on cancel and reopens the generator', () => {
    const { theme, settings, applyTheme } = createThemeController()
    const preview = useThemePreview({ theme, applyTheme })
    const currentTheme = theme.currentTheme.value

    preview.preview(createPayload())
    preview.cancel()

    expect(applyTheme).toHaveBeenLastCalledWith(currentTheme)
    expect(preview.generatorOpen.value).toBe(true)
    expect(preview.barOpen.value).toBe(false)
    expect(preview.previewVisible.value).toBe(false)
    preview.showCurrent()
    preview.showGenerated()
    expect(applyTheme).toHaveBeenCalledTimes(3)
  })

  it('commits direct or previewed payloads, including optional custom colors, and clears the transaction', () => {
    const settings = createThemeSettings()
    const applyTheme = vi.fn()
    const transition = { ready: Promise.resolve() }
    const startViewTransition = vi.fn((update: () => void) => {
      update()
      return transition
    })
    const documentRef = {
      documentElement: { animate: vi.fn() },
      startViewTransition,
    } as unknown as AdminThemeTransitionDocument
    const theme = useAdminTheme({ settings, applyTheme, documentRef })
    const updateSettings = vi.spyOn(settings, 'updateSettings')
    const preview = useThemePreview({ theme, applyTheme })
    const payload = {
      ...createPayload({ sourceColor: '#B141C8', themeBase: 'md2Dark', themeMode: 'dark' }),
      customColors: [{ color: '#B141C8', label: '品牌紫', removable: false }],
    }

    applyTheme.mockClear()
    preview.apply(payload)

    expect(settings.getSettings().theme).toMatchObject({
      sourceColor: '#B141C8',
      base: 'md2Dark',
      mode: 'dark',
      customColors: payload.customColors,
    })
    expect(updateSettings).toHaveBeenCalledTimes(1)
    expect(updateSettings).toHaveBeenCalledWith({
      theme: {
        sourceColor: '#B141C8',
        base: 'md2Dark',
        mode: 'dark',
        customColors: payload.customColors,
      },
    })
    expect(startViewTransition).not.toHaveBeenCalled()
    expect(applyTheme).toHaveBeenCalledTimes(1)
    expect(applyTheme).toHaveBeenCalledWith(payload.theme)
    expect(preview.generatorOpen.value).toBe(false)
    expect(preview.barOpen.value).toBe(false)
    expect(preview.previewVisible.value).toBe(false)

    preview.preview(createPayload())
    preview.apply()
    expect(preview.barOpen.value).toBe(false)
  })

  it('closes the generator by restoring the current theme and cancels an open preview before reopening', () => {
    const { theme, settings, applyTheme } = createThemeController()
    const preview = useThemePreview({ theme, applyTheme })
    const currentTheme = theme.currentTheme.value

    preview.openGenerator()
    preview.closeGenerator()
    expect(preview.generatorOpen.value).toBe(false)
    expect(applyTheme).toHaveBeenLastCalledWith(currentTheme)

    preview.preview(createPayload())
    preview.openGenerator()
    expect(preview.generatorOpen.value).toBe(true)
    expect(preview.barOpen.value).toBe(false)
    expect(applyTheme).toHaveBeenLastCalledWith(currentTheme)

    preview.apply()
    preview.cancel()
    expect(preview.generatorOpen.value).toBe(true)
  })
})

function createThemeSettings(theme: Record<string, unknown> = {}) {
  return createSettingsService({
    config: mergeAdminConfig({ theme }),
    storage: createMemoryStorage(),
  })
}

function createWindowRef(options: { dark: boolean; reduceMotion?: boolean; width?: number; height?: number }): AdminThemeTransitionWindow {
  return {
    innerWidth: options.width ?? 800,
    innerHeight: options.height ?? 600,
    matchMedia: (query) => ({
      matches: query.includes('reduced-motion') ? options.reduceMotion === true : options.dark,
    }) as MediaQueryList,
  }
}

function createTransitionTarget(): AdminThemeTransitionTarget {
  return {
    getBoundingClientRect: () => ({ left: 100, top: 80, width: 80, height: 40 }),
  }
}

function createThemeController() {
  const settings = createThemeSettings()
  const applyTheme = vi.fn()
  const theme = useAdminTheme({ settings, applyTheme })

  return { theme, settings, applyTheme }
}

function createPayload(overrides: Partial<AdminThemeGeneratorPayload> = {}): AdminThemeGeneratorPayload {
  const sourceColor = overrides.sourceColor ?? '#0F766E'
  const themeBase = overrides.themeBase ?? 'md3Dark'
  const themeMode = overrides.themeMode ?? 'dark'

  return {
    sourceColor,
    themeBase,
    themeMode,
    theme: overrides.theme ?? createSourceColorAdminTheme({ sourceColor, themeBase, themeMode }),
  }
}
