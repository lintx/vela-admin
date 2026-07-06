<script setup lang="ts">
import VaIcon from '../../icons/VaIcon.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  show?: boolean
  title?: string
  ariaLabel?: string
  closeable?: boolean
  width?: string
  teleport?: string | boolean
  closeOnClickOverlay?: boolean
}>(), {
  show: false,
  title: '',
  ariaLabel: '',
  closeable: true,
  width: 'min(560px, calc(100vw - 32px))',
  teleport: 'body',
  closeOnClickOverlay: true,
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  close: []
}>()

function closeDialog() {
  emit('update:show', false)
  emit('close')
}

function updateDialogShow(value: boolean) {
  emit('update:show', value)

  if (!value) {
    emit('close')
  }
}
</script>

<template>
  <var-popup
    v-bind="$attrs"
    class="va-dialog"
    :show="show"
    :default-style="false"
    position="center"
    :teleport="teleport"
    :close-on-click-overlay="closeOnClickOverlay"
    @update:show="updateDialogShow"
  >
    <section
      class="va-dialog__panel"
      data-testid="va-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="ariaLabel || title"
      :style="{ width }"
    >
      <header v-if="title || $slots.title || closeable" class="va-dialog__header">
        <slot name="title">
          <h2 v-if="title" class="va-dialog__title">{{ title }}</h2>
        </slot>
        <var-button
          v-if="closeable"
          class="va-dialog__close"
          text
          round
          :aria-label="`关闭${title || ariaLabel || '弹窗'}`"
          @click="closeDialog"
        >
          <VaIcon name="close" :size="22" />
        </var-button>
      </header>

      <div class="va-dialog__body">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="va-dialog__footer">
        <slot name="footer" />
      </footer>
    </section>
  </var-popup>
</template>

<style scoped>
.va-dialog__panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  max-height: calc(100dvh - 48px);
  color: var(--color-text);
  background: var(--color-body, var(--card-background));
  border: 1px solid var(--va-admin-sidebar-border);
  border-radius: var(--card-border-radius);
  overflow: hidden;
  box-shadow: 0 16px 36px color-mix(in srgb, #000 18%, transparent);
}

.va-dialog__header,
.va-dialog__footer {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 0 16px;
}

.va-dialog__header {
  justify-content: space-between;
  border-bottom: 1px solid var(--va-admin-sidebar-border);
}

.va-dialog__footer {
  justify-content: flex-end;
  border-top: 1px solid var(--va-admin-sidebar-border);
  gap: 8px;
}

.va-dialog__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.va-dialog__body {
  min-height: 0;
  overflow: auto;
}

@media (max-width: 768px) {
  .va-dialog__panel {
    width: 100vw !important;
    max-height: 100dvh;
    border-radius: 0;
  }
}
</style>
