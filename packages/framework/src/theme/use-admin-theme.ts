import { computed, type ComputedRef } from 'vue'

import type {
  AdminResolvedThemeMode,
  AdminThemeColor,
  AdminThemeMode,
} from '../app/define-admin-config'
import { useAdminSettings } from '../app/use-admin-app'
import type { SettingsService } from '../settings/create-settings-service'
import {
  normalizeAdminThemeColors,
  resolveAdminThemeBase,
  resolveAdminThemeMode,
  type AdminThemeColorInput,
} from './admin-theme-controller-utils'
import { createAdminTheme, type AdminThemeBase, type ResolvedAdminTheme } from './create-theme'
import { createSourceColorAdminTheme } from './theme-generator-service'
import { applyAdminTheme } from './theme-provider'
import {
  createAdminThemeModeTransition,
  type AdminThemeModeTransitionHandler,
  type AdminThemeTransitionDocument,
  type AdminThemeTransitionTarget,
  type AdminThemeTransitionWindow,
} from './theme-transition'

const DEFAULT_SOURCE_COLOR = '#6750A4'
const FALLBACK_TRANSITION_WINDOW: AdminThemeTransitionWindow = {
  innerWidth: 0,
  innerHeight: 0,
}
const FALLBACK_TRANSITION_DOCUMENT = {
  documentElement: {
    animate: () => ({}) as Animation,
  },
} as AdminThemeTransitionDocument

export type AdminThemeApply = (theme: ResolvedAdminTheme) => void

export interface AdminThemeStateInput {
  sourceColor?: string
  themeBase?: AdminThemeBase
  themeMode?: AdminThemeMode
}
export type { AdminThemeColorInput } from './admin-theme-controller-utils'

export interface AdminGeneratedThemePayload {
  sourceColor: string
  themeBase: AdminThemeBase
  themeMode: AdminResolvedThemeMode
  theme: ResolvedAdminTheme
  customColors?: AdminThemeColor[]
}

export interface UseAdminThemeOptions {
  settings?: SettingsService
  applyTheme?: AdminThemeApply
  windowRef?: AdminThemeTransitionWindow
  documentRef?: AdminThemeTransitionDocument
}

export interface AdminThemeController {
  readonly themeBase: ComputedRef<AdminThemeBase>
  readonly themeMode: ComputedRef<AdminThemeMode>
  readonly resolvedThemeMode: ComputedRef<AdminResolvedThemeMode>
  readonly resolvedThemeBase: ComputedRef<AdminThemeBase>
  readonly sourceColor: ComputedRef<string>
  readonly customColors: ComputedRef<AdminThemeColor[]>
  readonly currentTheme: ComputedRef<ResolvedAdminTheme>
  applyTheme(theme: ResolvedAdminTheme): void
  applyCurrent(): ResolvedAdminTheme
  createTheme(next?: AdminThemeStateInput): ResolvedAdminTheme
  updateBase(base: AdminThemeBase): ResolvedAdminTheme
  updateMode(
    mode: AdminThemeMode,
    target?: Event | AdminThemeTransitionTarget | null,
  ): ReturnType<AdminThemeModeTransitionHandler<AdminThemeMode>['to']>
  toggleMode(
    event?: Event | AdminThemeTransitionTarget | null,
  ): ReturnType<AdminThemeModeTransitionHandler<AdminThemeMode>>
  updateSourceColor(color: string): ResolvedAdminTheme
  updateCustomColors(colors: AdminThemeColorInput[]): AdminThemeColor[]
  commitGeneratedTheme(payload: AdminGeneratedThemePayload): ResolvedAdminTheme
  reset(): ResolvedAdminTheme
}

export function useAdminTheme(options: UseAdminThemeOptions = {}): AdminThemeController {
  const settings = options.settings ?? useAdminSettings()
  const applyResolvedTheme = options.applyTheme ?? ((theme) => {
    if (globalThis.document) {
      applyAdminTheme(theme)
    }
  })
  const windowRef = options.windowRef ?? globalThis.window ?? FALLBACK_TRANSITION_WINDOW
  const documentRef = options.documentRef
    ?? globalThis.document as unknown as AdminThemeTransitionDocument | undefined
    ?? FALLBACK_TRANSITION_DOCUMENT
  const themeBase = computed(() => settings.settings.value.theme.base)
  const themeMode = computed(() => settings.settings.value.theme.mode)
  const sourceColor = computed(() => settings.settings.value.theme.sourceColor)
  const resolvedThemeMode = computed(() => resolveAdminThemeMode(themeMode.value, windowRef))
  const resolvedThemeBase = computed(() => resolveAdminThemeBase(themeBase.value, resolvedThemeMode.value))
  const customColors = computed(() => normalizeAdminThemeColors(
    settings.settings.value.theme.customColors ?? [],
    sourceColor.value,
  ))
  const currentTheme = computed(() => createTheme())

  function createTheme(next: AdminThemeStateInput = {}): ResolvedAdminTheme {
    const nextThemeMode = resolveAdminThemeMode(next.themeMode ?? themeMode.value, windowRef)
    const nextThemeBase = resolveAdminThemeBase(next.themeBase ?? themeBase.value, nextThemeMode)

    return createSourceColorAdminTheme({
      sourceColor: next.sourceColor ?? sourceColor.value,
      themeBase: nextThemeBase,
      themeMode: nextThemeMode,
    })
  }

  function applyCurrent(): ResolvedAdminTheme {
    const theme = createTheme()
    applyResolvedTheme(theme)
    return theme
  }

  function commitMode(mode: AdminThemeMode): void {
    const resolvedMode = resolveAdminThemeMode(mode, windowRef)
    settings.updateSettings({
      theme: {
        mode,
        base: resolveAdminThemeBase(themeBase.value, resolvedMode),
      },
    })
    applyCurrent()
  }

  const modeTransition = createAdminThemeModeTransition<AdminThemeMode>({
    getMode: () => themeMode.value,
    setMode: commitMode,
    modes: ['light', 'dark'],
    windowRef,
    documentRef,
  })

  const controller: AdminThemeController = {
    themeBase,
    themeMode,
    resolvedThemeMode,
    resolvedThemeBase,
    sourceColor,
    customColors,
    currentTheme,
    applyTheme: applyResolvedTheme,
    applyCurrent,
    createTheme,
    updateBase(base) {
      settings.updateSettings({
        theme: {
          base: resolveAdminThemeBase(base, resolvedThemeMode.value),
        },
      })
      return applyCurrent()
    },
    updateMode(mode, target) {
      return modeTransition.to(mode, target)
    },
    toggleMode(event) {
      return modeTransition(event)
    },
    updateSourceColor(color) {
      settings.updateSettings({ theme: { sourceColor: color } })
      return applyCurrent()
    },
    updateCustomColors(colors) {
      const normalizedColors = normalizeAdminThemeColors(colors, sourceColor.value)
      settings.updateSettings({ theme: { customColors: normalizedColors } })
      return normalizedColors
    },
    commitGeneratedTheme(payload) {
      settings.updateSettings({
        theme: {
          sourceColor: payload.sourceColor,
          base: payload.themeBase,
          mode: payload.themeMode,
          ...(payload.customColors ? { customColors: payload.customColors } : {}),
        },
      })
      applyResolvedTheme(payload.theme)
      return payload.theme
    },
    reset() {
      settings.updateSettings({
        theme: {
          sourceColor: DEFAULT_SOURCE_COLOR,
          mode: 'light',
          base: 'md3Light',
        },
      })
      const theme = createAdminTheme()
      applyResolvedTheme(theme)
      return theme
    },
  }

  applyCurrent()
  return controller
}
