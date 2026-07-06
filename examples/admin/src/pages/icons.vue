<script setup>
import { computed, ref } from 'vue'

import { VaIcon } from 'vela-admin/components'
import { getAdminSemanticIconEntries } from 'vela-admin/icons'

const keyword = ref('')
const semanticIcons = getAdminSemanticIconEntries()
const filteredIcons = computed(() => {
  const value = keyword.value.trim().toLowerCase()

  if (!value) {
    return semanticIcons
  }

  return semanticIcons.filter((icon) => {
    return icon.name.includes(value)
      || icon.label.toLowerCase().includes(value)
      || icon.usage.toLowerCase().includes(value)
      || icon.phosphor.includes(value)
      || icon.tabler.includes(value)
  })
})

const usageExamples = [
  {
    title: '默认语义图标',
    code: '<VaIcon name="dashboard" />',
    icon: 'dashboard',
  },
  {
    title: '显式 Phosphor',
    code: '<VaIcon library="phosphor" name="users" />',
    icon: 'phosphor:users',
  },
  {
    title: '显式 Tabler',
    code: '<VaIcon library="tabler" name="database" />',
    icon: 'tabler:database',
  },
  {
    title: '路由 meta',
    code: "icon: 'icons'",
    icon: 'icons',
  },
]

function splitIconValue(value) {
  const [library, name] = value.split(':')

  return name ? { library, name } : { library: undefined, name: value }
}
</script>

<template>
  <section class="admin-icons admin-page-span">
    <header class="admin-icons__header">
      <div>
        <p class="admin-icons__eyebrow">图标</p>
        <h2>Vela Admin 图标用法</h2>
        <span>默认使用 Phosphor regular，语义名覆盖框架内部与示例菜单；需要指定库时可显式传入 Phosphor 或 Tabler。</span>
      </div>
      <var-input
        v-model="keyword"
        class="admin-icons__search"
        placeholder="搜索语义名、用途或库内名称"
      />
    </header>

    <div class="admin-icons__examples">
      <div
        v-for="example in usageExamples"
        :key="example.title"
        class="admin-icons__example"
      >
        <VaIcon
          :name="splitIconValue(example.icon).name"
          :library="splitIconValue(example.icon).library"
        />
        <strong>{{ example.title }}</strong>
        <code>{{ example.code }}</code>
      </div>
    </div>

    <section class="admin-icons__panel">
      <div class="admin-icons__panel-header">
        <h3>语义图标映射</h3>
        <span>{{ filteredIcons.length }} / {{ semanticIcons.length }}</span>
      </div>

      <div class="admin-icons__grid">
        <div
          v-for="icon in filteredIcons"
          :key="icon.name"
          class="admin-icons__item"
        >
          <div class="admin-icons__preview">
            <VaIcon :name="icon.name" />
          </div>
          <div class="admin-icons__body">
            <strong>{{ icon.name }}</strong>
            <span>{{ icon.label }}</span>
            <p>{{ icon.usage }}</p>
            <code>phosphor:{{ icon.phosphor }}</code>
            <code>tabler:{{ icon.tabler }}</code>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.admin-page-span {
  grid-column: 1 / -1;
}

.admin-icons {
  display: grid;
  gap: 16px;
}

.admin-icons__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
  align-items: start;
  gap: 16px;
}

.admin-icons__eyebrow {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-icons h2,
.admin-icons h3 {
  margin: 0;
  font-weight: 600;
}

.admin-icons h2 {
  font-size: 22px;
}

.admin-icons__header span,
.admin-icons__panel-header span,
.admin-icons__body span,
.admin-icons__body p {
  color: var(--color-on-surface-variant);
}

.admin-icons__header span {
  display: block;
  max-width: 760px;
  margin-top: 8px;
  line-height: 1.7;
}

.admin-icons__search {
  align-self: center;
}

.admin-icons__examples,
.admin-icons__grid {
  display: grid;
  gap: 12px;
}

.admin-icons__examples {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.admin-icons__example,
.admin-icons__item {
  min-width: 0;
  border: 1px solid var(--color-outline-variant);
}

.admin-icons__example {
  display: grid;
  padding: 16px;
  gap: 8px;
}

.admin-icons__example .va-icon {
  color: var(--color-primary);
  font-size: 28px;
}

.admin-icons code {
  display: inline-block;
  max-width: 100%;
  padding: 3px 6px;
  overflow: hidden;
  font-family: inherit;
  font-size: 12px;
  color: var(--color-on-surface-variant);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: color-mix(in srgb, var(--color-primary) 7%, transparent);
  border-radius: var(--card-border-radius, 4px);
}

.admin-icons__panel {
  min-width: 0;
  padding-top: 16px;
  border-top: 1px solid var(--color-outline-variant);
}

.admin-icons__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
}

.admin-icons__grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.admin-icons__item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  padding: 14px;
  gap: 12px;
}

.admin-icons__preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 9%, transparent);
  border-radius: var(--card-border-radius, 4px);
}

.admin-icons__preview .va-icon {
  font-size: 24px;
}

.admin-icons__body {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.admin-icons__body p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .admin-icons__examples,
  .admin-icons__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .admin-icons__header,
  .admin-icons__examples,
  .admin-icons__grid {
    grid-template-columns: 1fr;
  }
}
</style>
