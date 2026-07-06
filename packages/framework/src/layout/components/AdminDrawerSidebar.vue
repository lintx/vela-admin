<script setup lang="ts">
import type { AdminMenuItem } from '../../menu/create-menu-service'
import AdminSidebar from './AdminSidebar.vue'

withDefaults(defineProps<{
  open?: boolean
  appName?: string
  menus: AdminMenuItem[]
  activePaths?: string[]
  currentPath?: string
  width?: number
  iconSize?: number
}>(), {
  open: false,
  appName: 'Vela Admin',
  activePaths: () => [],
  currentPath: '',
  width: 272,
  iconSize: 22,
})

const emit = defineEmits<{
  close: []
  navigate: [path: string]
}>()

function navigate(path: string) {
  emit('navigate', path)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="va-admin-drawer-sidebar">
      <div
        v-if="open"
        class="va-admin-drawer-sidebar va-admin-drawer-sidebar--open"
        role="dialog"
        aria-modal="true"
        aria-label="移动端侧栏"
      >
        <button class="va-admin-drawer-sidebar__scrim" type="button" aria-label="关闭侧栏" @click="emit('close')" />
        <div class="va-admin-drawer-sidebar__panel">
          <AdminSidebar
            :menus="menus"
            :active-paths="activePaths"
            :current-path="currentPath"
            :width="width"
            :icon-size="iconSize"
            @navigate="navigate"
          >
            <template #brand>
              <slot name="brand">{{ appName }}</slot>
            </template>
          </AdminSidebar>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.va-admin-drawer-sidebar {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: minmax(0, auto) 1fr;
}

.va-admin-drawer-sidebar__scrim {
  position: fixed;
  inset: 0;
  padding: 0;
  cursor: pointer;
  background: rgb(0 0 0 / 32%);
  border: 0;
}

.va-admin-drawer-sidebar__panel {
  position: relative;
  z-index: 1;
  width: min(272px, 86vw);
  min-width: 0;
  height: 100dvh;
  overflow: hidden;
  background: var(--va-admin-sidebar-bg);
  box-shadow:
    0 2px 6px rgb(0 0 0 / 12%),
    0 8px 24px rgb(0 0 0 / 10%);
  transition: transform 180ms ease;
}

.va-admin-drawer-sidebar__panel :deep(.va-admin-sidebar) {
  width: 100%;
  min-width: 100%;
}

.va-admin-drawer-sidebar-enter-active,
.va-admin-drawer-sidebar-leave-active {
  transition: opacity 180ms ease;
}

.va-admin-drawer-sidebar-enter-from,
.va-admin-drawer-sidebar-leave-to {
  opacity: 0;
}

.va-admin-drawer-sidebar-enter-from .va-admin-drawer-sidebar__panel,
.va-admin-drawer-sidebar-leave-to .va-admin-drawer-sidebar__panel {
  transform: translateX(-100%);
}
</style>
