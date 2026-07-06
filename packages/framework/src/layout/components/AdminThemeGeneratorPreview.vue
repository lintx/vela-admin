<script setup lang="ts">
import type { StyleValue } from 'vue'

defineProps<{
  previewStyle: StyleValue
}>()
</script>

<template>
  <section
    class="va-admin-theme-generator__preview"
    data-testid="admin-theme-preview"
    :style="previewStyle"
  >
    <div class="va-admin-theme-generator__preview-shell">
      <aside class="va-admin-theme-generator__preview-sidebar">
        <strong>预览侧栏</strong>
        <span class="va-admin-theme-generator__preview-menu va-admin-theme-generator__preview-menu--active">控制台</span>
        <span class="va-admin-theme-generator__preview-menu">系统管理</span>
      </aside>
      <main class="va-admin-theme-generator__preview-main">
        <header class="va-admin-theme-generator__preview-header">主题预览</header>
        <nav class="va-admin-theme-generator__preview-tags">
          <span>控制台</span>
          <span class="va-admin-theme-generator__preview-tag--active">主题生成器</span>
        </nav>
        <section class="va-admin-theme-generator__preview-card">
          <var-input
            data-testid="admin-theme-preview-keyword"
            aria-label="预览关键词"
            placeholder="请输入关键词"
          />
          <var-space :size="[8, 8]">
            <var-button>默认按钮</var-button>
            <var-button type="primary">主要操作</var-button>
            <var-button type="danger" text>危险操作</var-button>
          </var-space>
          <div class="va-admin-theme-generator__preview-switch">
            <span>启用标签栏</span>
            <var-switch :model-value="true" readonly />
          </div>
        </section>
      </main>
    </div>
  </section>
</template>

<style scoped>
.va-admin-theme-generator__preview {
  min-height: 0;
  overflow: auto;
  padding: 16px;
  background: var(--color-body, var(--card-background));
}

.va-admin-theme-generator__preview-shell {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  min-height: 360px;
  color: var(--color-text);
  background: var(--color-body, var(--card-background));
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--card-border-radius);
  overflow: hidden;
}

.va-admin-theme-generator__preview-sidebar {
  display: grid;
  align-content: start;
  padding: 12px 0;
  color: var(--va-admin-menu-text);
  background: var(--va-admin-sidebar-bg);
  border-right: 1px solid var(--va-admin-sidebar-border);
  gap: 4px;
}

.va-admin-theme-generator__preview-sidebar strong {
  padding: 0 12px 8px;
  color: var(--color-text);
  font-size: 13px;
}

.va-admin-theme-generator__preview-menu {
  min-height: 36px;
  padding: 9px 12px;
  font-size: 13px;
}

.va-admin-theme-generator__preview-menu--active {
  color: var(--va-admin-menu-active-text);
  background: var(--va-admin-menu-active-bg);
  border-left: 3px solid var(--va-admin-menu-indicator);
}

.va-admin-theme-generator__preview-main {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-width: 0;
}

.va-admin-theme-generator__preview-header,
.va-admin-theme-generator__preview-tags {
  min-height: 40px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--va-admin-sidebar-border);
}

.va-admin-theme-generator__preview-tags {
  display: flex;
  padding: 0;
}

.va-admin-theme-generator__preview-tags span {
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  font-size: 13px;
  border-right: 1px solid var(--va-admin-sidebar-border);
}

.va-admin-theme-generator__preview-tag--active {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-bottom: 2px solid var(--color-primary);
}

.va-admin-theme-generator__preview-card {
  display: grid;
  align-content: start;
  padding: 16px;
  background: var(--color-body, var(--card-background));
  gap: 12px;
}

.va-admin-theme-generator__preview-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-on-surface-variant);
}

@media (max-width: 768px) {
  .va-admin-theme-generator__preview-shell {
    grid-template-columns: 1fr;
  }

  .va-admin-theme-generator__preview-sidebar {
    display: none;
  }
}
</style>
