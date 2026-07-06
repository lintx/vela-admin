<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, useSlots, watch } from 'vue'

import {
  vaContextMenuGroupInjectionKey,
  vaContextMenuInjectionKey,
} from './context-menu-context'
import type { VaContextMenuItemOption, VaContextMenuItemValue } from './context-menu-types'

const props = withDefaults(defineProps<{
  value: VaContextMenuItemValue
  text?: string
  icon?: string
  disabled?: boolean
  danger?: boolean
  shortcut?: string
}>(), {
  text: '',
  icon: '',
  disabled: false,
  danger: false,
  shortcut: '',
})

const slots = useSlots()
const menu = inject(vaContextMenuInjectionKey, null)
const group = inject(vaContextMenuGroupInjectionKey, null)
const fallbackGroupId = Symbol('va-context-menu-fallback-group')
const groupId = computed(() => group?.groupId ?? fallbackGroupId)
const item = computed<VaContextMenuItemOption>(() => ({
  value: props.value,
  text: props.text || extractSlotText(),
  icon: props.icon || undefined,
  disabled: props.disabled,
  danger: props.danger,
  shortcut: props.shortcut || undefined,
  children: extractChildren(),
}))

function extractSlotText() {
  return slots.default?.()
    .map(node => typeof node.children === 'string' ? node.children : '')
    .join('')
    .trim() ?? ''
}

function extractChildren() {
  return slots.children?.()
    .flatMap((node) => {
      const props = node.props as Record<string, unknown> | null
      const value = props?.value

      if (typeof value !== 'string' && typeof value !== 'number') {
        return []
      }

      return [{
        value,
        text: typeof props?.text === 'string' ? props.text : '',
        icon: typeof props?.icon === 'string' ? props.icon : undefined,
        disabled: props?.disabled === '' || props?.disabled === true,
        danger: props?.danger === '' || props?.danger === true,
        shortcut: typeof props?.shortcut === 'string' ? props.shortcut : undefined,
      }]
    }) ?? []
}

onMounted(() => {
  if (!group) {
    menu?.registerGroup({ id: fallbackGroupId })
  }

  menu?.registerItem({ groupId: groupId.value, item: item.value })
})

watch(item, (nextItem) => {
  menu?.registerItem({ groupId: groupId.value, item: nextItem })
})

onBeforeUnmount(() => {
  menu?.unregisterItem(groupId.value, props.value)
  if (!group) {
    menu?.unregisterGroup(fallbackGroupId)
  }
})
</script>

<template>
  <slot />
  <slot name="children" />
</template>
