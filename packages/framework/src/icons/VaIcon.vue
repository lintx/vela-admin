<script setup lang="ts">
import { computed } from 'vue'

import { defaultAdminIconConfig, resolveAdminIcon } from './icon-registry'
import type { AdminIconLibrary, AdminPhosphorWeight } from './icon-types'

const props = withDefaults(defineProps<{
  name: string
  library?: AdminIconLibrary
  size?: number | string
  weight?: AdminPhosphorWeight
  decorative?: boolean
}>(), {
  library: undefined,
  size: '1em',
  weight: undefined,
  decorative: true,
})

const iconValue = computed(() => props.library ? `${props.library}:${props.name}` : props.name)
const resolved = computed(() => resolveAdminIcon(iconValue.value, defaultAdminIconConfig))
const iconSize = computed(() => typeof props.size === 'number' ? `${props.size}px` : props.size)
const iconStyle = computed(() => ({
  '--va-icon-size': iconSize.value,
  width: iconSize.value,
  height: iconSize.value,
}))
const phosphorWeight = computed(() => props.weight ?? defaultAdminIconConfig.phosphor.weight)
</script>

<template>
  <component
    :is="resolved.component"
    class="va-icon"
    :data-admin-icon="name"
    :data-admin-icon-library="resolved.library"
    :data-admin-icon-name="resolved.name"
    :data-admin-icon-fallback="resolved.fallback ? 'true' : undefined"
    :style="iconStyle"
    :size="iconSize"
    :weight="resolved.library === 'phosphor' ? phosphorWeight : undefined"
    :stroke-width="resolved.library === 'tabler' ? 2 : undefined"
    :aria-hidden="decorative ? 'true' : undefined"
    focusable="false"
  />
</template>

<style scoped>
.va-icon {
  display: inline-block;
  flex: 0 0 auto;
  width: var(--va-icon-size, 1em);
  height: var(--va-icon-size, 1em);
  color: currentColor;
  vertical-align: -0.125em;
}
</style>
