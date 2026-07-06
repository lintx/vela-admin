<script setup>
import { VaIcon } from 'vela-admin/components'

const props = defineProps({
  active: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
})

const steps = [
  { title: '多级示例', path: '/menu-demo', icon: 'demo', directory: true },
  { title: '父有图标 / 子无图标', path: '/menu-demo/icon-parent/text-child', icon: 'level-1', directory: false },
  { title: '父有图标 / 子有图标', path: '/menu-demo/icon-parent/icon-child', icon: 'security', directory: false },
  { title: '父无图标 / 子无图标', path: '/menu-demo/text-parent/text-child', icon: 'level-2', directory: false },
  { title: '父无图标 / 子有图标', path: '/menu-demo/text-parent/icon-child', icon: 'user', directory: false },
  { title: '四级页面', path: '/menu-demo/level1/level2/level3/leaf', icon: 'level-4', directory: false },
]

const leafStep = steps.find((item) => !item.directory)
</script>

<template>
  <section class="admin-menu-showcase admin-page-span">
    <div class="admin-menu-showcase__surface">
      <div class="admin-menu-showcase__header">
        <p>多级菜单</p>
        <h2>{{ title }}</h2>
        <span>{{ description }}</span>
      </div>

      <var-steps class="admin-menu-showcase__steps" :active="active">
        <var-step v-for="item in steps" :key="item.path">
          {{ item.title }}
        </var-step>
      </var-steps>

      <var-row :gutter="[12, 12]">
        <var-col v-for="(item, index) in steps" :key="item.path" :span="24" :md="8">
          <button
            class="admin-menu-showcase__item"
            :class="{
              'admin-menu-showcase__item--active': index === active,
              'admin-menu-showcase__item--directory': item.directory,
            }"
            type="button"
            :disabled="item.directory"
            @click="!item.directory && $router.push(item.path)"
          >
            <VaIcon :name="item.icon" />
            <strong>{{ item.title }}</strong>
            <span>{{ item.path }}</span>
            <small>{{ item.directory ? '菜单目录' : '可访问页面' }}</small>
          </button>
        </var-col>
      </var-row>

      <var-divider />

      <var-space :size="[8, 8]">
        <var-button v-if="leafStep && active !== steps.indexOf(leafStep)" type="primary" @click="$router.push(leafStep.path)">
          进入{{ leafStep.title }}
        </var-button>
      </var-space>
    </div>
  </section>
</template>

<style scoped>
.admin-page-span {
  grid-column: 1 / -1;
}

.admin-menu-showcase__surface {
  min-width: 0;
}

.admin-menu-showcase__header {
  margin-bottom: 22px;
}

.admin-menu-showcase__header p {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-menu-showcase__header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.admin-menu-showcase__header span {
  display: block;
  margin-top: 8px;
  color: var(--color-on-surface-variant);
  line-height: 1.7;
}

.admin-menu-showcase__steps {
  margin-bottom: 22px;
}

.admin-menu-showcase__item {
  display: grid;
  width: 100%;
  min-height: 132px;
  align-content: center;
  justify-items: center;
  padding: 16px;
  color: inherit;
  font: inherit;
  text-align: center;
  gap: 8px;
  background: transparent;
  border: 1px solid var(--color-outline-variant);
}

.admin-menu-showcase__item:not(.admin-menu-showcase__item--directory) {
  cursor: pointer;
}

.admin-menu-showcase__item--directory {
  cursor: default;
}

.admin-menu-showcase__item:disabled {
  color: inherit;
}

.admin-menu-showcase__item .va-icon {
  color: var(--color-primary);
  font-size: 28px;
}

.admin-menu-showcase__item strong {
  font-weight: 600;
}

.admin-menu-showcase__item span {
  color: var(--color-on-surface-variant);
  font-size: 12px;
}

.admin-menu-showcase__item small {
  color: var(--color-on-surface-variant);
  font-size: 12px;
}

.admin-menu-showcase__item--active {
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-container));
  border-color: color-mix(in srgb, var(--color-primary) 26%, transparent);
}
</style>
