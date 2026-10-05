<script setup>
import { computed } from 'vue'

import ExceptionArtwork from './ExceptionArtwork.vue'

const props = defineProps({
  code: {
    type: String,
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
  type: {
    type: String,
    default: 'error',
  },
})

const tone = computed(() => {
  if (props.code === '403') {
    return 'warning'
  }

  if (props.code === '500') {
    return 'danger'
  }

  return 'primary'
})

const statusLabel = computed(() => {
  const labels = {
    '403': '访问受限',
    '404': '路径未找到',
    '500': '服务异常',
  }

  return labels[props.code] || '请求异常'
})
</script>

<template>
  <section class="admin-exception" :data-tone="tone" aria-live="polite">
    <div class="admin-exception__ambient admin-exception__ambient--top" aria-hidden="true" />
    <div class="admin-exception__surface">
      <div class="admin-exception__content">
        <div class="admin-exception__visual">
          <div class="admin-exception__visual-frame">
            <ExceptionArtwork :code="code" />
          </div>
        </div>

        <var-result
          class="admin-exception__result"
          :type="type"
          :title="title"
          :description="description"
          :animation="false"
        >
          <template #image>
            <div class="admin-exception__code-mark">
              <span class="admin-exception__code">{{ code }}</span>
              <span class="admin-exception__code-label">{{ statusLabel }}</span>
            </div>
          </template>

          <template #footer>
            <var-space class="admin-exception__actions" :size="[10, 10]" justify="start">
              <var-button type="primary" @click="$router.push('/')">
                返回控制台
              </var-button>
              <var-button @click="$router.back()">
                返回上一页
              </var-button>
              <slot name="actions" />
            </var-space>
          </template>
        </var-result>
      </div>
    </div>
  </section>
</template>

<style scoped src="./ExceptionPage.css"></style>
