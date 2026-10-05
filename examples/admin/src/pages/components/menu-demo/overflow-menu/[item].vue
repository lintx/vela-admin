<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const itemNumber = computed(() => {
  const value = String(route.params.item ?? '')
  const matched = value.match(/^item-(\d+)$/)

  return matched ? Number(matched[1]) : undefined
})
const itemLabel = computed(() => {
  return typeof itemNumber.value === 'number'
    ? `超长菜单项 ${String(itemNumber.value).padStart(2, '0')}`
    : '超长菜单项'
})
</script>

<template>
  <section class="overflow-menu-page">
    <div class="overflow-menu-page__surface">
      <div class="overflow-menu-page__eyebrow">Overflow Menu</div>
      <h1 class="overflow-menu-page__title">{{ itemLabel }}</h1>
      <p class="overflow-menu-page__description">
        当前页面用于验证开发环境超长菜单的路由跳转、active 链路和收缩态浮层滚动边界。
      </p>
    </div>
  </section>
</template>

<style scoped>
.overflow-menu-page {
  display: grid;
  align-items: start;
  min-height: 100%;
}

.overflow-menu-page__surface {
  box-sizing: border-box;
  padding-top: 8px;
  color: var(--color-on-surface);
}

.overflow-menu-page__eyebrow {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-primary);
  text-transform: uppercase;
}

.overflow-menu-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
}

.overflow-menu-page__description {
  max-width: 560px;
  margin: 12px 0 0;
  color: var(--color-on-surface-variant);
  line-height: 1.7;
}
</style>
