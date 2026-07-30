<script setup lang="ts">
import type { AdminThemeBase } from '../../theme/create-theme'

withDefaults(defineProps<{
  open?: boolean
  themeBase?: AdminThemeBase
  previewVisible?: boolean
}>(), {
  open: false,
  themeBase: 'md3Light',
  previewVisible: false,
})

const emit = defineEmits<{
  showCurrent: []
  showGenerated: []
  cancel: []
  apply: []
}>()
</script>

<template>
  <div
    v-if="open"
    class="va-admin-theme-preview-bar"
    :class="{
      'va-admin-theme-preview-bar--md3': themeBase.startsWith('md3'),
      'va-admin-theme-preview-bar--md2': themeBase.startsWith('md2'),
    }"
    role="region"
    aria-label="主题预览"
  >
    <span class="va-admin-theme-preview-bar__title">主题预览</span>
    <var-button
      data-testid="admin-theme-preview-current"
      class="va-admin-theme-preview-bar__action"
      :class="{ 'va-admin-theme-preview-bar__action--active': !previewVisible }"
      :aria-pressed="!previewVisible"
      text
      @click="emit('showCurrent')"
    >
      当前主题
    </var-button>
    <var-button
      data-testid="admin-theme-preview-generated"
      class="va-admin-theme-preview-bar__action"
      :class="{ 'va-admin-theme-preview-bar__action--active': previewVisible }"
      :aria-pressed="previewVisible"
      text
      @click="emit('showGenerated')"
    >
      预览主题
    </var-button>
    <var-button
      data-testid="admin-theme-preview-cancel"
      class="va-admin-theme-preview-bar__action"
      text
      @click="emit('cancel')"
    >
      取消预览
    </var-button>
    <var-button
      data-testid="admin-theme-preview-apply"
      class="va-admin-theme-preview-bar__apply"
      type="primary"
      @click="emit('apply')"
    >
      应用主题
    </var-button>
  </div>
</template>

<style scoped>
.va-admin-theme-preview-bar {
  position: fixed;
  bottom: 18px;
  left: 50%;
  z-index: 2400;
  display: inline-flex;
  align-items: center;
  max-width: calc(100vw - 24px);
  min-height: 44px;
  padding: 5px 10px 5px 6px;
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-body) 94%, transparent);
  border: 1px solid var(--va-admin-sidebar-border);
  border-radius: 18px;
  box-shadow: 0 8px 28px rgb(0 0 0 / 18%);
  transform: translateX(-50%);
  backdrop-filter: blur(10px);
  gap: 4px;
}

.va-admin-theme-preview-bar--md2 {
  padding-right: 12px;
  border-radius: 6px;
}

.va-admin-theme-preview-bar--md3 {
  border-radius: 18px;
}

.va-admin-theme-preview-bar__title {
  padding: 0 10px;
  color: var(--color-on-surface-variant);
  font-size: 12px;
  white-space: nowrap;
}

.va-admin-theme-preview-bar__action,
.va-admin-theme-preview-bar__apply {
  min-width: 0;
  height: 32px;
  white-space: nowrap;
}

.va-admin-theme-preview-bar__action--active {
  color: var(--color-primary);
  background: var(--va-admin-menu-active-bg);
}

@media (max-width: 640px) {
  .va-admin-theme-preview-bar {
    right: 12px;
    left: 12px;
    justify-content: center;
    width: auto;
    transform: none;
  }

  .va-admin-theme-preview-bar__title {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .va-admin-theme-preview-bar__action,
  .va-admin-theme-preview-bar__apply {
    flex: 1 1 0;
    padding-right: 6px;
    padding-left: 6px;
  }
}
</style>
