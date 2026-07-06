<script setup lang="ts">
import type { AdminMenuItem } from '../../menu/create-menu-service'
import AdminFloatingMenu from './AdminFloatingMenu.vue'

defineProps<{
  menu: AdminMenuItem
  activePaths: string[]
  currentPath: string
  top: number
}>()

const emit = defineEmits<{
  navigate: [path: string]
  mouseleave: [event: MouseEvent]
}>()
</script>

<template>
  <div
    class="va-admin-collapsed-sub-menu"
    :style="{ '--va-admin-collapsed-sub-menu-top': `${top}px` }"
    role="menu"
    @mouseleave="emit('mouseleave', $event)"
  >
    <div class="va-admin-collapsed-sub-menu__panel va-admin-scrollbar">
      <AdminFloatingMenu
        :title="menu.title"
        :menus="menu.children"
        :active-paths="activePaths"
        :current-path="currentPath"
        @navigate="emit('navigate', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.va-admin-collapsed-sub-menu {
  position: absolute;
  top: var(--va-admin-collapsed-sub-menu-top);
  left: calc(var(--va-admin-sidebar-current-width) - 1px);
  z-index: 20;
  box-sizing: border-box;
  min-width: 220px;
  padding: 8px 0 0 9px;
}

.va-admin-collapsed-sub-menu__panel {
  --va-admin-floating-menu-max-height: max(180px, calc(100dvh - var(--va-admin-collapsed-sub-menu-top) - 24px));

  box-sizing: border-box;
  min-width: max-content;
  max-height: var(--va-admin-floating-menu-max-height);
  padding: 0;
  overflow: visible;
}

</style>
