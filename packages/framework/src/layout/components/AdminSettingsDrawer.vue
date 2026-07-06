<script setup lang="ts">
import type { AdminLayoutMode, AdminScrollbarMode, AdminThemeBase, AdminThemeMode, ThemeColorChip } from '../../index'
import VaIcon from '../../icons/VaIcon.vue'
import AdminSettingsDrawerContent from './AdminSettingsDrawerContent.vue'

withDefaults(defineProps<{
  open?: boolean
  mode?: AdminLayoutMode
  sidebarWidth?: number
  sidebarCollapsedWidth?: number
  sidebarCollapsedIconSize?: number
  expandedParentBackground?: boolean
  scrollbar?: AdminScrollbarMode
  tagsView?: boolean
  menuSearch?: boolean
  themeBase?: AdminThemeBase
  themeMode?: AdminThemeMode
  sourceColor?: string
  customColors?: ThemeColorChip[]
}>(), {
  open: false,
  mode: 'side',
  sidebarWidth: 272,
  sidebarCollapsedWidth: 56,
  sidebarCollapsedIconSize: 26,
  expandedParentBackground: true,
  scrollbar: 'thin',
  tagsView: true,
  menuSearch: true,
  themeBase: 'md3Light',
  themeMode: 'light',
  sourceColor: '#6750A4',
  customColors: () => [],
})

const emit = defineEmits<{
  close: []
  'update:mode': [mode: AdminLayoutMode]
  'update:sidebarWidth': [value: number]
  'update:sidebarCollapsedWidth': [value: number]
  'update:sidebarCollapsedIconSize': [value: number]
  'update:expandedParentBackground': [value: boolean]
  'update:scrollbar': [value: AdminScrollbarMode]
  'update:tagsView': [value: boolean]
  'update:menuSearch': [value: boolean]
  'update:themeBase': [value: AdminThemeBase]
  'update:themeMode': [value: AdminThemeMode]
  'update:sourceColor': [value: string]
  openThemeGenerator: []
}>()
</script>

<template>
  <var-popup
    class="va-admin-settings-drawer va-admin-settings-drawer--open"
    data-testid="admin-settings-popup"
    :show="open"
    :default-style="false"
    position="right"
    teleport="body"
    @update:show="(value: boolean) => { if (!value) emit('close') }"
  >
    <aside class="va-admin-settings-drawer__panel" aria-label="个性设置">
      <header class="va-admin-settings-drawer__header">
        <h2>个性设置</h2>
        <var-button text round aria-label="关闭设置" @click="emit('close')">
          <VaIcon name="close" :size="22" />
        </var-button>
      </header>

      <AdminSettingsDrawerContent
        :open="open"
        :mode="mode"
        :sidebar-width="sidebarWidth"
        :scrollbar="scrollbar"
        :tags-view="tagsView"
        :theme-base="themeBase"
        :theme-mode="themeMode"
        :source-color="sourceColor"
        :custom-colors="customColors"
        @update:mode="emit('update:mode', $event)"
        @update:sidebar-width="emit('update:sidebarWidth', $event)"
        @update:scrollbar="emit('update:scrollbar', $event)"
        @update:tags-view="emit('update:tagsView', $event)"
        @update:theme-base="emit('update:themeBase', $event)"
        @update:theme-mode="emit('update:themeMode', $event)"
        @update:source-color="emit('update:sourceColor', $event)"
        @open-theme-generator="emit('openThemeGenerator')"
      />
    </aside>
  </var-popup>
</template>

<style scoped>
.va-admin-settings-drawer__panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  box-sizing: border-box;
  width: min(380px, 100vw);
  height: 100dvh;
  overflow: auto;
  color: var(--color-text);
  background: var(--color-body, var(--card-background));
  border-left: 1px solid var(--va-admin-sidebar-border);
  box-shadow: none;
}

.va-admin-settings-drawer__header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background: var(--color-body, var(--card-background));
  border-bottom: 1px solid var(--va-admin-sidebar-border);
}

.va-admin-settings-drawer__header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .va-admin-settings-drawer__panel {
    width: 100vw;
  }
}
</style>
