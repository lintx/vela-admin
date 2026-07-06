<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { AdminResolvedThemeMode } from '../../app/define-admin-config'
import VaDialog from '../../components/dialog/VaDialog.vue'
import type { AdminThemeBase } from '../../theme/create-theme'
import {
  createSourceColorAdminTheme,
  createThemeGeneratorExport,
  validateThemeImageFile,
} from '../../theme/theme-generator-service'
import AdminThemeGeneratorControls from './AdminThemeGeneratorControls.vue'
import AdminThemeGeneratorPreview from './AdminThemeGeneratorPreview.vue'
import {
  exportModes,
  recommendedColors,
  themeModes,
  themeVersions,
} from './theme-generator-options'
import type {
  AdminThemeGeneratorPayload,
  ThemeColorChip,
  ThemeGeneratorFile,
} from './theme-generator-types'
import {
  extractSourceColorFromFile,
  normalizeSourceColorInput,
  normalizeSourceColorText,
} from './theme-generator-utils'

const props = withDefaults(defineProps<{
  open?: boolean
  sourceColor?: string
  themeBase?: AdminThemeBase
  themeMode?: AdminResolvedThemeMode
  developerExport?: boolean
  customColors?: ThemeColorChip[]
}>(), {
  open: false,
  sourceColor: '#6750A4',
  themeBase: 'md3Light',
  themeMode: 'light',
  developerExport: false,
})

const emit = defineEmits<{
  close: []
  preview: [payload: AdminThemeGeneratorPayload]
  apply: [payload: AdminThemeGeneratorPayload]
  reset: []
  'update:sourceColor': [value: string]
  'update:themeBase': [value: AdminThemeBase]
  'update:themeMode': [value: AdminResolvedThemeMode]
  'update:customColors': [value: ThemeColorChip[]]
}>()

const localSourceColor = ref(props.sourceColor)
const sourceColorText = ref(normalizeSourceColorText(props.sourceColor))
const selectedColor = ref(props.sourceColor)
const localThemeBase = ref<AdminThemeBase>(props.themeBase)
const localThemeMode = ref<AdminResolvedThemeMode>(props.themeMode)
const localCustomColors = ref<ThemeColorChip[]>([])
const imageFiles = ref<ThemeGeneratorFile[]>([])
const imageError = ref('')
const exportMode = ref<'css' | 'json'>('css')

const themeVersion = computed<'md3' | 'md2'>(() => localThemeBase.value.startsWith('md2') ? 'md2' : 'md3')
const resolvedThemeBase = computed<AdminThemeBase>(() => {
  const version = themeVersion.value
  const mode = localThemeMode.value === 'dark' ? 'Dark' : 'Light'

  return `${version}${mode}` as AdminThemeBase
})

const previewTheme = computed(() => createSourceColorAdminTheme({
  sourceColor: selectedColor.value,
  themeBase: resolvedThemeBase.value,
  themeMode: localThemeMode.value,
}))

const previewStyle = computed(() => previewTheme.value.cssVariables)
const primarySwatches = computed(() => [
  { label: '主色', value: previewTheme.value.cssVariables['--color-primary'] },
  { label: '主色背景', value: previewTheme.value.cssVariables['--color-primary-container'] },
  { label: '面板底色', value: previewTheme.value.cssVariables['--color-surface-container'] },
])
const exportResult = computed(() => createThemeGeneratorExport(createPayload()))
const exportText = computed(() => exportMode.value === 'css'
  ? exportResult.value.cssText
  : exportResult.value.jsonText)

const resolvedCustomColors = computed(() => props.customColors ?? localCustomColors.value)
const allCustomColors = computed(() => {
  const colors = new Map<string, ThemeColorChip>()

  for (const item of resolvedCustomColors.value) {
    colors.set(item.color, item)
  }

  return Array.from(colors.values())
})

function createPayload(): AdminThemeGeneratorPayload {
  return {
    sourceColor: selectedColor.value,
    themeBase: resolvedThemeBase.value,
    themeMode: localThemeMode.value,
    theme: previewTheme.value,
  }
}

function updateThemeVersion(version: 'md3' | 'md2') {
  const mode = localThemeMode.value === 'dark' ? 'Dark' : 'Light'
  localThemeBase.value = `${version}${mode}` as AdminThemeBase
}

function updateThemeMode(mode: AdminResolvedThemeMode) {
  localThemeMode.value = mode
}

function updateSourceColor(value: string) {
  const normalizedColor = normalizeSourceColorText(value)

  localSourceColor.value = normalizedColor
  sourceColorText.value = normalizedColor
  selectedColor.value = normalizedColor
  emit('update:sourceColor', normalizedColor)
}

function updateSourceColorText(value: string) {
  sourceColorText.value = value
}

function commitSourceColorText() {
  const normalizedColor = normalizeSourceColorInput(sourceColorText.value)

  if (!normalizedColor) {
    sourceColorText.value = localSourceColor.value
    return
  }

  if (normalizedColor === localSourceColor.value) {
    sourceColorText.value = normalizedColor
    return
  }

  updateSourceColor(normalizedColor)
}

function addCustomSourceColor() {
  addCurrentSourceColorToCustomColors()
}

function selectRecommendedColor(color: string) {
  selectedColor.value = color
}

function selectCustomColor(color: string) {
  selectedColor.value = color
}

function addCurrentSourceColorToCustomColors() {
  const nextColor = localSourceColor.value
  if (!resolvedCustomColors.value.some((item) => item.color === nextColor)) {
    commitCustomColors([
      ...resolvedCustomColors.value,
      {
        color: nextColor,
        label: `自定义 ${nextColor}`,
        removable: true,
      },
    ])
  }
}

function removeCustomColor(color: string) {
  const nextColors = resolvedCustomColors.value.filter((item) => item.color !== color)

  commitCustomColors(nextColors)

  if (selectedColor.value === color) {
    selectedColor.value = nextColors[0]?.color ?? localSourceColor.value
  }
}

function updateImageFiles(files: ThemeGeneratorFile[]) {
  imageFiles.value = files.slice(-1)

  if (imageFiles.value.length === 0) {
    imageError.value = ''
  }
}

function filterImageFiles(files: ThemeGeneratorFile[]) {
  return files.slice(-1)
}

function beforeReadImage(varFile: ThemeGeneratorFile) {
  const message = validateThemeImageFile(varFile.file)

  imageError.value = message ?? ''

  return !message
}

async function afterReadImage(varFile: ThemeGeneratorFile) {
  const message = validateThemeImageFile(varFile.file)

  if (message) {
    imageError.value = message
    return
  }

  try {
    const color = await extractSourceColorFromFile(varFile.file!)

    updateSourceColor(color)
    imageError.value = ''
  }
  catch {
    imageError.value = '图片取色失败，请换一张图片'
  }
}

function preview() {
  emit('preview', createPayload())
}

function apply() {
  emit('apply', createPayload())
}

function resetPreviewDraft() {
  const defaultSourceColor = '#6750A4'

  localSourceColor.value = defaultSourceColor
  sourceColorText.value = defaultSourceColor
  selectedColor.value = defaultSourceColor
  localThemeBase.value = 'md3Light'
  localThemeMode.value = 'light'
  imageFiles.value = []
  imageError.value = ''
}

function updateExportMode(mode: 'css' | 'json') {
  exportMode.value = mode
}

watch(() => props.sourceColor, (value) => {
  const normalizedColor = normalizeSourceColorText(value)

  localSourceColor.value = normalizedColor
  sourceColorText.value = normalizedColor
  selectedColor.value = normalizedColor
})

watch(() => props.themeBase, (value) => {
  localThemeBase.value = value
})

watch(() => props.themeMode, (value) => {
  localThemeMode.value = value
})

function commitCustomColors(nextColors: ThemeColorChip[]) {
  if (props.customColors) {
    emit('update:customColors', nextColors)
    return
  }

  localCustomColors.value = nextColors
}

</script>

<template>
  <VaDialog
    class="va-admin-theme-generator"
    data-testid="admin-theme-generator"
    :show="open"
    title="主题生成器"
    aria-label="主题生成器"
    width="min(920px, calc(100vw - 32px))"
    @close="emit('close')"
  >
    <div class="va-admin-theme-generator__body">
      <AdminThemeGeneratorControls
        :theme-version="themeVersion"
        :theme-versions="themeVersions"
        :local-theme-mode="localThemeMode"
        :theme-modes="themeModes"
        :recommended-colors="recommendedColors"
        :selected-color="selectedColor"
        :local-source-color="localSourceColor"
        :source-color-text="sourceColorText"
        :all-custom-colors="allCustomColors"
        :image-files="imageFiles"
        :image-error="imageError"
        :primary-swatches="primarySwatches"
        :developer-export="developerExport"
        :export-mode="exportMode"
        :export-modes="exportModes"
        :export-text="exportText"
        :update-theme-version="updateThemeVersion"
        :update-theme-mode="updateThemeMode"
        :update-source-color="updateSourceColor"
        :update-source-color-text="updateSourceColorText"
        :commit-source-color-text="commitSourceColorText"
        :add-custom-source-color="addCustomSourceColor"
        :select-recommended-color="selectRecommendedColor"
        :select-custom-color="selectCustomColor"
        :remove-custom-color="removeCustomColor"
        :update-image-files="updateImageFiles"
        :filter-image-files="filterImageFiles"
        :before-read-image="beforeReadImage"
        :after-read-image="afterReadImage"
        :update-export-mode="updateExportMode"
      />

      <AdminThemeGeneratorPreview :preview-style="previewStyle" />
    </div>

    <template #footer>
      <var-button text outline type="info" data-testid="admin-theme-reset" @click="resetPreviewDraft">重置预览</var-button>
      <var-button text outline type="info" data-testid="admin-theme-preview-action" @click="preview">预览</var-button>
      <var-button text outline type="primary" data-testid="admin-theme-apply" @click="apply">应用主题</var-button>
    </template>
  </VaDialog>
</template>

<style scoped>
.va-admin-theme-generator__body {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  min-height: 0;
}

@media (max-width: 768px) {
  .va-admin-theme-generator__body {
    grid-template-columns: 1fr;
  }
}
</style>
