<script setup lang="ts">
import { ref } from 'vue'

import VaIcon from '../../icons/VaIcon.vue'
import type { AdminMenuSearchResult } from '../../menu/menu-search'

defineProps<{
  keyword: string
  results: AdminMenuSearchResult[]
  activeIndex: number
}>()

const emit = defineEmits<{
  'update:keyword': [value: string]
  inputKeydown: [event: KeyboardEvent]
  select: [path: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function focusInput() {
  inputRef.value?.focus()
}

defineExpose({ focusInput })
</script>

<template>
  <section class="va-admin-menu-search__panel" role="dialog" aria-label="菜单搜索">
    <div class="va-admin-menu-search__field">
      <VaIcon name="search" class="va-admin-menu-search__field-icon" />
      <label class="va-admin-menu-search__label" for="va-admin-menu-search-input">搜索菜单、路径和权限</label>
      <input
        id="va-admin-menu-search-input"
        ref="inputRef"
        :value="keyword"
        class="va-admin-menu-search__input"
        data-testid="admin-menu-search-input"
        type="search"
        autocomplete="off"
        @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
        @keydown="emit('inputKeydown', $event)"
      >
      <kbd class="va-admin-menu-search__escape">Esc</kbd>
    </div>

    <div class="va-admin-menu-search__results" role="listbox">
      <div v-if="!keyword" class="va-admin-menu-search__hint">
        输入页面名称、路径或权限码快速跳转
      </div>
      <button
        v-for="(result, index) in results"
        :key="result.path"
        class="va-admin-menu-search__result"
        :class="{ 'va-admin-menu-search__result--active': index === activeIndex }"
        type="button"
        role="option"
        :aria-selected="index === activeIndex"
        @click="emit('select', result.path)"
      >
        <VaIcon v-if="result.icon" :name="result.icon" />
        <span class="va-admin-menu-search__result-main">
          <span class="va-admin-menu-search__result-title">{{ result.title }}</span>
          <span v-if="result.parents.length" class="va-admin-menu-search__result-trail">
            {{ result.parents.join(' / ') }}
          </span>
        </span>
      </button>

      <div v-if="keyword && results.length === 0" class="va-admin-menu-search__empty" aria-live="polite">
        <strong>没有匹配结果</strong>
        <span>试试页面标题、路由路径或权限码。</span>
      </div>
    </div>

    <footer class="va-admin-menu-search__footer" data-testid="admin-menu-search-footer">
      <span class="va-admin-menu-search__footer-item">
        <kbd class="va-admin-menu-search__key">Enter</kbd>
        <span>确认</span>
      </span>
      <span class="va-admin-menu-search__footer-item">
        <kbd class="va-admin-menu-search__key">↑</kbd>
        <kbd class="va-admin-menu-search__key">↓</kbd>
        <span>切换</span>
      </span>
      <span class="va-admin-menu-search__footer-item">
        <kbd class="va-admin-menu-search__key">Esc</kbd>
        <span>关闭</span>
      </span>
    </footer>
  </section>
</template>

<style scoped>
.va-admin-menu-search__escape,
.va-admin-menu-search__key {
  display: inline-flex;
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

.va-admin-menu-search__panel {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: min(680px, 100%);
  max-height: calc(100dvh - 96px);
  color: var(--color-text);
  background: var(--color-body, var(--card-background));
  border: 1px solid var(--va-admin-sidebar-border);
  border-radius: var(--card-border-radius);
  overflow: hidden;
  box-shadow: 0 10px 28px color-mix(in srgb, #000 18%, transparent);
}

.va-admin-menu-search__field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  min-height: 56px;
  padding: 0 14px;
  border-bottom: 1px solid var(--va-admin-sidebar-border);
  gap: 10px;
}

.va-admin-menu-search__field-icon {
  color: var(--color-on-surface-variant);
}

.va-admin-menu-search__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.va-admin-menu-search__input {
  box-sizing: border-box;
  width: 100%;
  min-height: 54px;
  padding: 0;
  font-size: 16px;
  color: var(--color-text);
  background: transparent;
  border: 0;
  outline: none;
}

.va-admin-menu-search__input:focus {
  outline: none;
}

.va-admin-menu-search__results {
  min-height: 0;
  max-height: min(420px, calc(100dvh - 232px));
  overflow: auto;
  padding: 6px;
}

.va-admin-menu-search__hint {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--color-on-surface-variant);
}

.va-admin-menu-search__result {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  min-height: 58px;
  padding: 9px 10px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--card-border-radius, 4px);
  gap: 10px;
}

.va-admin-menu-search__result:hover,
.va-admin-menu-search__result--active {
  background: var(--va-admin-menu-hover-bg);
}

.va-admin-menu-search__result-main {
  display: grid;
  grid-column: 2;
  min-width: 0;
  gap: 2px;
}

.va-admin-menu-search__result > .va-icon {
  grid-column: 1;
}

.va-admin-menu-search__result-title,
.va-admin-menu-search__result-trail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.va-admin-menu-search__result-title {
  font-size: 14px;
}

.va-admin-menu-search__result-trail {
  font-size: 12px;
  color: var(--color-on-surface-variant);
}

.va-admin-menu-search__empty {
  display: grid;
  padding: 24px 16px;
  font-size: 14px;
  color: var(--color-on-surface-variant);
  gap: 6px;
}

.va-admin-menu-search__empty strong {
  color: var(--color-text);
}

.va-admin-menu-search__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-height: 44px;
  padding: 8px 14px;
  color: var(--color-on-surface-variant);
  background: var(--color-surface-container-low, var(--color-body));
  border-top: 1px solid var(--va-admin-sidebar-border);
  gap: 12px;
}

.va-admin-menu-search__footer-item {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  font-size: 13px;
  white-space: nowrap;
  gap: 5px;
}

@media (max-width: 768px) {
  .va-admin-menu-search__footer {
    display: none;
  }
}
</style>
