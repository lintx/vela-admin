<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'

import type { AdminLayoutMode, AdminScrollbarMode, AdminThemeBase, AdminThemeMode, ThemeColorChip } from '../../index'
import { createAdminThemeModeTransition } from '../../theme'
import { layoutModes, presetThemeColors, scrollbarModes, themeBases, themeModes } from './admin-settings-drawer-options'

type ThemeColorOption = ThemeColorChip & { custom?: boolean }

const props = withDefaults(defineProps<{
  open?: boolean
  mode?: AdminLayoutMode
  sidebarWidth?: number
  scrollbar?: AdminScrollbarMode
  tagsView?: boolean
  themeBase?: AdminThemeBase
  themeMode?: AdminThemeMode
  sourceColor?: string
  customColors?: ThemeColorChip[]
}>(), {
  open: false,
  mode: 'side',
  sidebarWidth: 272,
  scrollbar: 'thin',
  tagsView: true,
  themeBase: 'md3Light',
  themeMode: 'light',
  sourceColor: '#6750A4',
  customColors: () => [],
})

const emit = defineEmits<{
  'update:mode': [mode: AdminLayoutMode]
  'update:sidebarWidth': [value: number]
  'update:scrollbar': [value: AdminScrollbarMode]
  'update:tagsView': [value: boolean]
  'update:themeBase': [value: AdminThemeBase]
  'update:themeMode': [value: AdminThemeMode]
  'update:sourceColor': [value: string]
  openThemeGenerator: []
}>()

const themeBaseFamily = computed(() => props.themeBase.startsWith('md3') ? 'md3Light' : 'md2Light')
const bodyRef = ref<HTMLElement | null>(null)
const sidebarWidthValue = ref(props.sidebarWidth)
let sliderReflowTimer: ReturnType<typeof window.setTimeout> | undefined
const themeColorOptions = computed(() => {
  const colors = new Map<string, ThemeColorOption>()

  for (const item of presetThemeColors) {
    colors.set(item.color, { ...item, custom: false })
  }

  for (const item of props.customColors) {
    colors.set(item.color, { ...item, custom: true })
  }

  return Array.from(colors.values())
})

function resolveThemeMode(mode: AdminThemeMode) {
  return mode === 'system'
    ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode
}

function updateThemeBase(base: AdminThemeBase) {
  const isMd2 = base.startsWith('md2')
  const nextBase = resolveThemeMode(props.themeMode) === 'dark'
    ? base.replace('Light', 'Dark') as AdminThemeBase
    : base.replace('Dark', 'Light') as AdminThemeBase

  emit('update:themeBase', nextBase)

  // 仅在默认紫/蓝之间切换，避免覆盖用户已经选择的自定义主题色。
  if (props.sourceColor === '#6750A4' || props.sourceColor === '#2563EB') {
    emit('update:sourceColor', isMd2 ? '#2563EB' : '#6750A4')
  }
}

function updateThemeMode(mode: AdminThemeMode) {
  const nextBase = resolveThemeMode(mode) === 'dark'
    ? props.themeBase.replace('Light', 'Dark') as AdminThemeBase
    : props.themeBase.replace('Dark', 'Light') as AdminThemeBase

  emit('update:themeMode', mode)
  emit('update:themeBase', nextBase)
}

const updateThemeModeWithTransition = createAdminThemeModeTransition<AdminThemeMode>({
  getMode: () => props.themeMode,
  setMode: updateThemeMode,
  modes: ['light', 'dark'],
})

function updateSidebarWidth(value: number | string) {
  const nextValue = Number(value)

  if (!Number.isFinite(nextValue)) {
    return
  }

  sidebarWidthValue.value = nextValue
  emit('update:sidebarWidth', nextValue)
}

function syncControlLabels() {
  nextTick(() => {
    const body = bodyRef.value
    if (!body) {
      return
    }

    // Varlet 部分控件不透传 aria-label 到真实 role 节点，这里同步到实际可访问节点。
    const segmentedLabels = [
      ['admin-layout-mode-segments', '布局模式'],
      ['admin-scrollbar-segments', '滚动条模式'],
      ['admin-theme-base-segments', '主题风格'],
      ['admin-theme-mode-segments', '主题模式'],
    ] as const
    const sliderLabels = ['展开宽度']
    const switchLabels = ['标签栏']

    for (const [testId, label] of segmentedLabels) {
      body.querySelector(`[data-testid="${testId}"] [role="radiogroup"]`)?.setAttribute('aria-label', label)
    }

    body.querySelectorAll('[role="slider"]').forEach((item, index) => {
      item.setAttribute('aria-label', sliderLabels[index] ?? '')
    })

    body.querySelectorAll('[role="switch"]').forEach((item, index) => {
      item.setAttribute('aria-label', switchLabels[index] ?? '')
    })
  })
}

function scheduleSliderReflow() {
  if (sliderReflowTimer) {
    window.clearTimeout(sliderReflowTimer)
  }

  sliderReflowTimer = window.setTimeout(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.dispatchEvent(new Event('resize'))
    sliderReflowTimer = undefined
  }, 250)
}

onMounted(() => {
  syncControlLabels()
  if (props.open) {
    scheduleSliderReflow()
  }
})
onUpdated(syncControlLabels)

watch(() => props.open, (open) => {
  if (!open) {
    return
  }

  scheduleSliderReflow()
})

watch(() => props.sidebarWidth, (width) => {
  sidebarWidthValue.value = width
})

onBeforeUnmount(() => {
  if (sliderReflowTimer) {
    window.clearTimeout(sliderReflowTimer)
    sliderReflowTimer = undefined
  }
})
</script>

<template>
  <div ref="bodyRef" class="va-admin-settings-drawer__body">
    <section class="va-admin-settings-drawer__section">
      <h3>布局模式</h3>
      <var-segmented-buttons
        data-testid="admin-layout-mode-segments"
        aria-label="布局模式"
        :checkmark="false"
        :model-value="mode"
        :options="layoutModes"
        @update:model-value="emit('update:mode', $event as AdminLayoutMode)"
      />
    </section>

    <section class="va-admin-settings-drawer__section">
      <h3>显示</h3>
      <div class="va-admin-settings-drawer__field" data-testid="admin-sidebar-width-field">
        <span>展开宽度</span>
        <var-slider
          class="va-admin-settings-drawer__slider"
          :model-value="sidebarWidthValue"
          :min="220"
          :max="320"
          :step="5"
          aria-label="展开宽度"
          label-visible="never"
          @update:model-value="updateSidebarWidth($event as number)"
        >
          <template #button="{ currentValue }">
            <span class="va-admin-settings-drawer__slider-thumb">{{ currentValue }}</span>
          </template>
        </var-slider>
      </div>
      <span class="va-admin-settings-drawer__label">滚动条显示</span>
      <var-segmented-buttons
        data-testid="admin-scrollbar-segments"
        aria-label="滚动条模式"
        :checkmark="false"
        :model-value="scrollbar"
        :options="scrollbarModes"
        @update:model-value="emit('update:scrollbar', $event as AdminScrollbarMode)"
      />
      <div class="va-admin-settings-drawer__switch">
        <span>标签栏</span>
        <var-switch
          :model-value="tagsView"
          aria-label="标签栏"
          @update:model-value="emit('update:tagsView', $event as boolean)"
        />
      </div>
    </section>

    <section class="va-admin-settings-drawer__section va-admin-settings-drawer__section--theme">
      <h3>主题</h3>
      <div class="va-admin-settings-drawer__theme-group">
        <span class="va-admin-settings-drawer__label">风格</span>
        <var-segmented-buttons
          data-testid="admin-theme-base-segments"
          aria-label="主题风格"
          :checkmark="false"
          :model-value="themeBaseFamily"
          :options="themeBases"
          @update:model-value="updateThemeBase($event as AdminThemeBase)"
        />
      </div>
      <div class="va-admin-settings-drawer__theme-group">
        <span class="va-admin-settings-drawer__label">模式</span>
        <var-segmented-buttons
          data-testid="admin-theme-mode-segments"
          aria-label="主题模式"
          :checkmark="false"
          :model-value="themeMode"
          :options="themeModes"
          @update:model-value="updateThemeModeWithTransition.to($event as AdminThemeMode)"
        />
      </div>
      <div class="va-admin-settings-drawer__theme-group">
        <span class="va-admin-settings-drawer__label">主题色</span>
        <div class="va-admin-settings-drawer__theme-colors" data-testid="admin-settings-theme-colors">
          <button
            v-for="color in themeColorOptions"
            :key="color.color"
            class="va-admin-settings-drawer__theme-color"
            :class="{ 'va-admin-settings-drawer__theme-color--active': sourceColor === color.color }"
            type="button"
            :aria-label="`选择${color.label}`"
            :title="color.label"
            @click="emit('update:sourceColor', color.color)"
          >
            <span class="va-admin-settings-drawer__theme-color-swatch" :style="{ background: color.color }" />
            <small
              class="va-admin-settings-drawer__theme-color-label"
              :class="{ 'va-admin-settings-drawer__theme-color-label--custom': color.custom }"
            >
              <template v-if="color.custom">{{ color.color }}</template>
              <template v-else>{{ color.label }}</template>
            </small>
          </button>
        </div>
      </div>
      <var-button
        data-testid="admin-open-theme-generator"
        block
        text
        outline
        type="primary"
        @click="emit('openThemeGenerator')"
      >
        主题生成器
      </var-button>
    </section>
  </div>
</template>

<style scoped>
.va-admin-settings-drawer__body {
  min-height: 0;
  overflow: auto;
}

.va-admin-settings-drawer__section {
  display: grid;
  padding: 18px 16px;
  border-bottom: 1px solid var(--va-admin-sidebar-border);
  gap: 12px;
}

.va-admin-settings-drawer__section h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.va-admin-settings-drawer__section.va-admin-settings-drawer__section--theme {
  border-bottom: 0;
}

.va-admin-settings-drawer__field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px 12px;
  font-size: 13px;
  color: var(--color-on-surface-variant);
}

.va-admin-settings-drawer__slider {
  grid-column: 1 / -1;
  width: 100%;
}

.va-admin-settings-drawer__slider-thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0 -16px;
  color: var(--color-on-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  background: var(--color-primary);
  border-radius: 999px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 16%);
}

.va-admin-settings-drawer__switch {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  font-size: 13px;
  color: var(--color-on-surface-variant);
}

.va-admin-settings-drawer__theme-group {
  display: grid;
  gap: 8px;
}

.va-admin-settings-drawer__label {
  font-size: 13px;
  color: var(--color-on-surface-variant);
}

.va-admin-settings-drawer__theme-colors {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.va-admin-settings-drawer__theme-color {
  position: relative;
  display: grid;
  grid-template-rows: 20px minmax(14px, auto);
  align-items: center;
  justify-items: center;
  min-width: 0;
  min-height: 48px;
  padding: 5px 3px 4px;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--va-admin-sidebar-border);
  border-radius: var(--card-border-radius, 4px);
  gap: 2px;
}

.va-admin-settings-drawer__theme-color-swatch {
  width: 18px;
  height: 18px;
  border-radius: var(--va-admin-menu-radius);
}

.va-admin-settings-drawer__theme-color-label {
  display: -webkit-box;
  overflow: hidden;
  max-width: 100%;
  color: var(--color-on-surface-variant);
  font-size: 11px;
  line-height: 1.12;
  text-align: center;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.va-admin-settings-drawer__theme-color-label--custom {
  display: block;
  font-size: 9px;
  letter-spacing: 0;
  white-space: nowrap;
}

.va-admin-settings-drawer__theme-color--active {
  border-color: var(--color-primary);
  background: var(--va-admin-menu-active-bg);
}
</style>
