<script setup lang="ts">
import { Ripple } from '@varlet/ui'
import { ref } from 'vue'

import VaIcon from '../../icons/VaIcon.vue'
import type { AdminResolvedThemeMode } from '../../app/define-admin-config'
import type { AdminThemeBase } from '../../theme/create-theme'
import type {
  ThemeColorChip,
  ThemeGeneratorFile,
  ThemeGeneratorOption,
  ThemeGeneratorSwatch,
} from './theme-generator-types'

const props = defineProps<{
  themeVersion: 'md3' | 'md2'
  themeVersions: Array<ThemeGeneratorOption<'md3' | 'md2'>>
  localThemeMode: AdminResolvedThemeMode
  themeModes: Array<ThemeGeneratorOption<AdminResolvedThemeMode>>
  recommendedColors: ThemeColorChip[]
  selectedColor: string
  localSourceColor: string
  sourceColorText: string
  allCustomColors: ThemeColorChip[]
  imageFiles: ThemeGeneratorFile[]
  imageError: string
  primarySwatches: ThemeGeneratorSwatch[]
  developerExport: boolean
  exportMode: 'css' | 'json'
  exportModes: Array<ThemeGeneratorOption<'css' | 'json'>>
  exportText: string
  updateThemeVersion: (version: 'md3' | 'md2') => void
  updateThemeMode: (mode: AdminResolvedThemeMode) => void
  updateSourceColor: (value: string) => void
  updateSourceColorText: (value: string) => void
  commitSourceColorText: () => void
  addCustomSourceColor: () => void
  selectRecommendedColor: (color: string) => void
  selectCustomColor: (color: string) => void
  removeCustomColor: (color: string) => void
  updateImageFiles: (files: ThemeGeneratorFile[]) => void
  filterImageFiles: (files: ThemeGeneratorFile[]) => ThemeGeneratorFile[]
  beforeReadImage: (file: ThemeGeneratorFile) => boolean
  afterReadImage: (file: ThemeGeneratorFile) => Promise<void> | void
  updateExportMode: (mode: 'css' | 'json') => void
}>()

const vRipple = Ripple
const nativeColorInputRef = ref<HTMLInputElement | null>(null)

function openNativeColorPicker() {
  nativeColorInputRef.value?.click()
}
</script>

<template>
  <aside class="va-admin-theme-generator__controls">
    <section class="va-admin-theme-generator__section">
      <h3>风格</h3>
      <var-segmented-buttons
        data-testid="admin-theme-version"
        :checkmark="false"
        :model-value="themeVersion"
        :options="themeVersions"
        @update:model-value="props.updateThemeVersion($event as 'md3' | 'md2')"
      />
    </section>

    <section class="va-admin-theme-generator__section">
      <h3>模式</h3>
      <var-segmented-buttons
        data-testid="admin-theme-mode"
        :checkmark="false"
        :model-value="localThemeMode"
        :options="themeModes"
        @update:model-value="props.updateThemeMode($event as AdminResolvedThemeMode)"
      />
    </section>

    <section class="va-admin-theme-generator__section">
      <h3>推荐主题色</h3>
      <div class="va-admin-theme-generator__recommended-grid">
        <button
          v-for="color in recommendedColors"
          :key="color.color"
          v-ripple
          class="va-admin-theme-generator__color-chip"
          :class="{ 'va-admin-theme-generator__color-chip--active': selectedColor === color.color }"
          type="button"
          :aria-label="`选择${color.label}`"
          :title="color.label"
          @click="props.selectRecommendedColor(color.color)"
        >
          <span class="va-admin-theme-generator__color-swatch" :style="{ background: color.color }" />
          <span>{{ color.label }}</span>
        </button>
      </div>
    </section>

    <section class="va-admin-theme-generator__section">
      <h3>色板</h3>
      <div class="va-admin-theme-generator__swatches">
        <span
          v-for="swatch in primarySwatches"
          :key="swatch.label"
          class="va-admin-theme-generator__swatch"
        >
          <span class="va-admin-theme-generator__swatch-color" :style="{ background: swatch.value }" />
          <span>{{ swatch.label }}</span>
        </span>
      </div>
    </section>

    <section class="va-admin-theme-generator__section">
      <h3>自定义颜色</h3>
      <div class="va-admin-theme-generator__source-field">
        <var-button
          class="va-admin-theme-generator__source-swatch-button"
          type="primary"
          text
          outline
          aria-label="选择自定义主题色"
          @click="openNativeColorPicker"
        >
          <span class="va-admin-theme-generator__source-swatch" :style="{ background: localSourceColor }" />
        </var-button>
        <input
          ref="nativeColorInputRef"
          class="va-admin-theme-generator__native-color"
          data-testid="admin-theme-source-color"
          type="color"
          :value="localSourceColor"
          @input="props.updateSourceColor(($event.target as HTMLInputElement).value)"
        >
        <var-input
          data-testid="admin-theme-source-color-text"
          :model-value="sourceColorText"
          aria-label="自定义主题色 HEX"
          hint
          placeholder="HEX"
          enterkeyhint="done"
          @update:model-value="props.updateSourceColorText(String($event))"
          @blur="props.commitSourceColorText"
        />
        <var-button text outline type="primary" data-testid="admin-theme-add-custom-color" @click="props.addCustomSourceColor">
          添加
        </var-button>
      </div>
      <var-uploader
        data-testid="admin-theme-image-uploader"
        accept="image/*"
        :model-value="imageFiles"
        hide-list
        @before-filter="props.filterImageFiles"
        @update:model-value="props.updateImageFiles"
        @before-read="props.beforeReadImage"
        @after-read="props.afterReadImage"
      >
        <var-button class="va-admin-theme-generator__upload-action" text outline type="primary">
          <VaIcon name="image" />
          <span>图片取色</span>
        </var-button>
      </var-uploader>
      <var-alert
        v-if="imageError"
        type="danger"
        variant="tonal"
        :message="imageError"
      />
      <div class="va-admin-theme-generator__color-grid" data-testid="admin-theme-custom-colors">
        <div
          v-for="color in allCustomColors"
          :key="color.color"
          class="va-admin-theme-generator__custom-item"
        >
          <var-button
            class="va-admin-theme-generator__color-chip va-admin-theme-generator__color-chip--custom"
            type="primary"
            text
            outline
            :class="{ 'va-admin-theme-generator__color-chip--active': selectedColor === color.color }"
            :aria-label="`选择${color.label}`"
            :title="color.label"
            @click="props.selectCustomColor(color.color)"
          >
            <span class="va-admin-theme-generator__color-swatch" :style="{ background: color.color }" />
            <span>{{ color.label }}</span>
          </var-button>
          <var-button
            v-if="color.removable"
            class="va-admin-theme-generator__remove-button"
            type="primary"
            text
            outline
            round
            :aria-label="`删除${color.label}`"
            @click="props.removeCustomColor(color.color)"
          >
            <VaIcon name="close" :size="20" />
          </var-button>
        </div>
      </div>
    </section>

    <section v-if="developerExport" class="va-admin-theme-generator__section">
      <h3>开发者导出</h3>
      <var-segmented-buttons
        data-testid="admin-theme-export-mode"
        :checkmark="false"
        :model-value="exportMode"
        :options="exportModes"
        @update:model-value="props.updateExportMode($event as 'css' | 'json')"
      />
      <var-input
        data-testid="admin-theme-export"
        :model-value="exportText"
        textarea
        readonly
        :rows="7"
      />
    </section>
  </aside>
</template>

<style scoped>
.va-admin-theme-generator__controls {
  min-height: 0;
  overflow: auto;
  border-right: 1px solid var(--va-admin-sidebar-border);
}

.va-admin-theme-generator__section {
  display: grid;
  padding: 16px;
  border-bottom: 1px solid var(--va-admin-sidebar-border);
  gap: 12px;
}

.va-admin-theme-generator__section h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.va-admin-theme-generator__color-grid {
  display: grid;
  gap: 8px;
}

.va-admin-theme-generator__recommended-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.va-admin-theme-generator__source-field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.va-admin-theme-generator__source-swatch-button {
  width: 36px;
  height: 36px;
  min-width: 36px;
  padding: 0;
}

.va-admin-theme-generator__source-swatch {
  width: 20px;
  height: 20px;
  border: 1px solid var(--va-admin-sidebar-border);
  border-radius: var(--va-admin-menu-radius);
}

.va-admin-theme-generator__native-color {
  position: absolute;
  clip: rect(0 0 0 0);
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.va-admin-theme-generator__color-chip,
.va-admin-theme-generator__remove-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  font-size: 13px;
  gap: 8px;
}

.va-admin-theme-generator__recommended-grid .va-admin-theme-generator__color-chip {
  display: grid;
  grid-template-rows: 22px minmax(14px, auto);
  justify-items: center;
  min-width: 0;
  min-height: 56px;
  padding: 7px 4px 6px;
  color: var(--color-on-surface-variant);
  background: var(--color-body, var(--card-background));
  border: 1px solid var(--color-outline-variant, var(--color-outline));
  border-radius: var(--card-border-radius, 4px);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background-color 0.2s;
  gap: 5px;
}

.va-admin-theme-generator__recommended-grid .va-admin-theme-generator__color-chip:hover {
  color: var(--color-text);
  border-color: var(--color-primary);
  background: var(--va-admin-menu-hover-bg);
}

.va-admin-theme-generator__recommended-grid .va-admin-theme-generator__color-chip span:last-child {
  overflow: hidden;
  max-width: 100%;
  font-size: 12px;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.va-admin-theme-generator__color-chip--active {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--va-admin-menu-active-bg);
}

.va-admin-theme-generator__color-chip--custom {
  width: 100%;
  justify-content: flex-start;
}

.va-admin-theme-generator__custom-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.va-admin-theme-generator__color-swatch {
  width: 20px;
  height: 20px;
  border: 1px solid var(--va-admin-sidebar-border);
  border-radius: var(--va-admin-menu-radius);
  flex: 0 0 auto;
}

.va-admin-theme-generator__remove-button {
  width: 36px;
  justify-content: center;
  padding: 0;
}

.va-admin-theme-generator__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-on-surface-variant);
}

.va-admin-theme-generator__upload-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  font-size: 13px;
  gap: 6px;
}

.va-admin-theme-generator__swatches {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.va-admin-theme-generator__swatch {
  display: grid;
  justify-items: center;
  align-items: center;
  min-width: 0;
  min-height: 62px;
  padding: 8px 4px;
  border: 1px solid var(--color-outline-variant, var(--color-outline));
  border-radius: var(--card-border-radius, 4px);
  font-size: 12px;
  color: var(--color-on-surface-variant);
  gap: 6px;
}

.va-admin-theme-generator__swatch span:last-child {
  overflow: hidden;
  max-width: 100%;
  line-height: 1.15;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.va-admin-theme-generator__swatch-color {
  width: 28px;
  height: 28px;
  border: 1px solid var(--va-admin-sidebar-border);
  border-radius: var(--va-admin-menu-radius);
}

@media (max-width: 768px) {
  .va-admin-theme-generator__controls {
    border-right: 0;
  }
}
</style>
