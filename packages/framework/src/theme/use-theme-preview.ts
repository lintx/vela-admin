import { readonly, ref, shallowRef, type Ref } from 'vue'

import type { ResolvedAdminTheme } from './create-theme'
import {
  type AdminGeneratedThemePayload,
  type AdminThemeApply,
  type AdminThemeController,
} from './use-admin-theme'

export type AdminThemePreviewPayload = AdminGeneratedThemePayload

export interface UseThemePreviewOptions {
  theme: AdminThemeController
  applyTheme?: AdminThemeApply
}

export interface AdminThemePreviewController {
  readonly generatorOpen: Readonly<Ref<boolean>>
  readonly barOpen: Readonly<Ref<boolean>>
  readonly previewVisible: Readonly<Ref<boolean>>
  openGenerator(): void
  closeGenerator(): void
  preview(payload: AdminThemePreviewPayload): void
  showCurrent(): void
  showGenerated(): void
  cancel(): void
  apply(payload?: AdminThemePreviewPayload): void
}

export function useThemePreview(options: UseThemePreviewOptions): AdminThemePreviewController {
  const { theme, applyTheme = theme.applyTheme } = options
  const generatorOpen = ref(false)
  const barOpen = ref(false)
  const previewVisible = ref(false)
  const previewPayload = shallowRef<AdminThemePreviewPayload | null>(null)
  const currentSnapshot = shallowRef<ResolvedAdminTheme | null>(null)

  function clearTransaction() {
    barOpen.value = false
    previewVisible.value = false
    previewPayload.value = null
    currentSnapshot.value = null
  }

  function cancel() {
    if (currentSnapshot.value) {
      applyTheme(currentSnapshot.value)
    }

    clearTransaction()
    generatorOpen.value = true
  }

  return {
    generatorOpen: readonly(generatorOpen),
    barOpen: readonly(barOpen),
    previewVisible: readonly(previewVisible),
    openGenerator() {
      if (barOpen.value) {
        cancel()
        return
      }

      generatorOpen.value = true
    },
    closeGenerator() {
      generatorOpen.value = false
      theme.applyCurrent()
    },
    preview(payload) {
      currentSnapshot.value = theme.createTheme()
      previewPayload.value = payload
      previewVisible.value = true
      generatorOpen.value = false
      barOpen.value = true
      applyTheme(payload.theme)
    },
    showCurrent() {
      if (!currentSnapshot.value) {
        return
      }

      previewVisible.value = false
      applyTheme(currentSnapshot.value)
    },
    showGenerated() {
      if (!previewPayload.value) {
        return
      }

      previewVisible.value = true
      applyTheme(previewPayload.value.theme)
    },
    cancel,
    apply(payload) {
      const resolvedPayload = payload ?? previewPayload.value
      if (!resolvedPayload) {
        return
      }

      theme.commitGeneratedTheme(resolvedPayload)
      generatorOpen.value = false
      clearTransaction()
    },
  }
}
