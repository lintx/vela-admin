import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AdminLayout } from '../../src/index'
import {
  createAdminThemeModeTransition,
  resolveAdminThemeTransitionClipPath,
  type AdminThemeTransitionDocument,
  type AdminThemeTransitionWindow,
} from '../../src/theme'
import { globalStubs, layoutProps, mockViewport, resetLayoutTestDom } from './admin-layout-test-utils'

afterEach(resetLayoutTestDom)
afterEach(() => {
  vi.useRealTimers()
  delete (document as Document & { startViewTransition?: unknown }).startViewTransition
  delete (document.documentElement as HTMLElement & { animate?: unknown }).animate
})

describe('AdminLayout settings drawer', () => {
  it('opens settings drawer and emits setting changes', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).toContain('布局模式')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).toContain('个性设置')

    await wrapper.find('[data-testid="admin-layout-mode-segments"] [data-option-value="top"]').trigger('click')
    expect(wrapper.emitted('update:mode')?.at(-1)).toEqual(['top'])
  })

  it('keeps the settings drawer visible behind the theme generator', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    expect(wrapper.find('.va-admin-settings-drawer--open').exists()).toBe(true)

    await wrapper.find('[data-testid="admin-open-theme-generator"]').trigger('click')

    expect(wrapper.emitted('openThemeGenerator')).toHaveLength(1)
    expect(wrapper.find('.va-admin-settings-drawer--open').exists()).toBe(true)
  })

  it('builds settings drawer controls with Varlet primitives', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')

    expect(wrapper.find('[data-testid="admin-settings-popup"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-settings-popup"]').attributes('data-default-style')).toBe('false')
    expect(wrapper.find('[data-testid="admin-layout-mode-segments"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-theme-base-segments"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-theme-mode-segments"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-layout-mode-segments"]').attributes('aria-label')).toBe('布局模式')
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').attributes('aria-label')).toBe('滚动条模式')
    expect(wrapper.find('[data-testid="admin-theme-base-segments"]').attributes('aria-label')).toBe('主题风格')
    expect(wrapper.find('[data-testid="admin-theme-mode-segments"]').attributes('aria-label')).toBe('主题模式')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).toContain('显示')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).toContain('滚动条显示')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).toContain('展开宽度')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).not.toContain('导航')
    expect(wrapper.findAll('.va-admin-settings-drawer__section h3').map(item => item.text())).toEqual([
      '布局模式',
      '显示',
      '主题',
    ])
    expect(wrapper.find('[data-testid="admin-layout-mode-segments"]').attributes('data-checkmark')).toBe('false')
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').attributes('data-checkmark')).toBe('false')
    expect(wrapper.find('[data-testid="admin-theme-base-segments"]').attributes('data-checkmark')).toBe('false')
    expect(wrapper.find('[data-testid="admin-theme-mode-segments"]').attributes('data-checkmark')).toBe('false')
    expect(wrapper.find('[data-testid="admin-settings-theme-colors"]').text()).toContain('MD3 紫')
    expect(wrapper.find('[data-testid="admin-settings-theme-colors"]').text()).toContain('#10B981')
    expect(wrapper.find('[data-testid="admin-open-theme-generator"]').attributes('data-text')).toBe('true')
    expect(wrapper.find('[data-testid="admin-open-theme-generator"]').attributes('data-outline')).toBe('true')
    expect(wrapper.find('[data-testid="admin-open-theme-generator"]').attributes('data-button-type')).toBe('primary')
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').text()).toContain('始终显示')
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').text()).toContain('悬停显示')
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').text()).toContain('系统默认')
    expect(wrapper.findAll('[data-testid="admin-settings-slider"]')).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="admin-settings-switch"]')).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="admin-settings-slider"]').map(slider => slider.attributes('aria-label'))).toEqual([
      '展开宽度',
    ])
    expect(wrapper.find('[data-testid="admin-settings-slider"]').classes()).toContain('va-admin-settings-drawer__slider')
    expect(wrapper.find('[data-testid="admin-settings-slider"]').attributes('data-step')).toBe('5')
    expect(wrapper.find('.va-admin-settings-drawer__slider-thumb').text()).toBe('272')
    expect(wrapper.find('[data-testid="admin-sidebar-width-field"]').element.tagName).not.toBe('LABEL')
    expect(wrapper.find('[data-testid="admin-sidebar-width-field"]').text()).not.toContain('272px')
    expect(wrapper.findAll('[data-testid="admin-settings-switch"]').map(item => item.attributes('aria-label'))).toEqual([
      '标签栏',
    ])
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).not.toContain('收缩宽度')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).not.toContain('收缩图标')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).not.toContain('父级背景')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).not.toContain('菜单搜索')

    await wrapper.find('[data-testid="admin-layout-mode-segments"] [data-option-value="top"]').trigger('click')
    expect(wrapper.emitted('update:mode')?.at(-1)).toEqual(['top'])

    await wrapper.find('[aria-label="选择自定义青绿"]').trigger('click')
    expect(wrapper.emitted('update:sourceColor')?.at(-1)).toEqual(['#10B981'])
  })

  it('emits the clicked theme mode option as the transition target', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        themeMode: 'system',
        themeBase: 'md3Light',
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    const darkOption = wrapper.find('[data-testid="admin-theme-mode-segments"] [data-option-value="dark"]')
    await darkOption.trigger('click')

    expect(wrapper.emitted('update:themeMode')?.at(-1)).toEqual(['dark', darkOption.element])
    expect(wrapper.emitted('update:themeBase')?.at(-1)).toEqual(['md3Dark'])
  })

  it('emits theme base before starting an async theme mode transition', async () => {
    mockViewport(false)
    const events: string[] = []
    let updatePromise = Promise.resolve()
    const documentRef = {
      documentElement: { animate: vi.fn() },
      startViewTransition: vi.fn((callback: () => void) => {
        events.push('transition:start')
        updatePromise = Promise.resolve().then(() => {
          events.push('transition:callback')
          callback()
        })
        return { ready: updatePromise }
      }),
    } as unknown as AdminThemeTransitionDocument
    const modeTransition = createAdminThemeModeTransition({
      getMode: () => 'system' as const,
      setMode: mode => events.push(`mode:${mode}`),
      modes: ['light', 'dark'] as const,
      windowRef: {
        innerWidth: 800,
        innerHeight: 600,
        matchMedia: () => ({ matches: false }) as MediaQueryList,
      },
      documentRef,
    })
    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        themeMode: 'system',
        themeBase: 'md3Light',
        'onUpdate:themeBase': (base: string) => events.push(`base:${base}`),
        'onUpdate:themeMode': (mode: 'light' | 'dark', target: HTMLElement | null) => {
          events.push(`mode-event:${mode}`)
          modeTransition.to(mode, target)
        },
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    const darkOption = wrapper.find('[data-testid="admin-theme-mode-segments"] [data-option-value="dark"]')
    const clickPromise = darkOption.trigger('click')

    expect(events).toEqual([
      'base:md3Dark',
      'mode-event:dark',
      'transition:start',
    ])

    await clickPromise
    await updatePromise
    expect(events).toEqual([
      'base:md3Dark',
      'mode-event:dark',
      'transition:start',
      'transition:callback',
      'mode:dark',
    ])
  })

  it('emits the focused theme mode option as the keyboard transition target', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      attachTo: document.body,
      props: layoutProps({
        themeMode: 'system',
        themeBase: 'md3Light',
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    const darkOption = wrapper.find('[data-testid="admin-theme-mode-segments"] [data-option-value="dark"]')
    const darkOptionElement = darkOption.element as HTMLElement
    darkOptionElement.focus()
    await wrapper.vm.$nextTick()
    expect(document.activeElement).toBe(darkOptionElement)

    await darkOption.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:themeMode')?.at(-1)).toEqual(['dark', darkOptionElement])
  })

  it('keeps the Space keyup theme mode target after the keydown microtask', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      attachTo: document.body,
      props: layoutProps({
        themeMode: 'system',
        themeBase: 'md3Light',
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    const darkOption = wrapper.find('[data-testid="admin-theme-mode-segments"] [data-option-value="dark"]')
    const darkOptionElement = darkOption.element as HTMLElement
    vi.spyOn(darkOptionElement, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 40,
      left: 100,
      top: 40,
      right: 180,
      bottom: 72,
      width: 80,
      height: 32,
      toJSON: () => ({}),
    })
    darkOptionElement.focus()
    await wrapper.vm.$nextTick()

    await darkOption.trigger('keydown', { key: ' ' })
    await Promise.resolve()
    expect(wrapper.emitted('update:themeMode')).toBeUndefined()

    await darkOption.trigger('keyup', { key: ' ' })

    const emittedTarget = wrapper.emitted('update:themeMode')?.at(-1)?.[1]
    expect(wrapper.emitted('update:themeMode')?.at(-1)).toEqual(['dark', darkOptionElement])
    expect(resolveAdminThemeTransitionClipPath({
      rect: (emittedTarget as HTMLElement).getBoundingClientRect(),
      viewportWidth: 800,
      viewportHeight: 600,
      pixelRatio: 2,
    }).from).toBe('circle(0px at 140px 56px)')
  })

  it('does not reuse a focused option for a later programmatic theme mode update', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      attachTo: document.body,
      props: layoutProps({
        themeMode: 'system',
        themeBase: 'md3Light',
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    const darkOption = wrapper.find('[data-testid="admin-theme-mode-segments"] [data-option-value="dark"]')
    ;(darkOption.element as HTMLElement).focus()
    await wrapper.vm.$nextTick()

    const themeModeSegments = wrapper.findAllComponents({ name: 'VarSegmentedButtons' })
      .find(component => component.attributes('data-testid') === 'admin-theme-mode-segments')
    expect(themeModeSegments).toBeDefined()

    themeModeSegments!.vm.$emit('update:modelValue', 'light')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:themeMode')?.at(-1)?.[0]).toBe('light')
    expect([null, undefined]).toContain(wrapper.emitted('update:themeMode')?.at(-1)?.[1])
  })

  it('clears an unconsumed pointer target after the current interaction microtask', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        themeMode: 'system',
        themeBase: 'md3Light',
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    const darkOption = wrapper.find('[data-testid="admin-theme-mode-segments"] [data-option-value="dark"]')
    await darkOption.trigger('pointerdown')
    await Promise.resolve()

    const themeModeSegments = wrapper.findAllComponents({ name: 'VarSegmentedButtons' })
      .find(component => component.attributes('data-testid') === 'admin-theme-mode-segments')
    expect(themeModeSegments).toBeDefined()

    themeModeSegments!.vm.$emit('update:modelValue', 'light')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:themeMode')?.at(-1)?.[0]).toBe('light')
    expect([null, undefined]).toContain(wrapper.emitted('update:themeMode')?.at(-1)?.[1])
  })

  it('does not use the segmented control blank area as a theme transition target', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        themeMode: 'system',
        themeBase: 'md3Light',
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    const themeModeSegments = wrapper.findAllComponents({ name: 'VarSegmentedButtons' })
      .find(component => component.attributes('data-testid') === 'admin-theme-mode-segments')
    expect(themeModeSegments).toBeDefined()

    const radioGroup = wrapper.find('[data-testid="admin-theme-mode-segments"] [role="radiogroup"]')
    radioGroup.element.addEventListener('click', () => {
      themeModeSegments!.vm.$emit('update:modelValue', 'light')
    }, { once: true })
    await radioGroup.trigger('click')

    expect(wrapper.emitted('update:themeMode')?.at(-1)?.[0]).toBe('light')
    expect([null, undefined]).toContain(wrapper.emitted('update:themeMode')?.at(-1)?.[1])
  })

  it('does not reuse a stale theme transition target for programmatic updates', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        themeMode: 'system',
        themeBase: 'md3Light',
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    const darkOption = wrapper.find('[data-testid="admin-theme-mode-segments"] [data-option-value="dark"]')
    await darkOption.trigger('click')
    expect(wrapper.emitted('update:themeMode')?.at(-1)).toEqual(['dark', darkOption.element])

    const themeModeSegments = wrapper.findAllComponents({ name: 'VarSegmentedButtons' })
      .find(component => component.attributes('data-testid') === 'admin-theme-mode-segments')
    expect(themeModeSegments).toBeDefined()

    themeModeSegments!.vm.$emit('update:modelValue', 'light')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:themeMode')?.at(-1)?.[0]).toBe('light')
    expect([null, undefined]).toContain(wrapper.emitted('update:themeMode')?.at(-1)?.[1])
  })

  it('animates the theme mode transition from the emitted option center in CSS pixel coordinates', async () => {
    mockViewport(false)
    const transition = { ready: Promise.resolve() }
    const animate = vi.fn()
    const documentRef = {
      documentElement: { animate },
      startViewTransition: vi.fn((callback: () => void) => {
        callback()
        return transition
      }),
    } as unknown as AdminThemeTransitionDocument
    const windowRef: AdminThemeTransitionWindow = {
      innerWidth: 800,
      innerHeight: 600,
      devicePixelRatio: 2,
      matchMedia: () => ({ matches: false }) as MediaQueryList,
    }
    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        themeMode: 'system',
        themeBase: 'md3Light',
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    const darkOption = wrapper.find('[data-testid="admin-theme-mode-segments"] [data-option-value="dark"]')
    vi.spyOn(darkOption.element, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 40,
      left: 100,
      top: 40,
      right: 180,
      bottom: 72,
      width: 80,
      height: 32,
      toJSON: () => ({}),
    })
    await darkOption.trigger('click')

    const emittedTarget = wrapper.emitted('update:themeMode')?.at(-1)?.[1]
    const modeTransition = createAdminThemeModeTransition({
      getMode: () => 'system' as const,
      setMode: vi.fn(),
      modes: ['light', 'dark'] as const,
      windowRef,
      documentRef,
    })
    modeTransition.to('dark', emittedTarget as HTMLElement)
    await transition.ready
    await Promise.resolve()

    const x = 140
    const y = 56
    const radius = Math.hypot(660, 544)
    expect(animate).toHaveBeenCalledWith(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      expect.any(Object),
    )
  })

  it('keeps settings drawer as a square native drawer surface', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminSettingsDrawer.vue'),
      'utf8',
    )

    expect(source).toContain(':default-style="false"')
    expect(source).not.toContain('border-radius: var(--card-border-radius) 0 0 var(--card-border-radius)')
    expect(source).not.toContain('border-radius: var(--card-border-radius) 0 0 0')
  })

  it('centers the custom sidebar width slider thumb on the Varlet slider position', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminSettingsDrawerContent.vue'),
      'utf8',
    )

    expect(source).toContain('width: 32px;')
    expect(source).toContain('margin: 0 -16px;')
    expect(source).not.toContain('min-width: 32px;')
  })

  it('keeps theme color chips dense while centering swatches and showing custom hex labels', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        customColors: [
          { color: '#B141C8', label: '自定义 #B141C8', removable: true },
        ],
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')

    expect(wrapper.find('[data-testid="admin-settings-theme-colors"]').text()).toContain('#B141C8')
    expect(wrapper.find('.va-admin-settings-drawer__theme-color-label--custom').exists()).toBe(true)
    expect(wrapper.find('.va-admin-settings-drawer__theme-color-label--custom').text()).toBe('#B141C8')

    const source = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminSettingsDrawerContent.vue'),
      'utf8',
    )

    expect(source).toContain('grid-template-columns: repeat(6, minmax(0, 1fr));')
    expect(source).toContain('justify-items: center;')
    expect(source).toContain('min-height: 48px;')
    expect(source).toContain('grid-template-rows: 20px minmax(14px, auto);')
    expect(source).toContain('font-size: 9px;')
    expect(source).toContain('letter-spacing: 0;')
    expect(source).toContain('class="va-admin-settings-drawer__section va-admin-settings-drawer__section--theme"')
    expect(source).toContain('.va-admin-settings-drawer__section.va-admin-settings-drawer__section--theme {')
    expect(source).toContain('border-bottom: 0;')
    expect(source).toContain('data-testid="admin-open-theme-generator"')
    expect(source).toContain('outline')
    expect(source).toContain('type="primary"')
  })

  it('uses larger icons for icon-only settings actions', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    expect(wrapper.find('[data-testid="admin-settings-button"] .va-icon').attributes('data-admin-icon-size')).toBe('22')

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')

    expect(wrapper.find('[aria-label="关闭设置"] .va-icon').attributes('data-admin-icon-size')).toBe('22')
  })

  it('requests layout recalculation after opening so the sidebar width slider can measure itself', async () => {
    vi.useFakeTimers()
    mockViewport(false)
    const dispatchEvent = vi.spyOn(window, 'dispatchEvent')

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(250)

    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'resize' }))
  })

  it('updates the sidebar width slider thumb while dragging', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    await wrapper.find('[data-testid="admin-settings-slider"] input').setValue(300)

    expect(wrapper.find('.va-admin-settings-drawer__slider-thumb').text()).toBe('300')
    expect(wrapper.emitted('update:sidebarWidth')?.at(-1)).toEqual([300])
  })
})
