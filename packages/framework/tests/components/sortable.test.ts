import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { VaSortable } from '../../src/index'

interface DemoItem {
  id: string
  label: string
}

const originalPointerEvent = window.PointerEvent
const mountedWrappers: ReturnType<typeof mount>[] = []

afterEach(() => {
  mountedWrappers.splice(0).forEach(wrapper => wrapper.unmount())
  window.PointerEvent = originalPointerEvent
  document.body.innerHTML = ''
  document.head.querySelectorAll('[data-va-sortable-test-style]').forEach(element => element.remove())
  vi.restoreAllMocks()
})

describe('VaSortable', () => {
  it('moves a live placeholder in a wrapping row grid and emits reorder on release', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const wrapper = mountSortableBoard({
      strategy: 'row-grid',
      onReorder,
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(0, 60),
      d: rect(100, 60),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 170, 70))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'c', 'd', 'b'])
    expect(wrapper.find('[data-id="b"]').classes()).toContain('va-sortable__item--dragging')
    expect(wrapper.find('.va-sortable__placeholder').exists()).toBe(true)
    expect(document.body.querySelector('.va-sortable__mirror')).toBeNull()

    window.dispatchEvent(pointerEvent('pointerup', 170, 70))
    await nextTick()

    expect(onReorder).toHaveBeenCalledWith(expect.objectContaining({
      keys: ['b'],
      fromIndex: 1,
      toIndex: 3,
    }))
  })

  it('moves after a later row-grid target as soon as pointer enters it', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'row-grid' })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(0, 60),
    })

    await pointerDown(wrapper, 'a', 10, 10)
    window.dispatchEvent(pointerEvent('pointermove', 110, 35))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['b', 'a', 'c', 'd'])
  })

  it('moves before an earlier row-grid target as soon as pointer enters it', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'row-grid' })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(0, 60),
    })

    await pointerDown(wrapper, 'd', 10, 70)
    window.dispatchEvent(pointerEvent('pointermove', 170, 35))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'd', 'b', 'c'])
  })

  it('prioritizes an earlier vertical target over the current placeholder when their rects overlap', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'vertical-list' })
    const rects = {
      a: rect(0, 0),
      b: rect(0, 60),
      c: rect(0, 120),
      d: rect(0, 180),
    }

    mockItemRects(wrapper, rects)

    await pointerDown(wrapper, 'd', 10, 190)
    rects.d = rect(0, 60)
    window.dispatchEvent(pointerEvent('pointermove', 70, 95))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'd', 'b', 'c'])
  })

  it('can swap back with the last vertical target after the preview moved', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'vertical-list' })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(0, 60),
      c: rect(0, 120),
      d: rect(0, 180),
    }, rect(0, 0, 80, 260))

    await pointerDown(wrapper, 'c', 10, 130)
    window.dispatchEvent(pointerEvent('pointermove', 70, 205))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'd', 'c'])

    window.dispatchEvent(pointerEvent('pointermove', 70, 185))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('prioritizes an earlier horizontal target over the current placeholder when their rects overlap', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'horizontal-list' })
    const rects = {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    }

    mockItemRects(wrapper, rects)

    await pointerDown(wrapper, 'd', 310, 10)
    rects.d = rect(100, 0)
    window.dispatchEvent(pointerEvent('pointermove', 170, 35))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'd', 'b', 'c'])
  })

  it('can swap back with the last horizontal target after the preview moved', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'horizontal-list' })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    }, rect(0, 0, 400))

    await pointerDown(wrapper, 'c', 210, 10)
    window.dispatchEvent(pointerEvent('pointermove', 370, 35))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'd', 'c'])

    window.dispatchEvent(pointerEvent('pointermove', 310, 35))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('keeps row-grid insertion stable while pointer moves through the row gap', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'row-grid' })

    mockResponsiveGridRects(wrapper, { columns: 3, rowGap: 20 })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 270, 20))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'c', 'b', 'd'])

    window.dispatchEvent(pointerEvent('pointermove', 270, 51))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'c', 'b', 'd'])
  })

  it('keeps row-grid insertion unchanged in trailing blank space of an incomplete last row', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'row-grid' })

    mockResponsiveGridRects(wrapper, { columns: 3, rowGap: 20 })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 170, 70))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'c', 'd'])

    window.dispatchEvent(pointerEvent('pointermove', 170, 70))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('keeps a narrower horizontal item stable in the middle of a wider target', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'horizontal-list' })

    mockVariableHorizontalListRects(wrapper, { a: 120, b: 60, c: 80, d: 80 })

    await pointerDown(wrapper, 'b', 150, 20)
    window.dispatchEvent(pointerEvent('pointermove', 110, 20))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'c', 'd'])

    window.dispatchEvent(pointerEvent('pointermove', 40, 20))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['b', 'a', 'c', 'd'])

    window.dispatchEvent(pointerEvent('pointermove', 100, 20))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['b', 'a', 'c', 'd'])
  })

  it('keeps a shorter vertical item stable in the middle of a taller target', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'vertical-list' })

    mockVariableVerticalListRects(wrapper, { a: 80, b: 40, c: 40, d: 40 })

    await pointerDown(wrapper, 'b', 20, 100)
    window.dispatchEvent(pointerEvent('pointermove', 20, 70))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'c', 'd'])

    window.dispatchEvent(pointerEvent('pointermove', 20, 30))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['b', 'a', 'c', 'd'])

    window.dispatchEvent(pointerEvent('pointermove', 20, 60))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['b', 'a', 'c', 'd'])
  })

  it('keeps a narrower row-grid item stable in the middle of a wider target', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'row-grid' })

    mockVariableRowGridRects(wrapper, {
      a: { width: 120, height: 60 },
      b: { width: 60, height: 32 },
      c: { width: 80, height: 48 },
      d: { width: 80, height: 48 },
    }, { columns: 2, rowGap: 20 })

    await pointerDown(wrapper, 'b', 150, 20)
    window.dispatchEvent(pointerEvent('pointermove', 110, 20))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'c', 'd'])

    window.dispatchEvent(pointerEvent('pointermove', 40, 20))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['b', 'a', 'c', 'd'])

    window.dispatchEvent(pointerEvent('pointermove', 100, 20))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['b', 'a', 'c', 'd'])
  })

  it('uses row-grid row height blank space as a virtual item hit area', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'row-grid' })

    mockVariableRowGridRects(wrapper, {
      a: { width: 120, height: 60 },
      b: { width: 60, height: 32 },
      c: { width: 80, height: 48 },
      d: { width: 80, height: 48 },
    }, { columns: 2, rowGap: 20 })

    await pointerDown(wrapper, 'c', 40, 100)
    window.dispatchEvent(pointerEvent('pointermove', 150, 50))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'c', 'b', 'd'])
  })

  it('animates sortable items while pointer dragging updates the preview', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'row-grid' })

    mockResponsiveGridRects(wrapper, { columns: 3, rowGap: 20 })

    await pointerDown(wrapper, 'a', 10, 10)
    window.dispatchEvent(pointerEvent('pointermove', 270, 20))
    await nextTick()
    await nextTick()

    expect(wrapper.findAll('[data-list="primary"] [data-sortable-item]').some(item => item.element.style.transform)).toBe(true)
  })

  it('renders one independent bordered placeholder for a single dragged item', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({ strategy: 'row-grid' })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(0, 60),
      d: rect(100, 60),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 170, 70))
    await nextTick()

    const placeholders = wrapper.findAll('.va-sortable__placeholder')
    expect(placeholders).toHaveLength(1)
    expect(placeholders[0].classes()).toContain('card')
    expect(placeholders[0].attributes('style')).toContain('width: 80px')
    expect(placeholders[0].attributes('style')).toContain('height: 40px')
    expect(placeholders[0].attributes('style')).not.toContain('border:')
    expect(placeholders[0].attributes('style')).not.toContain('border-color')
    expect(placeholders[0].attributes('style')).not.toContain('border-style')
    expect(placeholders[0].attributes('style')).not.toContain('outline')
    expect(placeholders[0].attributes('style')).not.toContain('background')
    expect(placeholders[0].attributes('style')).not.toContain('opacity')
  })

  it('keeps basic scoped item appearance on the default placeholder', async () => {
    installPointerEvent()
    installScopedCardStyle()
    const wrapper = mountSortableBoard({
      strategy: 'row-grid',
      scopedMarker: true,
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(0, 60),
      d: rect(100, 60),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 170, 70))
    await nextTick()

    const placeholder = wrapper.find('.va-sortable__placeholder')
    expect(placeholder.classes()).toContain('card')
    expect(placeholder.attributes('data-v-demo')).toBeUndefined()
    expect(placeholder.attributes('style')).toContain('border-radius: 9px')
    expect(placeholder.attributes('style')).toContain('grid-column-start: span 2')
    expect(placeholder.attributes('style')).toContain('margin-left: -1px')
    expect(placeholder.attributes('style')).toContain('border-right-width: 3px')
    expect(placeholder.attributes('style')).toContain('border-right-style: solid')
  })

  it('sizes the default placeholder with border-box dimensions', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({
      strategy: 'row-grid',
      userStyle: item => item.id === 'b'
        ? { boxSizing: 'content-box', padding: '10px', border: '1px solid red', backgroundColor: 'rgb(120, 80, 200)' }
        : undefined,
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(0, 60),
      d: rect(100, 60),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 170, 70))
    await nextTick()

    const placeholder = wrapper.find('.va-sortable__placeholder')
    expect(placeholder.attributes('style')).toContain('box-sizing: border-box')
    expect(placeholder.attributes('style')).toContain('flex-shrink: 0')
    expect(placeholder.attributes('style')).toContain('width: 80px')
    expect(placeholder.attributes('style')).toContain('height: 40px')
    expect(placeholder.attributes('style')).not.toContain('background-color')
    expect(placeholder.attributes('style')).not.toContain('rgb(120, 80, 200)')
  })

  it('sizes a custom placeholder with border-box dimensions', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({
      strategy: 'row-grid',
      customPlaceholder: true,
      userStyle: item => item.id === 'b'
        ? { boxSizing: 'content-box', padding: '10px', border: '1px solid red' }
        : undefined,
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(0, 60),
      d: rect(100, 60),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 170, 70))
    await nextTick()

    const placeholder = wrapper.find('.custom-placeholder')
    expect(placeholder.classes()).toContain('va-sortable__placeholder')
    expect(placeholder.attributes('style')).toContain('box-sizing: border-box')
    expect(placeholder.attributes('style')).toContain('width: 80px')
    expect(placeholder.attributes('style')).toContain('height: 40px')
  })

  it('moves the real dragged item with fixed positioning and restores user inline styles after cleanup', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({
      userStyle: item => item.id === 'b'
        ? { position: 'relative', transform: 'scale(1)', color: 'red' }
        : undefined,
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    })

    await pointerDown(wrapper, 'b', 110, 20)
    window.dispatchEvent(pointerEvent('pointermove', 180, 70))
    await nextTick()

    const dragged = wrapper.find('[data-id="b"]')
    expect(dragged.classes()).toContain('va-sortable__item--dragging')
    expect(dragged.attributes('style')).toContain('position: fixed')
    expect(dragged.attributes('style')).toContain('left: 170px')
    expect(dragged.attributes('style')).toContain('top: 50px')
    expect(dragged.attributes('style')).toContain('width: 80px')
    expect(dragged.attributes('style')).toContain('height: 40px')
    expect(dragged.attributes('style')).toContain('color: red')

    window.dispatchEvent(pointerEvent('pointerup', 180, 70))
    await nextTick()

    expect(dragged.attributes('style')).toContain('position: relative')
    expect(dragged.attributes('style')).toContain('transform: scale(1)')
    expect(dragged.attributes('style')).toContain('color: red')
    expect(dragged.attributes('style')).not.toContain('position: fixed')
    expect(dragged.attributes('style')).not.toContain('left: 170px')
  })

  it('moves selected items as a stable group', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const wrapper = mountSortableBoard({
      selectedKeys: ['b', 'c'],
      onReorder,
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    })

    await pointerDown(wrapper, 'c', 210, 10)
    window.dispatchEvent(pointerEvent('pointermove', 370, 10))
    window.dispatchEvent(pointerEvent('pointerup', 370, 10))
    await nextTick()

    expect(onReorder).toHaveBeenCalledWith(expect.objectContaining({
      keys: ['b', 'c'],
      fromIndex: 1,
      toIndex: 2,
    }))
  })

  it('supports selecting items with a predicate', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const wrapper = mountSortableBoard({
      getItemSelected: item => item.id === 'b' || item.id === 'c',
      onReorder,
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 370, 10))
    window.dispatchEvent(pointerEvent('pointerup', 370, 10))
    await nextTick()

    expect(onReorder).toHaveBeenCalledWith(expect.objectContaining({
      keys: ['b', 'c'],
      fromIndex: 1,
      toIndex: 2,
    }))
  })

  it('supports disabling items with a predicate', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const wrapper = mountSortableBoard({
      getItemDisabled: item => item.id === 'b',
      onReorder,
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 370, 10))
    window.dispatchEvent(pointerEvent('pointerup', 370, 10))
    await nextTick()

    expect(wrapper.find('[data-id="b"]').classes()).toContain('va-sortable__item--disabled')
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('keeps locked-key items at their current index while sorting around them', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const wrapper = mountSortableBoard({
      lockedKeys: ['b'],
      onReorder,
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    })

    await pointerDown(wrapper, 'd', 310, 10)
    window.dispatchEvent(pointerEvent('pointermove', 10, 10))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['d', 'b', 'a', 'c'])

    window.dispatchEvent(pointerEvent('pointerup', 10, 10))
    await nextTick()

    expect(onReorder).toHaveBeenCalledWith(expect.objectContaining({
      keys: ['d'],
      fromIndex: 3,
      toIndex: 0,
      previewKeys: ['d', 'b', 'a', 'c'],
    }))
  })

  it('supports locking items with a predicate', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const wrapper = mountSortableBoard({
      getItemLock: item => item.id === 'b' ? 'position' : false,
      onReorder,
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    })

    await pointerDown(wrapper, 'd', 310, 10)
    window.dispatchEvent(pointerEvent('pointermove', 10, 10))
    await nextTick()

    expect(wrapper.find('[data-id="b"]').classes()).toContain('va-sortable__item--locked')
    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['d', 'b', 'a', 'c'])
    expect(wrapper.find('[data-id="b"] [data-sortable-handle]').attributes('aria-disabled')).toBe('true')
  })

  it('does not start a selected drag group that contains a locked item', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const wrapper = mountSortableBoard({
      selectedKeys: ['b', 'c'],
      lockedKeys: ['c'],
      onReorder,
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 370, 10))
    window.dispatchEvent(pointerEvent('pointerup', 370, 10))
    await nextTick()

    expect(wrapper.find('[data-id="b"]').classes()).not.toContain('va-sortable__item--dragging')
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('transfers items between sortable lists in the same group', async () => {
    installPointerEvent()
    const onTransfer = vi.fn()
    const wrapper = mountSortableBoard({
      secondList: true,
      allowTransfer: true,
      selectedKeys: ['b'],
      onTransfer,
    })
    await nextTick()

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      x: rect(0, 120),
      y: rect(100, 120),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 40, 140))
    await nextTick()
    await nextTick()

    window.dispatchEvent(pointerEvent('pointerup', 40, 140))
    await nextTick()

    expect(onTransfer).toHaveBeenCalledWith(expect.objectContaining({
      keys: ['b'],
      fromListId: 'primary',
      toListId: 'secondary',
      toIndex: 0,
    }))
  })

  it('keeps the dragged item in the source list when pointer leaves all drop targets', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const wrapper = mountSortableBoard({ onReorder })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 800, 500))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'c', 'd'])
    expect(wrapper.find('[data-id="b"]').classes()).toContain('va-sortable__item--dragging')
    expect(wrapper.find('.va-sortable__placeholder').exists()).toBe(true)

    window.dispatchEvent(pointerEvent('pointerup', 800, 500))
    await nextTick()

    expect(onReorder).not.toHaveBeenCalled()
  })

  it('keeps duplicate item keys in other lists from sharing drag state', async () => {
    installPointerEvent()
    const wrapper = mountSortableBoard({
      secondList: true,
      secondaryItems: [
        { id: 'b', label: 'Secondary B' },
        { id: 'y', label: 'Y' },
      ],
    })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
      y: rect(600, 0),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 250, 10))
    await nextTick()

    expect(wrapper.find('[data-list="primary"] .va-sortable__placeholder').exists()).toBe(true)
    expect(wrapper.find('[data-list="secondary"] .va-sortable__placeholder').exists()).toBe(false)
    expect(wrapper.find('[data-list="secondary"] [data-id="b"]').classes()).not.toContain('va-sortable__item--dragging')
  })

  it('does not preview or transfer to another list unless transfer is explicitly enabled', async () => {
    installPointerEvent()
    const onTransfer = vi.fn()
    const wrapper = mountSortableBoard({
      secondList: true,
      onTransfer,
    })
    await nextTick()

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      x: rect(0, 120),
      y: rect(100, 120),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 40, 140))
    await nextTick()

    expect(wrapper.findAll('[data-list="primary"] [data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'c', 'd'])
    expect(wrapper.findAll('[data-list="secondary"] [data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['x', 'y'])

    window.dispatchEvent(pointerEvent('pointerup', 40, 140))
    await nextTick()

    expect(onTransfer).not.toHaveBeenCalled()
  })

  it('cancels a drag with Escape and restores the original order', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const wrapper = mountSortableBoard({ onReorder })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    })

    await pointerDown(wrapper, 'b', 110, 10)
    window.dispatchEvent(pointerEvent('pointermove', 330, 10))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'c', 'd'])
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('reorders from the handle with keyboard arrows', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const wrapper = mountSortableBoard({ onReorder })

    await wrapper.find('[data-id="b"] [data-sortable-handle]').trigger('keydown', { key: 'ArrowRight' })

    expect(onReorder).toHaveBeenCalledWith(expect.objectContaining({
      keys: ['b'],
      fromIndex: 1,
      toIndex: 2,
    }))
  })

  it('keeps the drag preview at the last valid position when canDrop rejects a target index', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const canDrop = vi.fn(({ toIndex }) => toIndex >= 1)
    const wrapper = mountSortableBoard({ canDrop, onReorder })

    mockItemRects(wrapper, {
      a: rect(0, 0),
      b: rect(100, 0),
      c: rect(200, 0),
      d: rect(300, 0),
    })

    wrapper.find('[data-id="b"] [data-sortable-handle]').element.dispatchEvent(pointerEvent('pointerdown', 110, 10))
    window.dispatchEvent(pointerEvent('pointermove', 10, 10))
    await nextTick()

    expect(canDrop).toHaveBeenCalledWith(expect.objectContaining({
      keys: ['b'],
      fromIndex: 1,
      toIndex: 0,
      fromListId: 'primary',
      toListId: 'primary',
    }))
    expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-id'))).toEqual(['a', 'b', 'c', 'd'])

    window.dispatchEvent(pointerEvent('pointerup', 10, 10))
    await nextTick()

    expect(onReorder).not.toHaveBeenCalled()
  })

  it('does not emit keyboard reorder when canDrop rejects the target index', async () => {
    installPointerEvent()
    const onReorder = vi.fn()
    const canDrop = vi.fn(({ toIndex }) => toIndex >= 1)
    const wrapper = mountSortableBoard({ canDrop, onReorder })

    await wrapper.find('[data-id="b"] [data-sortable-handle]').trigger('keydown', { key: 'ArrowLeft' })

    expect(canDrop).toHaveBeenCalledWith(expect.objectContaining({
      keys: ['b'],
      fromIndex: 1,
      toIndex: 0,
      fromListId: 'primary',
      toListId: 'primary',
    }))
    expect(onReorder).not.toHaveBeenCalled()
  })

})

function mountSortableBoard(options: {
  strategy?: 'horizontal-list' | 'vertical-list' | 'row-grid' | 'column-grid'
  selectedKeys?: string[]
  lockedKeys?: string[]
  secondList?: boolean
  allowTransfer?: boolean
  scopedMarker?: boolean
  customPlaceholder?: boolean
  secondaryItems?: DemoItem[]
  userStyle?: (item: DemoItem) => Record<string, string> | undefined
  getItemDisabled?: (item: DemoItem, index: number) => boolean
  getItemSelected?: (item: DemoItem, index: number) => boolean
  getItemLock?: (item: DemoItem, index: number) => false | 'position'
  canDrop?: (context: Record<string, unknown>) => boolean
  onReorder?: (payload: unknown) => void
  onTransfer?: (payload: unknown) => void
}) {
  const wrapper = mount(defineComponent({
    components: { VaSortable },
    setup() {
      const primary = ref<DemoItem[]>([
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
        { id: 'd', label: 'D' },
      ])
      const secondary = ref<DemoItem[]>(options.secondaryItems ?? [
        { id: 'x', label: 'X' },
        { id: 'y', label: 'Y' },
      ])

      return {
        primary,
        secondary,
        options,
      }
    },
    template: `
      <VaSortable
        list-id="primary"
        group="demo"
        class="board"
        data-list="primary"
        :items="primary"
        item-key="id"
        :selected-keys="options.selectedKeys"
        :locked-keys="options.lockedKeys"
        :get-item-disabled="options.getItemDisabled"
        :get-item-selected="options.getItemSelected"
        :get-item-lock="options.getItemLock"
        :strategy="options.strategy ?? 'horizontal-list'"
        :allow-transfer="options.allowTransfer"
        :can-drop="options.canDrop"
        @reorder="options.onReorder"
        @transfer="options.onTransfer"
      >
        <template #item="{ item, handleProps }">
          <div
            class="card"
            :style="options.userStyle?.(item)"
            v-bind="options.scopedMarker ? { 'data-v-demo': '' } : {}"
            :data-id="item.id"
          >
            <button type="button" v-bind="handleProps" data-sortable-handle>拖动</button>
            {{ item.label }}
          </div>
        </template>
        <template v-if="options.customPlaceholder" #placeholder="{ item }">
          <div class="card custom-placeholder">{{ item.label }}</div>
        </template>
      </VaSortable>

      <VaSortable
        v-if="options.secondList"
        list-id="secondary"
        group="demo"
        class="board"
        data-list="secondary"
        :items="secondary"
        item-key="id"
        strategy="horizontal-list"
        :allow-transfer="options.allowTransfer"
        @transfer="options.onTransfer"
      >
        <template #item="{ item, handleProps }">
          <div
            class="card"
            :data-id="item.id"
          >
            <button type="button" v-bind="handleProps" data-sortable-handle>拖动</button>
            {{ item.label }}
          </div>
        </template>
      </VaSortable>
    `,
  }), {
    attachTo: document.body,
  })
  mountedWrappers.push(wrapper)
  return wrapper
}

function installPointerEvent() {
  class TestPointerEvent extends MouseEvent {
    pointerId: number
    pointerType: string

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init)
      this.pointerId = init.pointerId ?? 1
      this.pointerType = init.pointerType ?? 'mouse'
    }
  }

  window.PointerEvent = TestPointerEvent as typeof PointerEvent
}

function installScopedCardStyle() {
  const style = document.createElement('style')
  style.setAttribute('data-va-sortable-test-style', '')
  style.textContent = `
    .card[data-v-demo] {
      box-sizing: border-box;
      grid-column-start: span 2;
      margin-left: -1px;
      border-right: 3px solid rgb(10, 20, 30);
      border-radius: 9px;
      background-color: rgb(240, 241, 242);
    }
  `
  document.head.appendChild(style)
}

function pointerEvent(type: string, clientX: number, clientY: number) {
  return new PointerEvent(type, {
    bubbles: true,
    button: type === 'pointermove' ? -1 : 0,
    buttons: type === 'pointerup' ? 0 : 1,
    clientX,
    clientY,
    pointerId: 1,
    pointerType: 'mouse',
  })
}

async function pointerDown(wrapper: ReturnType<typeof mount>, id: string, clientX: number, clientY: number) {
  wrapper.find(`[data-id="${id}"] [data-sortable-handle]`).element.dispatchEvent(pointerEvent('pointerdown', clientX, clientY))
  await nextTick()
}

function rect(left: number, top: number, width = 80, height = 40) {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => undefined,
  } as DOMRect
}

function mockItemRects(wrapper: ReturnType<typeof mount>, rects: Record<string, DOMRect>, boardRect?: DOMRect) {
  const elements = wrapper.findAll('[data-sortable-item]').map(item => item.element as HTMLElement)
  const board = wrapper.find('[data-list="primary"]').element as HTMLElement
  if (boardRect) {
    board.getBoundingClientRect = vi.fn(() => boardRect)
  }

  for (const element of elements) {
    const id = element.dataset.id
    if (!id || !rects[id]) {
      continue
    }

    element.getBoundingClientRect = vi.fn(() => rects[id])
  }

  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn((clientX: number, clientY: number) => {
      const hit = elements.find((element) => {
        const itemRect = element.getBoundingClientRect()
        return clientX >= itemRect.left
          && clientX <= itemRect.right
          && clientY >= itemRect.top
          && clientY <= itemRect.bottom
      })

      if (hit) {
        return hit
      }

      return boardRect
        && clientX >= boardRect.left
        && clientX <= boardRect.right
        && clientY >= boardRect.top
        && clientY <= boardRect.bottom
        ? board
        : null
    }),
  })
}

function mockVariableHorizontalListRects(wrapper: ReturnType<typeof mount>, widths: Record<string, number>) {
  const elements = wrapper.findAll('[data-sortable-item]').map(item => item.element as HTMLElement)
  const board = wrapper.find('[data-list="primary"]').element as HTMLElement

  for (const element of elements) {
    element.getBoundingClientRect = vi.fn(() => {
      const orderedElements = wrapper.findAll('[data-list="primary"] [data-sortable-item]').map(item => item.element as HTMLElement)
      const before = orderedElements.slice(0, Math.max(0, orderedElements.indexOf(element)))
      const left = before.reduce((total, item) => total + (widths[item.dataset.id ?? ''] ?? 80), 0)

      return rect(left, 0, widths[element.dataset.id ?? ''] ?? 80, 40)
    })
  }

  mockElementFromPoint(elements, board, () => rect(0, 0, Object.values(widths).reduce((total, width) => total + width, 0), 40))
}

function mockVariableVerticalListRects(wrapper: ReturnType<typeof mount>, heights: Record<string, number>) {
  const elements = wrapper.findAll('[data-sortable-item]').map(item => item.element as HTMLElement)
  const board = wrapper.find('[data-list="primary"]').element as HTMLElement

  for (const element of elements) {
    element.getBoundingClientRect = vi.fn(() => {
      const orderedElements = wrapper.findAll('[data-list="primary"] [data-sortable-item]').map(item => item.element as HTMLElement)
      const before = orderedElements.slice(0, Math.max(0, orderedElements.indexOf(element)))
      const top = before.reduce((total, item) => total + (heights[item.dataset.id ?? ''] ?? 40), 0)

      return rect(0, top, 80, heights[element.dataset.id ?? ''] ?? 40)
    })
  }

  mockElementFromPoint(elements, board, () => rect(0, 0, 80, Object.values(heights).reduce((total, height) => total + height, 0)))
}

function mockVariableRowGridRects(
  wrapper: ReturnType<typeof mount>,
  sizes: Record<string, { width: number, height: number }>,
  options: { columns: number, rowGap: number },
) {
  const elements = wrapper.findAll('[data-sortable-item]').map(item => item.element as HTMLElement)
  const board = wrapper.find('[data-list="primary"]').element as HTMLElement

  for (const element of elements) {
    element.getBoundingClientRect = vi.fn(() => {
      const orderedElements = wrapper.findAll('[data-list="primary"] [data-sortable-item]').map(item => item.element as HTMLElement)
      const index = Math.max(0, orderedElements.indexOf(element))
      const rowStart = Math.floor(index / options.columns) * options.columns
      const rowElements = orderedElements.slice(rowStart, rowStart + options.columns)
      const before = rowElements.slice(0, Math.max(0, rowElements.indexOf(element)))
      const row = Math.floor(index / options.columns)
      const top = row * (getRowHeight(rowElements, sizes) + options.rowGap)
      const left = before.reduce((total, item) => total + (sizes[item.dataset.id ?? '']?.width ?? 80), 0)
      const size = sizes[element.dataset.id ?? ''] ?? { width: 80, height: 40 }

      return rect(left, top, size.width, size.height)
    })
  }

  mockElementFromPoint(elements, board, () => rect(0, 0, Object.values(sizes).reduce((total, size) => total + size.width, 0), 200))
}

function getRowHeight(elements: HTMLElement[], sizes: Record<string, { width: number, height: number }>) {
  return Math.max(...elements.map(element => sizes[element.dataset.id ?? '']?.height ?? 40))
}

function mockElementFromPoint(elements: HTMLElement[], board: HTMLElement, getBoardRect: () => DOMRect) {
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn((clientX: number, clientY: number) => {
      const hit = elements.find((element) => {
        const itemRect = element.getBoundingClientRect()
        return clientX >= itemRect.left
          && clientX <= itemRect.right
          && clientY >= itemRect.top
          && clientY <= itemRect.bottom
      })
      const boardRect = getBoardRect()

      return hit ?? (
        clientX >= boardRect.left
        && clientX <= boardRect.right
        && clientY >= boardRect.top
        && clientY <= boardRect.bottom
          ? board
          : null
      )
    }),
  })
}

function mockResponsiveGridRects(wrapper: ReturnType<typeof mount>, options: { columns: number, rowGap: number }) {
  const elements = wrapper.findAll('[data-sortable-item]').map(item => item.element as HTMLElement)
  const board = wrapper.find('[data-list="primary"]').element as HTMLElement

  for (const element of elements) {
    element.getBoundingClientRect = vi.fn(() => {
      const orderedElements = wrapper.findAll('[data-list="primary"] [data-sortable-item]').map(item => item.element)
      const index = Math.max(0, orderedElements.indexOf(element))
      const column = index % options.columns
      const row = Math.floor(index / options.columns)
      return rect(column * 100, row * (40 + options.rowGap))
    })
  }

  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn((clientX: number, clientY: number) => {
      const hit = elements.find((element) => {
        const itemRect = element.getBoundingClientRect()
        return clientX >= itemRect.left
          && clientX <= itemRect.right
          && clientY >= itemRect.top
          && clientY <= itemRect.bottom
      })

      return hit ?? (clientX >= 0 && clientX <= 300 && clientY >= 0 && clientY <= 120 ? board : null)
    }),
  })
}
