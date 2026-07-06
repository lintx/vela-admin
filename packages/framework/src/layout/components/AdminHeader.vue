<script setup lang="ts">
import { ref } from 'vue'

import VaIcon from '../../icons/VaIcon.vue'

withDefaults(defineProps<{
  appName?: string
  pageTitle?: string
  sidebarCollapsed?: boolean
  mobile?: boolean
  showSidebarToggle?: boolean
  showAppName?: boolean
}>(), {
  appName: 'Vela Admin',
  pageTitle: '',
  sidebarCollapsed: false,
  mobile: false,
  showSidebarToggle: true,
  showAppName: true,
})

const emit = defineEmits<{
  toggleSidebar: []
  closeMobileTools: []
}>()

const mobileToolsOpen = ref(false)

function handleToggleSidebar(event: MouseEvent) {
  mobileToolsOpen.value = false
  emit('toggleSidebar')
  if (event.detail > 0) {
    const target = event.target as HTMLElement | null
    const button = target?.closest<HTMLElement>('.va-admin-header__menu-button')
      ?? (event.currentTarget as HTMLElement | null)

    window.setTimeout(() => button?.blur())
  }
}

function toggleMobileTools() {
  mobileToolsOpen.value = !mobileToolsOpen.value
  if (!mobileToolsOpen.value) {
    emit('closeMobileTools')
  }
}

function closeMobileTools() {
  mobileToolsOpen.value = false
  emit('closeMobileTools')
}
</script>

<template>
  <header class="va-admin-header" :class="{ 'va-admin-header--mobile': mobile }">
    <div class="va-admin-header__main">
      <var-button
        v-if="showSidebarToggle"
        class="va-admin-header__menu-button"
        text
        round
        aria-label="切换侧栏"
        data-testid="admin-sidebar-toggle"
        @click="handleToggleSidebar"
      >
        <VaIcon :name="mobile || sidebarCollapsed ? 'menu' : 'menu-open'" :size="22" />
      </var-button>

      <div v-if="!mobile && $slots.brand" class="va-admin-header__brand">
        <slot name="brand" />
      </div>

      <div v-if="!mobile && (showAppName || pageTitle)" class="va-admin-header__title">
        <span v-if="showAppName" class="va-admin-header__app">{{ appName }}</span>
        <span v-if="pageTitle" class="va-admin-header__page">{{ pageTitle }}</span>
      </div>

      <slot v-if="!mobile" name="title" />

      <slot v-if="!mobile" name="navigation" />
    </div>

    <div v-if="mobile" class="va-admin-header__mobile-brand">
      <slot name="brandCollapsed">{{ appName.slice(0, 1) }}</slot>
    </div>

    <div v-if="!mobile" class="va-admin-header__tools">
      <slot name="tools" />
    </div>

    <div v-else class="va-admin-header__mobile-actions">
      <var-button
        class="va-admin-header__more-button"
        text
        round
        aria-label="打开顶部工具菜单"
        :aria-expanded="mobileToolsOpen"
        data-testid="admin-header-more-button"
        @click="toggleMobileTools"
      >
        <VaIcon name="more" :size="22" />
      </var-button>

      <div
        v-if="mobileToolsOpen"
        class="va-admin-header__mobile-scrim"
        data-testid="admin-header-mobile-scrim"
        role="button"
        tabindex="-1"
        aria-label="关闭顶部工具菜单"
        @click="closeMobileTools"
      />

      <div
        v-if="mobileToolsOpen"
        class="va-admin-header__mobile-menu"
        data-testid="admin-header-mobile-menu"
        role="menu"
      >
        <slot name="tools" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.va-admin-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  width: 100%;
  height: var(--va-admin-header-height);
  min-width: 0;
  min-height: var(--va-admin-header-height);
  padding: 0 16px;
  color: var(--color-text);
  background: var(--color-body);
  border-bottom: 1px solid var(--va-admin-sidebar-border);
}

.va-admin-header__main,
.va-admin-header__tools {
  display: flex;
  align-items: center;
  min-width: 0;
}

.va-admin-header__main {
  flex: 1 1 0;
  gap: 8px;
}

.va-admin-header__tools {
  flex: 0 1 auto;
  justify-content: flex-end;
  gap: 8px;
  white-space: nowrap;
}

.va-admin-header__menu-button {
  flex: 0 0 auto;
}

.va-admin-header__menu-button :deep(.var-hover-overlay--focusing) {
  opacity: 0;
}

.va-admin-header__title {
  display: flex;
  flex: 0 1 auto;
  align-items: baseline;
  min-width: 0;
  gap: 8px;
}

.va-admin-header__brand {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  min-width: 0;
}

.va-admin-header__app {
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.va-admin-header__page {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  color: var(--color-on-surface-variant);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.va-admin-header__mobile-brand,
.va-admin-header__mobile-actions {
  display: none;
}

@media (max-width: 768px) {
  .va-admin-header {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) 48px;
    gap: 0;
    height: var(--va-admin-header-height);
    min-height: var(--va-admin-header-height);
    padding: 0 8px;
  }

  .va-admin-header__main {
    grid-column: 1;
    justify-content: flex-start;
    gap: 0;
  }

  .va-admin-header__mobile-brand {
    display: flex;
    grid-column: 2;
    align-items: center;
    justify-content: center;
    min-width: 0;
  }

  .va-admin-header__mobile-actions {
    position: relative;
    display: flex;
    grid-column: 3;
    justify-content: flex-end;
  }

  .va-admin-header__more-button :deep(.var-hover-overlay--focusing) {
    opacity: 0;
  }

  .va-admin-header__mobile-scrim {
    position: fixed;
    inset: var(--va-admin-header-height) 0 0;
    z-index: 110;
    padding: 0;
    cursor: default;
    background: transparent;
    border: 0;
  }

  .va-admin-header__mobile-menu {
    position: fixed;
    top: calc(var(--va-admin-header-height) + 4px);
    right: 8px;
    z-index: 120;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-sizing: border-box;
    width: min(280px, calc(100vw - 16px));
    max-height: calc(100dvh - var(--va-admin-header-height) - 16px);
    padding: 8px;
    overflow-y: auto;
    color: var(--color-text);
    background: var(--color-body);
    border: 1px solid var(--va-admin-sidebar-border);
    box-shadow:
      0 2px 6px rgb(0 0 0 / 12%),
      0 8px 24px rgb(0 0 0 / 10%);
  }

  .va-admin-header__mobile-menu :deep(.var-space) {
    display: flex;
    flex-direction: column !important;
    align-items: stretch !important;
    width: 100%;
    gap: 4px !important;
  }

  .va-admin-header__mobile-menu :deep(.var-button) {
    justify-content: flex-start !important;
    width: 100%;
    height: 38px;
    min-width: 0;
    padding: 0 12px;
    border-radius: 999px;
  }

  .va-admin-header__mobile-menu :deep(.var-button__content) {
    justify-content: flex-start;
    width: 100%;
    gap: 10px;
  }

  .va-admin-header__mobile-menu :deep(.admin-preview__tool-label--adaptive),
  .va-admin-header__mobile-menu :deep(.va-admin-layout__tool-label--adaptive),
  .va-admin-header__mobile-menu :deep(.va-admin-menu-search__button-text),
  .va-admin-header__mobile-menu :deep(.va-admin-menu-search__shortcut) {
    position: static;
    display: inline-flex;
    width: auto;
    height: auto;
    padding: 0;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: nowrap;
    border: 0;
  }

  .va-admin-header__mobile-menu :deep(.va-admin-menu-search__button) {
    width: 100%;
    height: 38px;
    padding: 0 10px 0 12px;
    border-radius: 999px;
  }

  .va-admin-header__mobile-menu :deep(.va-admin-menu-search__shortcut) {
    margin-left: auto;
    padding: 0 6px;
    border: 1px solid var(--va-admin-sidebar-border);
  }
}
</style>
