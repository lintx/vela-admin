<script setup>
defineProps({
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
  image: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'error',
  },
})
</script>

<template>
  <section class="admin-exception admin-page-span">
    <div class="admin-exception__surface">
      <div class="admin-exception__visual">
        <img :src="image" :alt="`${code} ${title}`" />
      </div>

      <var-result
        class="admin-exception__result"
        :type="type"
        :title="title"
        :description="description"
        :animation="false"
      >
        <template #image>
          <span class="admin-exception__code">{{ code }}</span>
        </template>

        <template #footer>
          <var-space class="admin-exception__actions" :size="[8, 8]" justify="center">
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
  </section>
</template>

<style scoped>
.admin-page-span {
  grid-column: 1 / -1;
}

.admin-exception {
  min-width: 0;
}

.admin-exception__surface {
  display: grid;
  grid-template-columns: minmax(260px, 0.92fr) minmax(300px, 1fr);
  align-items: center;
  min-height: min(560px, calc(100dvh - 168px));
  padding-top: clamp(12px, 3vw, 28px);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 7%, transparent), transparent 44%);
  gap: clamp(20px, 5vw, 56px);
}

.admin-exception__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.admin-exception__visual img {
  display: block;
  width: min(100%, 460px);
  aspect-ratio: 1;
  object-fit: contain;
}

.admin-exception__result {
  min-width: 0;
}

.admin-exception__code {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 86px;
  height: 40px;
  padding: 0 18px;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 9%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-radius: var(--chip-border-radius, 4px);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0;
}

.admin-exception__actions {
  flex-wrap: wrap;
}

:deep(.var-result__description) {
  max-width: 520px;
  margin-right: auto;
  margin-left: auto;
}

@media (max-width: 820px) {
  .admin-exception__surface {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .admin-exception__visual img {
    width: min(100%, 320px);
  }
}
</style>
