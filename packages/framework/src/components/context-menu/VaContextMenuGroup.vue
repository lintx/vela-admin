<script setup lang="ts">
import { inject, onBeforeUnmount, provide } from 'vue'

import {
  vaContextMenuGroupInjectionKey,
  vaContextMenuInjectionKey,
} from './context-menu-context'

const menu = inject(vaContextMenuInjectionKey, null)
const groupId = Symbol('va-context-menu-group')

menu?.registerGroup({ id: groupId })
provide(vaContextMenuGroupInjectionKey, { groupId })

onBeforeUnmount(() => {
  menu?.unregisterGroup(groupId)
})
</script>

<template>
  <slot />
</template>
