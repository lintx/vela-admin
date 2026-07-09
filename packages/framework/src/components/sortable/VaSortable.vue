<script lang="ts">
import type { CSSProperties, Ref as VueRef } from 'vue'

import type {
  VaSortableDropContext as SortableDropContext,
  VaSortableKey as SortableKey,
  VaSortablePayload as SortablePayload,
  VaSortableStrategy as SortableStrategy,
} from './sortable-types'

type SortableItem = Record<string, unknown>
type SortableRect = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>
type SortableSwapAxis = 'x' | 'y'
type AnimatedSortableElement = HTMLElement & { __vaSortableAnimationCleanup?: () => void }

interface SortableContext {
  listId: string
  group: () => string
  root: VueRef<HTMLElement | null>
  previewKeys: VueRef<SortableKey[]>
  tick: VueRef<number>
  itemMap: () => Map<SortableKey, SortableItem>
  itemKeys: () => SortableKey[]
  strategy: () => SortableStrategy
  allowTransfer: () => boolean
  canDrop: () => ((context: SortableDropContext<SortableItem>) => boolean) | undefined
  emitReorder: (payload: SortablePayload<SortableItem>) => void
  emitTransfer: (payload: SortablePayload<SortableItem>) => void
  emitReceive: (payload: SortablePayload<SortableItem>) => void
}

interface ActiveDrag {
  pointerId: number
  sourceListId: string
  currentListId: string
  keys: SortableKey[]
  items: SortableItem[]
  fromIndex: number
  startX: number
  startY: number
  x: number
  y: number
  started: boolean
  cancelled: boolean
  itemRects: Map<SortableKey, SortableRect>
  itemOffsets: Map<SortableKey, { x: number, y: number }>
  itemPlaceholderStyles: Map<SortableKey, CSSProperties>
  lastPreviewListId?: string
  lastInsertIndex?: number
}

interface SortableItemEntry {
  type: 'item'
  key: SortableKey
  item: SortableItem
}

interface SortablePlaceholderEntry {
  type: 'placeholder'
  key: string
  item: SortableItem
  rect: SortableRect
}

type SortableEntry = SortableItemEntry | SortablePlaceholderEntry
interface SortableHitTarget {
  element: HTMLElement
  index: number
  rect: SortableRect
}

interface SortableGridBand {
  start: number
  end: number
  items: SortableHitTarget[]
}

const sortableContexts = new Map<string, SortableContext>()
let activeDrag: ActiveDrag | null = null
</script>

<script setup lang="ts">
import {
  cloneVNode,
  Comment,
  computed,
  defineComponent,
  Fragment,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useSlots,
  watch,
} from 'vue'
import type { PropType, Slot, VNode } from 'vue'

import type { VaSortableItemLock, VaSortableItemState, VaSortableKey, VaSortablePayload, VaSortableStrategy } from './sortable-types'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  items: SortableItem[]
  itemKey?: string
  listId?: string
  group?: string
  strategy?: VaSortableStrategy
  disabled?: boolean
  disabledKeys?: VaSortableKey[]
  selectedKeys?: VaSortableKey[]
  lockedKeys?: VaSortableKey[]
  getItemDisabled?: (item: SortableItem, index: number) => boolean
  getItemSelected?: (item: SortableItem, index: number) => boolean
  getItemLock?: (item: SortableItem, index: number) => VaSortableItemLock
  allowTransfer?: boolean
  canDrop?: (context: SortableDropContext<SortableItem>) => boolean
  threshold?: number
}>(), {
  itemKey: 'id',
  listId: 'default',
  group: 'default',
  strategy: 'vertical-list',
  disabled: false,
  disabledKeys: () => [],
  selectedKeys: () => [],
  lockedKeys: () => [],
  allowTransfer: false,
  threshold: 6,
})

const emit = defineEmits<{
  reorder: [payload: VaSortablePayload<SortableItem>]
  transfer: [payload: VaSortablePayload<SortableItem>]
  receive: [payload: VaSortablePayload<SortableItem>]
  dragStart: [payload: VaSortablePayload<SortableItem>]
  dragEnd: [payload: VaSortablePayload<SortableItem>]
  dragCancel: []
}>()

const attrs = useAttrs()
const slots = useSlots()
const rootRef = ref<HTMLElement | null>(null)
const previewKeys = ref<VaSortableKey[]>([])
const tick = ref(0)

const disabledKeySet = computed(() => new Set(props.disabledKeys))
const selectedKeySet = computed(() => new Set(props.selectedKeys))
const lockedKeySet = computed(() => new Set(props.lockedKeys))
const draggingKeySet = computed(() => {
  tick.value
  if (activeDrag?.currentListId !== props.listId) {
    return new Set<SortableKey>()
  }

  return new Set(activeDrag?.keys ?? [])
})
const isDragging = computed(() => {
  tick.value
  return Boolean(activeDrag?.started)
})
const dragging = computed(() => {
  tick.value
  return activeDrag
})
const orderedEntries = computed<SortableEntry[]>(() => {
  tick.value
  const map = itemMap()
  const activeMap = new Map((activeDrag?.items ?? []).map(item => [getKey(item), item]))
  const entries: SortableEntry[] = []

  for (const key of previewKeys.value) {
    const item = map.get(key) ?? activeMap.get(key)
    if (!item) {
      continue
    }

    if (activeDrag?.started && activeDrag.currentListId === props.listId && activeDrag.keys.includes(key)) {
      entries.push({
        type: 'placeholder',
        key: `placeholder-${String(key)}`,
        item,
        rect: getDragRect(key),
      })
    }

    entries.push({ type: 'item', key, item })
  }

  return entries
})

const SortableEntryRenderer = defineComponent({
  name: 'VaSortableEntryRenderer',
  props: {
    entry: { type: Object as PropType<SortableEntry>, required: true },
    itemSlot: { type: Function as PropType<Slot | undefined>, default: undefined },
    placeholderSlot: { type: Function as PropType<Slot | undefined>, default: undefined },
    getItemRenderProps: { type: Function as PropType<(item: SortableItem) => Record<string, unknown>>, required: true },
    getPlaceholderRenderProps: { type: Function as PropType<(entry: SortablePlaceholderEntry) => Record<string, unknown>>, required: true },
    getHandleProps: { type: Function as PropType<(item: SortableItem) => Record<string, unknown>>, required: true },
    getItemState: { type: Function as PropType<(item: SortableItem) => VaSortableItemState>, required: true },
  },
  setup(rendererProps) {
    return () => rendererProps.entry.type === 'placeholder'
      ? renderPlaceholderEntry(rendererProps)
      : renderItemEntry(rendererProps)
  },
})

const context: SortableContext = {
  listId: props.listId,
  group: () => props.group,
  root: rootRef,
  previewKeys,
  tick,
  itemMap,
  itemKeys,
  strategy: () => props.strategy,
  allowTransfer: () => props.allowTransfer,
  canDrop: () => props.canDrop,
  emitReorder: payload => emit('reorder', payload),
  emitTransfer: payload => emit('transfer', payload),
  emitReceive: payload => emit('receive', payload),
}

watch(() => props.items, () => {
  if (!activeDrag) {
    resetPreview()
  }
}, { immediate: true, deep: true })

onMounted(() => {
  sortableContexts.set(props.listId, context)
})

onBeforeUnmount(() => {
  sortableContexts.delete(props.listId)
  if (activeDrag?.sourceListId === props.listId || activeDrag?.currentListId === props.listId) {
    cancelDrag()
  }
})

function renderItemEntry(rendererProps: {
  entry: SortableEntry
  itemSlot?: Slot
  getItemRenderProps: (item: SortableItem) => Record<string, unknown>
  getHandleProps: (item: SortableItem) => Record<string, unknown>
  getItemState: (item: SortableItem) => VaSortableItemState
}) {
  if (rendererProps.entry.type !== 'item') {
    return null
  }

  const item = rendererProps.entry.item
  const root = findSingleRootVNode(rendererProps.itemSlot?.({
    item,
    state: rendererProps.getItemState(item),
    handleProps: rendererProps.getHandleProps(item),
  }))

  return root
    ? cloneVNode(root, rendererProps.getItemRenderProps(item), true)
    : h('div', rendererProps.getItemRenderProps(item), String(item[props.itemKey] ?? ''))
}

function renderPlaceholderEntry(rendererProps: {
  entry: SortableEntry
  itemSlot?: Slot
  getHandleProps: (item: SortableItem) => Record<string, unknown>
  getItemState: (item: SortableItem) => VaSortableItemState
  placeholderSlot?: Slot
  getPlaceholderRenderProps: (entry: SortablePlaceholderEntry) => Record<string, unknown>
}) {
  if (rendererProps.entry.type !== 'placeholder') {
    return null
  }

  const renderProps = rendererProps.getPlaceholderRenderProps(rendererProps.entry)
  const itemRoot = findSingleRootVNode(rendererProps.itemSlot?.({
    item: rendererProps.entry.item,
    state: rendererProps.getItemState(rendererProps.entry.item),
    handleProps: rendererProps.getHandleProps(rendererProps.entry.item),
  }))
  const root = findSingleRootVNode(rendererProps.placeholderSlot?.({
    item: rendererProps.entry.item,
    rect: rendererProps.entry.rect,
  }))

  return root
    ? cloneVNode(root, renderProps, true)
    : h('div', mergeProps(
        {
          class: itemRoot?.props?.class,
          style: getPlaceholderRootStyle(itemRoot?.props?.style),
        },
        renderProps,
      ))
}

function findSingleRootVNode(nodes: VNode[] | undefined): VNode | undefined {
  const normalized = (nodes ?? []).flatMap(node => node.type === Fragment && Array.isArray(node.children)
    ? node.children as VNode[]
    : [node])

  return normalized.find(node => node.type !== Comment)
}

function getPlaceholderRootStyle(style: unknown) {
  if (!style || typeof style !== 'object' || Array.isArray(style)) {
    return undefined
  }

  const nextStyle = { ...style as Record<string, unknown> }
  for (const property of ['background', 'backgroundColor', 'background-color', 'backgroundImage', 'background-image']) {
    delete nextStyle[property]
  }

  return nextStyle
}

function getItemRenderProps(item: SortableItem) {
  sortableContexts.set(props.listId, context)
  const key = getKey(item)
  const state = getItemState(item)

  return {
    'data-sortable-item': '',
    'data-va-sortable-key': String(key),
    'data-va-sortable-list-id': props.listId,
    class: {
      'va-sortable__item--dragging': state.dragging,
      'va-sortable__item--selected': state.selected,
      'va-sortable__item--disabled': state.disabled,
      'va-sortable__item--locked': state.locked,
    },
    style: getDraggingStyle(key),
  }
}

function getPlaceholderRenderProps(entry: SortablePlaceholderEntry) {
  const key = getKey(entry.item)
  const visualStyle = activeDrag?.itemPlaceholderStyles.get(key)

  return {
    class: 'va-sortable__placeholder',
    'data-va-sortable-placeholder': '',
    'aria-hidden': 'true',
    style: {
      ...visualStyle,
      boxSizing: 'border-box',
      flexShrink: '0',
      width: `${entry.rect.width}px`,
      height: `${entry.rect.height}px`,
    },
  }
}

function getHandleProps(item: SortableItem) {
  const key = getKey(item)

  return {
    'data-va-sortable-handle': '',
    tabindex: isItemDisabled(key) ? -1 : 0,
    role: 'button',
    'aria-label': '拖动排序',
    'aria-disabled': isItemDisabled(key) ? 'true' : undefined,
    onPointerdown: (event: PointerEvent) => startPointerDrag(event, item),
    onKeydown: (event: KeyboardEvent) => handleKeyboardReorder(event, item),
  }
}

function getItemState(item: SortableItem): VaSortableItemState {
  const key = getKey(item)
  const active = draggingKeySet.value.has(key)
  const locked = isItemPositionLocked(key)

  return {
    dragging: Boolean(activeDrag?.started && active),
    placeholder: false,
    selected: isItemSelected(key),
    disabled: isItemDisabled(key),
    locked,
  }
}

function getDraggingStyle(key: SortableKey): CSSProperties | undefined {
  tick.value
  if (!activeDrag?.started || activeDrag.currentListId !== props.listId || !activeDrag.keys.includes(key)) {
    return undefined
  }

  const rect = getDragRect(key)
  const offset = activeDrag.itemOffsets.get(key) ?? { x: 0, y: 0 }

  return {
    position: 'fixed',
    left: `${activeDrag.x - offset.x}px`,
    top: `${activeDrag.y - offset.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    boxSizing: 'border-box',
    zIndex: 2000,
    pointerEvents: 'none',
  }
}

function getDragRect(key: SortableKey): SortableRect {
  return activeDrag?.itemRects.get(key) ?? {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0,
  }
}

function startPointerDrag(event: PointerEvent, item: SortableItem) {
  const key = getKey(item)
  if (props.disabled || isItemDisabled(key) || event.button !== 0) {
    return
  }

  const dragKeys = getDragKeys(key)
  if (hasBlockedDragKey(dragKeys)) {
    return
  }

  const dragItems = dragKeys.map(itemKey => itemMap().get(itemKey)).filter((value): value is SortableItem => Boolean(value))
  const sourceElement = event.currentTarget instanceof HTMLElement
    ? event.currentTarget.closest<HTMLElement>('[data-sortable-item]')
    : undefined
  const itemRects = collectDragItemRects(dragKeys)
  const sourceRect = sourceElement?.getBoundingClientRect() ?? itemRects.get(key)
  const itemOffsets = new Map<SortableKey, { x: number, y: number }>()
  const itemPlaceholderStyles = collectDragPlaceholderStyles(dragKeys)

  for (const itemKey of dragKeys) {
    const rect = itemRects.get(itemKey) ?? sourceRect
    if (rect) {
      itemOffsets.set(itemKey, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    }
  }

  activeDrag = {
    pointerId: event.pointerId,
    sourceListId: props.listId,
    currentListId: props.listId,
    keys: dragKeys,
    items: dragItems,
    fromIndex: itemKeys().findIndex(itemKey => itemKey === dragKeys[0]),
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY,
    started: false,
    cancelled: false,
    itemRects,
    itemOffsets,
    itemPlaceholderStyles,
  }

  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
  window.addEventListener('pointercancel', handlePointerCancel)
  window.addEventListener('keydown', handleGlobalKeydown)
  bumpContexts()
}

function handlePointerMove(event: PointerEvent) {
  if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
    return
  }

  activeDrag.x = event.clientX
  activeDrag.y = event.clientY

  const deltaX = Math.abs(event.clientX - activeDrag.startX)
  const deltaY = Math.abs(event.clientY - activeDrag.startY)
  if (!activeDrag.started && Math.max(deltaX, deltaY) < props.threshold) {
    return
  }

  event.preventDefault()
  if (!activeDrag.started) {
    activeDrag.started = true
    emit('dragStart', createPayload(activeDrag.sourceListId, activeDrag.sourceListId, activeDrag.fromIndex))
  }

  const targetContext = resolveDropContext(findContextAtPoint(event.clientX, event.clientY))
  if (!targetContext) {
    restoreSourcePreview()
    bumpContexts()
    return
  }

  applyDragPreview(targetContext, event.clientX, event.clientY)
  autoScroll(event.clientX, event.clientY)
  bumpContexts()
}

function handlePointerUp(event: PointerEvent) {
  if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
    return
  }

  const drag = activeDrag
  if (!drag.started || drag.cancelled) {
    cleanupDrag()
    return
  }

  const releaseContext = resolveDropContext(findContextAtPoint(event.clientX, event.clientY))
  if (releaseContext && getPreviewIndex(releaseContext.listId, drag.keys[0]) >= 0) {
    drag.currentListId = releaseContext.listId
  }

  const toIndex = getPreviewIndex(drag.currentListId, drag.keys[0])
  const payload = createPayload(drag.sourceListId, drag.currentListId, toIndex)

  if (drag.currentListId === drag.sourceListId) {
    if (toIndex !== drag.fromIndex) {
      sortableContexts.get(drag.sourceListId)?.emitReorder(payload)
    }
  } else {
    sortableContexts.get(drag.sourceListId)?.emitTransfer(payload)
    sortableContexts.get(drag.currentListId)?.emitReceive(payload)
  }

  emit('dragEnd', payload)
  cleanupDrag()
}

function handlePointerCancel() {
  cancelDrag()
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    cancelDrag()
  }
}

function handleKeyboardReorder(event: KeyboardEvent, item: SortableItem) {
  const key = getKey(item)
  if (props.disabled || isItemDisabled(key)) {
    return
  }

  const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    ? 1
    : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
      ? -1
      : 0

  if (!direction) {
    return
  }

  event.preventDefault()
  const keys = getDragKeys(key)
  const baseKeys = itemKeys()
  const fromIndex = baseKeys.findIndex(itemKey => itemKey === keys[0])
  const toIndex = clamp(fromIndex + direction, 0, baseKeys.length - keys.length)
  const movingItems = keys.map(itemKey => itemMap().get(itemKey)).filter((value): value is SortableItem => Boolean(value))
  if (hasBlockedDragKey(keys)) {
    return
  }

  const previewKeys = createPreviewKeysAtIndex(context, toIndex, keys)
  if (!canDropKeyboardTarget(keys, movingItems, fromIndex, toIndex, previewKeys)) {
    return
  }

  const payload: VaSortablePayload<SortableItem> = {
    keys,
    items: movingItems,
    fromIndex,
    toIndex,
    fromListId: props.listId,
    toListId: props.listId,
    previewKeys,
  }

  emit('reorder', payload)
}

function canDropKeyboardTarget(keys: SortableKey[], movingItems: SortableItem[], fromIndex: number, toIndex: number, previewKeys: SortableKey[]) {
  if (!props.canDrop) {
    return true
  }

  return props.canDrop(createDropContext(context, keys, movingItems, fromIndex, toIndex, previewKeys))
}

function applyDragPreview(targetContext: SortableContext, clientX: number, clientY: number) {
  if (!activeDrag) {
    return
  }

  const sourceContext = sortableContexts.get(activeDrag.sourceListId)
  if (!sourceContext) {
    return
  }

  const insertIndex = getInsertIndex(targetContext, clientX, clientY)
  const insertTarget = getDroppableInsertTarget(targetContext, insertIndex)
  if (!insertTarget) {
    return
  }

  activeDrag.currentListId = targetContext.listId
  activeDrag.lastPreviewListId = targetContext.listId
  activeDrag.lastInsertIndex = insertTarget.index

  for (const contextItem of sortableContexts.values()) {
    if (contextItem.group() !== props.group) {
      continue
    }

    if (contextItem.listId === targetContext.listId) {
      updatePreview(contextItem, insertTarget.previewKeys)
    } else if (contextItem.listId === activeDrag.sourceListId) {
      updatePreview(contextItem, contextItem.itemKeys().filter(key => !activeDrag?.keys.includes(key)))
    } else {
      updatePreview(contextItem, contextItem.itemKeys())
    }
  }
}

function getDroppableInsertTarget(targetContext: SortableContext, insertIndex: number) {
  const previewKeys = createPreviewKeys(targetContext, insertIndex)
  if (canDropAtIndex(targetContext, insertIndex, previewKeys)) {
    return {
      index: insertIndex,
      previewKeys,
    }
  }

  return findNearestDroppableInsertTarget(targetContext, insertIndex)
}

function findNearestDroppableInsertTarget(targetContext: SortableContext, insertIndex: number) {
  if (!activeDrag) {
    return undefined
  }

  // 非法目标不直接停在旧位置，而是吸附到最近合法边界，让分区类排序的预览更符合操作意图。
  const baseKeys = targetContext.itemKeys().filter(key => !activeDrag?.keys.includes(key))
  const currentIndex = getCurrentBaseInsertIndex(targetContext)
  let fallback: { index: number, previewKeys: SortableKey[] } | undefined

  for (let index = 0; index <= baseKeys.length; index += 1) {
    const previewKeys = insertKeys(baseKeys, activeDrag.keys, index)
    if (!canDropAtIndex(targetContext, index, previewKeys)) {
      continue
    }

    if (!fallback
      || Math.abs(index - insertIndex) < Math.abs(fallback.index - insertIndex)
      || (Math.abs(index - insertIndex) === Math.abs(fallback.index - insertIndex)
        && Math.abs(index - currentIndex) < Math.abs(fallback.index - currentIndex))) {
      fallback = {
        index,
        previewKeys,
      }
    }
  }

  return fallback
}

function createPreviewKeys(targetContext: SortableContext, insertIndex: number) {
  if (!activeDrag) {
    return targetContext.itemKeys()
  }

  return createPreviewKeysAtIndex(targetContext, insertIndex, activeDrag.keys)
}

function canDropAtIndex(targetContext: SortableContext, toIndex: number, previewKeys: SortableKey[]) {
  if (!activeDrag) {
    return true
  }

  const canDrop = targetContext.canDrop()
  if (!canDrop) {
    return true
  }

  return canDrop(createDropContext(targetContext, activeDrag.keys, activeDrag.items, activeDrag.fromIndex, toIndex, previewKeys))
}

function createDropContext(
  targetContext: SortableContext,
  keys: SortableKey[],
  movingItems: SortableItem[],
  fromIndex: number,
  toIndex: number,
  previewKeys: SortableKey[],
): SortableDropContext<SortableItem> {
  return {
    keys,
    movingItems,
    listItems: targetContext.itemKeys()
      .map(key => targetContext.itemMap().get(key))
      .filter((item): item is SortableItem => Boolean(item)),
    fromIndex,
    toIndex,
    fromListId: activeDrag?.sourceListId ?? targetContext.listId,
    toListId: targetContext.listId,
    previewKeys,
  }
}

function restoreSourcePreview() {
  if (!activeDrag) {
    return
  }

  activeDrag.currentListId = activeDrag.sourceListId
  for (const contextItem of sortableContexts.values()) {
    updatePreview(contextItem, contextItem.itemKeys())
  }
}

function resolveDropContext(targetContext: SortableContext | undefined) {
  if (!activeDrag || !targetContext || targetContext.group() !== props.group) {
    return undefined
  }

  if (targetContext.listId === activeDrag.sourceListId) {
    return targetContext
  }

  const sourceContext = sortableContexts.get(activeDrag.sourceListId)
  return sourceContext?.allowTransfer() && targetContext.allowTransfer()
    ? targetContext
    : undefined
}

function updatePreview(targetContext: SortableContext, keys: VaSortableKey[]) {
  const previousRects = collectItemRects(targetContext)
  targetContext.previewKeys.value = keys
  nextTick(() => animateMovedItems(targetContext, previousRects))
}

function animateMovedItems(targetContext: SortableContext, previousRects: Map<VaSortableKey, DOMRect>) {
  const root = getContextRoot(targetContext)
  if (!root) {
    return
  }

  for (const element of getItemElements(root)) {
    const key = getElementKey(element)
    if (activeDrag?.keys.includes(key)) {
      continue
    }

    const previousRect = previousRects.get(key)
    if (!previousRect) {
      continue
    }

    const nextRect = element.getBoundingClientRect()
    const deltaX = previousRect.left - nextRect.left
    const deltaY = previousRect.top - nextRect.top
    if (!deltaX && !deltaY) {
      continue
    }

    animateItemMove(element, deltaX, deltaY)
  }
}

function animateItemMove(element: HTMLElement, deltaX: number, deltaY: number) {
  const animatedElement = element as AnimatedSortableElement
  animatedElement.__vaSortableAnimationCleanup?.()

  const previousTransition = element.style.transition
  const previousTransform = element.style.transform
  let cleanupTimer = 0

  const cleanup = () => {
    window.clearTimeout(cleanupTimer)
    element.removeEventListener('transitionend', handleTransitionEnd)
    restoreInlineStyleProperty(element, 'transition', previousTransition)
    restoreInlineStyleProperty(element, 'transform', previousTransform)
    delete animatedElement.__vaSortableAnimationCleanup
  }
  const handleTransitionEnd = (event: TransitionEvent) => {
    if (event.target === element && event.propertyName === 'transform') {
      cleanup()
    }
  }

  animatedElement.__vaSortableAnimationCleanup = cleanup
  element.style.transition = 'none'
  element.style.transform = `translate(${deltaX}px, ${deltaY}px)`
  window.requestAnimationFrame(() => {
    element.addEventListener('transitionend', handleTransitionEnd)
    element.style.transition = 'transform 160ms ease'
    restoreInlineStyleProperty(element, 'transform', previousTransform)
    cleanupTimer = window.setTimeout(cleanup, 180)
  })
}

function restoreInlineStyleProperty(element: HTMLElement, property: 'transition' | 'transform', value: string) {
  if (value) {
    element.style[property] = value
  } else {
    element.style.removeProperty(property)
  }
}

function getInsertIndex(targetContext: SortableContext, clientX: number, clientY: number) {
  const root = getContextRoot(targetContext)
  if (!root || !activeDrag) {
    return 0
  }

  const allElements = getItemElements(root)
  const elements = allElements.filter(element => !activeDrag?.keys.includes(getElementKey(element)))
  const activeElements = allElements.filter(element => activeDrag?.keys.includes(getElementKey(element)))

  if (elements.length === 0) {
    return getCurrentInsertIndex(targetContext)
  }

  const hitTarget = findDirectHitTarget(elements, clientX, clientY)
  if (hitTarget) {
    return getTargetInsertIndex(targetContext, elements, hitTarget.index, hitTarget.rect, clientX, clientY)
  }

  const virtualHitTarget = findVirtualGridHitTarget(targetContext.strategy(), createHitTargets(elements), clientX, clientY)
  if (virtualHitTarget) {
    return getTargetInsertIndex(targetContext, elements, virtualHitTarget.index, virtualHitTarget.rect, clientX, clientY)
  }

  const activeElement = activeElements.find(element => pointInRect(clientX, clientY, getItemHitRect(element)))
  if (activeElement) {
    return targetContext.previewKeys.value.findIndex(key => key === getElementKey(activeElement))
  }

  return getCurrentInsertIndex(targetContext)
}

function createHitTargets(elements: HTMLElement[]) {
  return elements.map((element, index) => ({
    element,
    index,
    rect: getItemHitRect(element),
  }))
}

function findDirectHitTarget(elements: HTMLElement[], clientX: number, clientY: number): SortableHitTarget | undefined {
  return createHitTargets(elements).find(target => pointInRect(clientX, clientY, target.rect))
}

function findVirtualGridHitTarget(strategy: SortableStrategy, targets: SortableHitTarget[], clientX: number, clientY: number) {
  if (strategy === 'row-grid') {
    const row = findBand(groupGridBands(targets, 'y'), clientY)
    return row?.items.find((target) => pointInRect(clientX, clientY, {
      ...target.rect,
      top: row.start,
      bottom: row.end,
      height: row.end - row.start,
    }))
  }

  if (strategy === 'column-grid') {
    const column = findBand(groupGridBands(targets, 'x'), clientX)
    return column?.items.find((target) => pointInRect(clientX, clientY, {
      ...target.rect,
      left: column.start,
      right: column.end,
      width: column.end - column.start,
    }))
  }

  return undefined
}

function getTargetInsertIndex(targetContext: SortableContext, elements: HTMLElement[], targetIndex: number, targetRect: SortableRect, clientX: number, clientY: number) {
  if (!activeDrag) {
    return targetIndex
  }

  const targetElement = elements[targetIndex]
  const targetPreviewIndex = targetContext.previewKeys.value.findIndex(key => key === getElementKey(targetElement))
  const activePreviewIndex = targetContext.previewKeys.value.findIndex(key => activeDrag?.keys.includes(key))
  if (targetPreviewIndex < 0 || activePreviewIndex < 0) {
    return targetIndex
  }

  const insertAfterTarget = targetPreviewIndex > activePreviewIndex
  if (!canInsertNearTargetEdge(targetContext, targetRect, insertAfterTarget, clientX, clientY)) {
    return getCurrentInsertIndex(targetContext)
  }

  return targetIndex + (insertAfterTarget ? 1 : 0)
}

function canInsertNearTargetEdge(targetContext: SortableContext, targetRect: SortableRect, insertAfterTarget: boolean, clientX: number, clientY: number) {
  const axis = getSwapAxis(targetContext.strategy())
  if (!axis || !activeDrag) {
    return true
  }

  const activeSize = getActiveDragSpanSize(axis)
  const targetSize = axis === 'x' ? targetRect.width : targetRect.height
  if (!activeSize || activeSize >= targetSize) {
    return true
  }

  const pointer = axis === 'x' ? clientX : clientY
  const start = axis === 'x' ? targetRect.left : targetRect.top
  const end = axis === 'x' ? targetRect.right : targetRect.bottom

  return insertAfterTarget
    ? pointer >= end - activeSize
    : pointer <= start + activeSize
}

function getSwapAxis(strategy: SortableStrategy): SortableSwapAxis | undefined {
  if (strategy === 'horizontal-list' || strategy === 'row-grid') {
    return 'x'
  }

  if (strategy === 'vertical-list' || strategy === 'column-grid') {
    return 'y'
  }

  return undefined
}

function getActiveDragSpanSize(axis: SortableSwapAxis) {
  if (!activeDrag) {
    return 0
  }

  const rects = activeDrag.keys
    .map(key => activeDrag?.itemRects.get(key))
    .filter((rect): rect is SortableRect => Boolean(rect))
  if (rects.length === 0) {
    return 0
  }

  const start = Math.min(...rects.map(rect => axis === 'x' ? rect.left : rect.top))
  const end = Math.max(...rects.map(rect => axis === 'x' ? rect.right : rect.bottom))

  return end - start
}

function groupGridBands(targets: SortableHitTarget[], axis: SortableSwapAxis) {
  const sortedTargets = [...targets].sort((a, b) => getRectStart(a.rect, axis) - getRectStart(b.rect, axis))
  const bands: SortableGridBand[] = []

  for (const target of sortedTargets) {
    const start = getRectStart(target.rect, axis)
    const end = getRectEnd(target.rect, axis)
    const band = bands.find(item => rangesOverlap(start, end, item.start, item.end))

    if (band) {
      band.start = Math.min(band.start, start)
      band.end = Math.max(band.end, end)
      band.items.push(target)
    } else {
      bands.push({
        start,
        end,
        items: [target],
      })
    }
  }

  return bands.sort((a, b) => a.start - b.start)
}

function findBand(bands: SortableGridBand[], point: number) {
  return bands.find(band => point >= band.start && point <= band.end)
}

function getRectStart(rect: SortableRect, axis: SortableSwapAxis) {
  return axis === 'x' ? rect.left : rect.top
}

function getRectEnd(rect: SortableRect, axis: SortableSwapAxis) {
  return axis === 'x' ? rect.right : rect.bottom
}

function rangesOverlap(start: number, end: number, targetStart: number, targetEnd: number) {
  return start < targetEnd && end > targetStart
}

function getCurrentInsertIndex(targetContext: SortableContext) {
  if (!activeDrag) {
    return 0
  }

  const activePreviewIndex = targetContext.previewKeys.value.findIndex(key => activeDrag?.keys.includes(key))
  return activePreviewIndex >= 0 ? activePreviewIndex : 0
}

function getCurrentBaseInsertIndex(targetContext: SortableContext) {
  if (!activeDrag) {
    return 0
  }

  let index = 0
  for (const key of targetContext.previewKeys.value) {
    if (activeDrag.keys.includes(key)) {
      return index
    }

    index += 1
  }

  return index
}

function findContextAtPoint(clientX: number, clientY: number) {
  const element = document.elementFromPoint(clientX, clientY)
  const listElement = element?.closest<HTMLElement>('[data-va-sortable-list-id]')
  const listId = listElement?.dataset.vaSortableListId
  if (listId && sortableContexts.has(listId)) {
    return sortableContexts.get(listId)
  }

  const ownerContext = element
    ? [...sortableContexts.values()].find(contextItem => getContextRoot(contextItem)?.contains(element))
    : undefined
  if (ownerContext) {
    return ownerContext
  }

  return [...sortableContexts.values()].find(contextItem => {
    const contextRoot = getContextRoot(contextItem)
    return contextRoot && getItemElements(contextRoot).some(item => pointInRect(clientX, clientY, getItemHitRect(item)))
  })
}

function createPayload(fromListId: string, toListId: string, toIndex: number): VaSortablePayload<SortableItem> {
  const drag = activeDrag
  if (!drag) {
    return { keys: [], items: [], fromIndex: -1, toIndex: -1, fromListId, toListId, previewKeys: [] }
  }

  return {
    keys: [...drag.keys],
    items: [...drag.items],
    fromIndex: drag.fromIndex,
    toIndex,
    fromListId,
    toListId,
    previewKeys: [...(sortableContexts.get(toListId)?.previewKeys.value ?? [])],
  }
}

function getPreviewIndex(listId: string, key: VaSortableKey) {
  return sortableContexts.get(listId)?.previewKeys.value.findIndex(itemKey => itemKey === key) ?? -1
}

function cancelDrag() {
  if (!activeDrag) {
    return
  }

  activeDrag.cancelled = true
  emit('dragCancel')
  cleanupDrag()
}

function cleanupDrag() {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  window.removeEventListener('pointercancel', handlePointerCancel)
  window.removeEventListener('keydown', handleGlobalKeydown)

  activeDrag = null
  for (const contextItem of sortableContexts.values()) {
    contextItem.previewKeys.value = contextItem.itemKeys()
  }
  bumpContexts()
}

function resetPreview() {
  previewKeys.value = itemKeys()
}

function itemKeys() {
  return props.items.map(getKey)
}

function itemMap() {
  return new Map(props.items.map(item => [getKey(item), item]))
}

function getKey(item: SortableItem) {
  return item[props.itemKey] as VaSortableKey
}

function getDragKeys(key: VaSortableKey) {
  if (!isItemSelected(key)) {
    return [key]
  }

  const orderedSelectedKeys = itemKeys().filter(itemKey => isItemSelected(itemKey))
  return orderedSelectedKeys.length > 0 ? orderedSelectedKeys : [key]
}

function isItemDisabled(key: VaSortableKey) {
  if (props.disabled || disabledKeySet.value.has(key) || isItemPositionLocked(key)) {
    return true
  }

  const item = itemMap().get(key)
  const index = itemKeys().findIndex(itemKey => itemKey === key)
  return Boolean(item && props.getItemDisabled?.(item, index))
}

function isItemSelected(key: VaSortableKey) {
  if (selectedKeySet.value.has(key)) {
    return true
  }

  const item = itemMap().get(key)
  const index = itemKeys().findIndex(itemKey => itemKey === key)
  return Boolean(item && props.getItemSelected?.(item, index))
}

function isItemPositionLocked(key: VaSortableKey, targetContext = context) {
  if (lockedKeySet.value.has(key)) {
    return true
  }

  const keys = targetContext.itemKeys()
  const index = keys.findIndex(itemKey => itemKey === key)
  const item = targetContext.itemMap().get(key)
  return item ? props.getItemLock?.(item, index) === 'position' : false
}

function hasBlockedDragKey(keys: VaSortableKey[]) {
  return keys.some(key => isItemDisabled(key) || isItemPositionLocked(key))
}

function insertKeys(keys: VaSortableKey[], insertedKeys: VaSortableKey[], index: number) {
  const nextKeys = [...keys]
  nextKeys.splice(clamp(index, 0, nextKeys.length), 0, ...insertedKeys)
  return nextKeys
}

function createPreviewKeysAtIndex(targetContext: SortableContext, insertIndex: number, insertedKeys: VaSortableKey[]) {
  const sourceKeys = targetContext.itemKeys()
  const baseKeys = sourceKeys.filter(key => !insertedKeys.includes(key))
  const lockedEntries = sourceKeys
    .map((key, index) => ({ key, index }))
    .filter(entry => !insertedKeys.includes(entry.key) && isItemPositionLockedInContext(targetContext, entry.key))
  const movableBaseKeys = baseKeys.filter(key => !isItemPositionLockedInContext(targetContext, key))
  const movableInsertIndex = baseKeys
    .slice(0, clamp(insertIndex, 0, baseKeys.length))
    .filter(key => !isItemPositionLockedInContext(targetContext, key))
    .length
  const movableKeys = insertKeys(movableBaseKeys, insertedKeys, movableInsertIndex)
  const lockedByIndex = new Map(lockedEntries.map(entry => [entry.index, entry.key]))
  const totalLength = sourceKeys.length + insertedKeys.filter(key => !sourceKeys.includes(key)).length
  const nextKeys: VaSortableKey[] = []

  for (let index = 0; index < totalLength; index += 1) {
    const lockedKey = lockedByIndex.get(index)
    nextKeys.push(lockedKey ?? movableKeys.shift() as VaSortableKey)
  }

  return nextKeys.filter(key => key !== undefined)
}

function isItemPositionLockedInContext(targetContext: SortableContext, key: VaSortableKey) {
  if (targetContext.listId !== props.listId) {
    return false
  }

  return isItemPositionLocked(key, targetContext)
}

function collectDragItemRects(keys: SortableKey[]) {
  const rects = new Map<SortableKey, SortableRect>()
  const root = rootRef.value
  if (!root) {
    return rects
  }

  for (const element of getItemElements(root)) {
    const key = getElementKey(element)
    if (keys.includes(key)) {
      rects.set(key, element.getBoundingClientRect())
    }
  }

  return rects
}

function collectDragPlaceholderStyles(keys: SortableKey[]) {
  const styles = new Map<SortableKey, CSSProperties>()
  const root = rootRef.value
  if (!root) {
    return styles
  }

  for (const element of getItemElements(root)) {
    const key = getElementKey(element)
    if (keys.includes(key)) {
      styles.set(key, getElementPlaceholderStyle(element))
    }
  }

  return styles
}

function getElementPlaceholderStyle(element: HTMLElement) {
  const computedStyle = getComputedStyle(element)
  const style: Record<string, string> = {}

  // 默认占位只复用基础外观，避免把交互、定位和布局状态复制到占位元素上。
  setIfValue(style, 'boxSizing', computedStyle.boxSizing)
  setNonZeroValue(style, 'borderRadius', computedStyle.borderRadius)
  setVisibleBorderSide(style, 'Top', computedStyle)
  setVisibleBorderSide(style, 'Right', computedStyle)
  setVisibleBorderSide(style, 'Bottom', computedStyle)
  setVisibleBorderSide(style, 'Left', computedStyle)
  setNonZeroValue(style, 'marginTop', computedStyle.marginTop)
  setNonZeroValue(style, 'marginRight', computedStyle.marginRight)
  setNonZeroValue(style, 'marginBottom', computedStyle.marginBottom)
  setNonZeroValue(style, 'marginLeft', computedStyle.marginLeft)
  // 占位元素不是用户 slot 的原始 VNode，不能依赖 scoped CSS 标记；复制公开布局计算结果保留 grid span 等语义。
  setNonDefaultValue(style, 'gridColumnStart', computedStyle.gridColumnStart, 'auto')
  setNonDefaultValue(style, 'gridColumnEnd', computedStyle.gridColumnEnd, 'auto')
  setNonDefaultValue(style, 'gridRowStart', computedStyle.gridRowStart, 'auto')
  setNonDefaultValue(style, 'gridRowEnd', computedStyle.gridRowEnd, 'auto')
  setNonDefaultValue(style, 'alignSelf', computedStyle.alignSelf, 'auto')
  setNonDefaultValue(style, 'justifySelf', computedStyle.justifySelf, 'auto')
  setNonDefaultValue(style, 'order', computedStyle.order, '0')

  return style as CSSProperties
}

function setIfValue(style: Record<string, string>, property: string, value: string) {
  if (value) {
    style[property] = value
  }
}

function setNonZeroValue(style: Record<string, string>, property: string, value: string) {
  if (value && value !== '0px' && value !== '0') {
    style[property] = value
  }
}

function setNonDefaultValue(style: Record<string, string>, property: string, value: string, defaultValue: string) {
  if (value && value !== defaultValue) {
    style[property] = value
  }
}

function setVisibleBorderSide(style: Record<string, string>, side: 'Top' | 'Right' | 'Bottom' | 'Left', computedStyle: CSSStyleDeclaration) {
  const width = computedStyle[`border${side}Width` as keyof CSSStyleDeclaration] as string
  const borderStyle = computedStyle[`border${side}Style` as keyof CSSStyleDeclaration] as string
  const color = computedStyle[`border${side}Color` as keyof CSSStyleDeclaration] as string

  if (!width || Number.parseFloat(width) <= 0 || borderStyle === 'none' || borderStyle === 'hidden') {
    return
  }

  style[`border${side}Width`] = width
  style[`border${side}Style`] = borderStyle
  style[`border${side}Color`] = color
}

function collectItemRects(targetContext: SortableContext) {
  const rects = new Map<VaSortableKey, DOMRect>()
  const root = getContextRoot(targetContext)
  if (!root) {
    return rects
  }

  for (const element of getItemElements(root)) {
    rects.set(getElementKey(element), element.getBoundingClientRect())
  }

  return rects
}

function getItemElements(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-sortable-item]'))
}

function getContextRoot(targetContext: SortableContext) {
  return targetContext.root.value
    ?? document.querySelector<HTMLElement>(`[data-va-sortable-list-id="${targetContext.listId}"]`)
}

function getElementKey(element: HTMLElement) {
  const value = element.dataset.vaSortableKey ?? ''
  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? value : numberValue
}

function getItemHitRect(element: HTMLElement): SortableRect {
  const rect = element.getBoundingClientRect()
  const translate = getElementTranslate(element)
  if (!translate.x && !translate.y) {
    return rect
  }

  // 动画期间浏览器的命中 rect 会跟随 transform 偏移；排序判定需要使用未动画的逻辑位置。
  return {
    left: rect.left - translate.x,
    right: rect.right - translate.x,
    top: rect.top - translate.y,
    bottom: rect.bottom - translate.y,
    width: rect.width,
    height: rect.height,
  }
}

function getElementTranslate(element: HTMLElement) {
  const transform = getComputedStyle(element).transform || element.style.transform
  if (!transform || transform === 'none') {
    return { x: 0, y: 0 }
  }

  try {
    if (typeof DOMMatrixReadOnly !== 'undefined') {
      const matrix = new DOMMatrixReadOnly(transform)
      return { x: matrix.m41, y: matrix.m42 }
    }
  } catch {
    // 测试环境可能无法解析浏览器矩阵字符串，下面保留轻量正则兜底。
  }

  const matrix3d = transform.match(/^matrix3d\((.+)\)$/)
  if (matrix3d) {
    const values = matrix3d[1].split(',').map(value => Number.parseFloat(value.trim()))
    return { x: values[12] || 0, y: values[13] || 0 }
  }

  const matrix2d = transform.match(/^matrix\((.+)\)$/)
  if (matrix2d) {
    const values = matrix2d[1].split(',').map(value => Number.parseFloat(value.trim()))
    return { x: values[4] || 0, y: values[5] || 0 }
  }

  const translate = transform.match(/^translate(?:3d)?\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px/)
  return translate
    ? { x: Number.parseFloat(translate[1]), y: Number.parseFloat(translate[2]) }
    : { x: 0, y: 0 }
}

function pointInRect(clientX: number, clientY: number, rect: SortableRect) {
  return clientX >= rect.left
    && clientX <= rect.right
    && clientY >= rect.top
    && clientY <= rect.bottom
}

function autoScroll(clientX: number, clientY: number) {
  if (typeof window.scrollBy !== 'function' || /jsdom/i.test(window.navigator.userAgent)) {
    return
  }

  const margin = 32
  const speed = 16
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  let deltaX = 0
  let deltaY = 0

  if (clientX < margin) {
    deltaX = -speed
  } else if (clientX > viewportWidth - margin) {
    deltaX = speed
  }

  if (clientY < margin) {
    deltaY = -speed
  } else if (clientY > viewportHeight - margin) {
    deltaY = speed
  }

  if (deltaX || deltaY) {
    try {
      window.scrollBy(deltaX, deltaY)
    } catch {
      // jsdom 等非浏览器环境可能声明了 scrollBy 但不实现，真实浏览器会正常滚动。
    }
  }
}

function bumpContexts() {
  for (const contextItem of sortableContexts.values()) {
    contextItem.tick.value += 1
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

defineExpose({ orderedEntries, getHandleProps, getItemState })
</script>

<template>
  <div
    v-bind="attrs"
    ref="rootRef"
    class="va-sortable"
    :data-va-sortable-list-id="listId"
    data-va-sortable-root
  >
    <SortableEntryRenderer
      v-for="entry in orderedEntries"
      :key="entry.key"
      :entry="entry"
      :item-slot="slots.item"
      :placeholder-slot="slots.placeholder"
      :get-item-render-props="getItemRenderProps"
      :get-placeholder-render-props="getPlaceholderRenderProps"
      :get-handle-props="getHandleProps"
      :get-item-state="getItemState"
    />
  </div>
</template>

<style scoped>
.va-sortable {
  display: block;
}

.va-sortable__placeholder {
  box-sizing: border-box;
  border: 2px dashed color-mix(in srgb, var(--color-primary, #6750a4) 42%, var(--color-outline-variant, #cac4d0)) !important;
  background-image:
    linear-gradient(90deg, color-mix(in srgb, var(--color-primary, #6750a4) 10%, transparent) 1px, transparent 1px),
    linear-gradient(color-mix(in srgb, var(--color-primary, #6750a4) 10%, transparent) 1px, transparent 1px);
  background-color: color-mix(in srgb, var(--color-primary, #6750a4) 8%, transparent);
  background-size: 14px 14px;
}
</style>
