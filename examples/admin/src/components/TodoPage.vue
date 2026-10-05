<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { VaIcon } from 'vela-admin/components'

const route = useRoute()
const title = computed(() => String(route.meta.title ?? '功能待建设'))
const description = computed(() => String(route.meta.description ?? '菜单已建立，具体业务功能将在后续迭代中接入。'))
const tasks = computed(() => {
  const items = route.meta.todo

  return Array.isArray(items) && items.length > 0
    ? items.map((item) => String(item))
    : ['补充页面结构与交互', '接入真实数据和权限', '完善空状态、加载态和错误态']
})
</script>

<template>
  <section class="admin-todo-page">
    <header class="admin-todo-page__header">
      <div>
        <p class="admin-todo-page__eyebrow">功能规划</p>
        <h2>{{ title }}</h2>
        <p class="admin-todo-page__description">{{ description }}</p>
      </div>
      <var-chip type="warning" plain>待建设</var-chip>
    </header>

    <var-divider />

    <section class="admin-todo-page__list" aria-label="待建设功能">
      <div v-for="item in tasks" :key="item" class="admin-todo-page__item">
        <div class="admin-todo-page__icon">
          <VaIcon name="check" />
        </div>
        <div class="admin-todo-page__copy">
          <strong>{{ item }}</strong>
          <span>已纳入菜单规划，等待后续实现。</span>
        </div>
        <var-chip size="small" type="warning" plain>TODO</var-chip>
      </div>
    </section>
  </section>
</template>

<style scoped>
.admin-todo-page {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.admin-todo-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-todo-page__eyebrow {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-todo-page h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.admin-todo-page__description {
  max-width: 680px;
  margin: 8px 0 0;
  color: var(--color-on-surface-variant);
  line-height: 1.7;
}

.admin-todo-page__list {
  display: grid;
  gap: 10px;
}

.admin-todo-page__item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 12px;
}

.admin-todo-page__icon {
  display: grid;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  place-items: center;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-radius: 50%;
}

.admin-todo-page__copy {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 3px;
}

.admin-todo-page__copy strong {
  overflow-wrap: anywhere;
  font-weight: 600;
}

.admin-todo-page__copy span {
  color: var(--color-on-surface-variant);
  font-size: 13px;
}

@media (max-width: 560px) {
  .admin-todo-page__header {
    flex-direction: column;
  }

  .admin-todo-page__item {
    align-items: flex-start;
  }

  .admin-todo-page__item > .var-chip {
    margin-left: auto;
  }
}
</style>
