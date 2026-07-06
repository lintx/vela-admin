<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import VaIcon from '../../icons/VaIcon.vue'
import type { AdminMenuItem } from '../../menu/create-menu-service'
import { searchAdminMenus } from '../../menu/menu-search'
import AdminMenuSearchPanel from './AdminMenuSearchPanel.vue'

const props = withDefaults(defineProps<{
  menus: AdminMenuItem[]
  shortcut?: boolean
}>(), {
  shortcut: true,
})

const emit = defineEmits<{
  navigate: [path: string]
}>()

const open = ref(false)
const keyword = ref('')
const activeIndex = ref(0)
const panelRef = ref<InstanceType<typeof AdminMenuSearchPanel> | null>(null)
const results = computed(() => searchAdminMenus(props.menus, keyword.value))
const isMac = computed(() => {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
})
const shortcutText = computed(() => (isMac.value ? '⌘ K' : 'Ctrl K'))

function openPanel() {
  open.value = true
  nextTick(() => panelRef.value?.focusInput())
}

function closePanel() {
  open.value = false
  keyword.value = ''
  activeIndex.value = 0
}

function handleKeydown(event: KeyboardEvent) {
  if (props.shortcut && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    openPanel()
    return
  }

  if (!open.value) {
    return
  }

  if (event.key === 'Escape') {
    closePanel()
  }
}

function handleInputKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    const result = results.value[activeIndex.value]
    if (result) {
      selectResult(result.path)
    }
  }
}

function selectResult(path: string) {
  emit('navigate', path)
  closePanel()
}

watch(results, () => {
  activeIndex.value = 0
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="va-admin-menu-search">
    <var-button
      class="va-admin-menu-search__button"
      aria-label="打开菜单搜索"
      data-testid="admin-menu-search-button"
      text
      @click="openPanel"
    >
      <VaIcon name="search" />
      <span class="va-admin-menu-search__button-text">搜索</span>
      <kbd
        class="va-admin-menu-search__shortcut"
        data-testid="admin-menu-search-shortcut"
      >
        {{ shortcutText }}
      </kbd>
    </var-button>

    <div v-if="open" class="va-admin-menu-search__overlay" @click.self="closePanel">
      <AdminMenuSearchPanel
        ref="panelRef"
        v-model:keyword="keyword"
        :results="results"
        :active-index="activeIndex"
        @input-keydown="handleInputKeydown"
        @select="selectResult"
      />
    </div>
  </div>
</template>

<style scoped>
.va-admin-menu-search {
  display: inline-flex;
}

.va-admin-menu-search__button {
  height: 34px;
  padding: 0 8px 0 10px;
  background: transparent;
  cursor: pointer;
  box-shadow: none;
}

.va-admin-menu-search__button.var-button,
.va-admin-menu-search__button.var-button:hover,
.va-admin-menu-search__button.var-button:focus,
.va-admin-menu-search__button :deep(.var-elevation--2),
.va-admin-menu-search__button :deep(.var-elevation--3) {
  background: transparent;
  box-shadow: none;
}

.va-admin-menu-search__button :deep(.var-button__content) {
  flex-wrap: nowrap;
  gap: 8px;
  white-space: nowrap;
}

.va-admin-menu-search__button :deep(.va-icon),
.va-admin-menu-search__button-text {
  flex: 0 0 auto;
}

.va-admin-menu-search__button-text {
  font-size: 13px;
  line-height: 1;
}

.va-admin-menu-search__shortcut {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 20px;
  padding: 0 6px;
  font-family: inherit;
  font-size: 12px;
  color: var(--color-on-surface-variant);
  background: var(--color-surface-container-high, color-mix(in srgb, var(--color-on-surface-variant) 8%, transparent));
  border: 1px solid var(--va-admin-sidebar-border);
  border-radius: var(--card-border-radius, 4px);
}

.va-admin-menu-search__overlay {
  position: fixed;
  inset: 0;
  z-index: 160;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 80px 16px 16px;
  background: color-mix(in srgb, var(--color-scrim, #000) 28%, transparent);
}

@media (max-width: 960px) {
  .va-admin-menu-search__shortcut {
    display: none;
  }
}

@media (max-width: 768px) {
  .va-admin-menu-search__button-text,
  .va-admin-menu-search__shortcut {
    display: none;
  }

  .va-admin-menu-search__button {
    width: 36px;
    height: 36px;
    padding: 0;
  }

  .va-admin-menu-search__overlay {
    padding: 56px 8px 8px;
  }
}
</style>
