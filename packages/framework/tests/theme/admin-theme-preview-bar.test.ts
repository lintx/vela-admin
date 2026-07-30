import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import AdminThemePreviewBar from '../../src/layout/components/AdminThemePreviewBar.vue'

describe('AdminThemePreviewBar', () => {
  it('does not render while closed', () => {
    const wrapper = mountBar({ open: false })

    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })

  it('emits every preview action once and reflects the active view', async () => {
    const wrapper = mountBar({ open: true, previewVisible: false })

    expect(wrapper.get('[role="region"]').attributes('aria-label')).toBe('主题预览')
    expect(wrapper.text()).toContain('当前主题')
    expect(wrapper.text()).toContain('预览主题')
    expect(wrapper.text()).toContain('取消预览')
    expect(wrapper.text()).toContain('应用主题')
    expect(wrapper.get('[data-testid="admin-theme-preview-current"]').classes()).toContain('va-admin-theme-preview-bar__action--active')
    expect(wrapper.get('[data-testid="admin-theme-preview-generated"]').classes()).not.toContain('va-admin-theme-preview-bar__action--active')
    expect(wrapper.get('[data-testid="admin-theme-preview-current"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="admin-theme-preview-generated"]').attributes('aria-pressed')).toBe('false')

    await wrapper.get('[data-testid="admin-theme-preview-current"]').trigger('click')
    await wrapper.get('[data-testid="admin-theme-preview-generated"]').trigger('click')
    await wrapper.get('[data-testid="admin-theme-preview-cancel"]').trigger('click')
    await wrapper.get('[data-testid="admin-theme-preview-apply"]').trigger('click')

    expect(wrapper.emitted('showCurrent')).toHaveLength(1)
    expect(wrapper.emitted('showGenerated')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('apply')).toHaveLength(1)

    await wrapper.setProps({ previewVisible: true })
    expect(wrapper.get('[data-testid="admin-theme-preview-generated"]').classes()).toContain('va-admin-theme-preview-bar__action--active')
    expect(wrapper.get('[data-testid="admin-theme-preview-current"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('[data-testid="admin-theme-preview-generated"]').attributes('aria-pressed')).toBe('true')
  })

  it('uses the matching MD2 and MD3 shape modifiers', async () => {
    const wrapper = mountBar({ open: true, themeBase: 'md2Dark' })

    expect(wrapper.get('[role="region"]').classes()).toContain('va-admin-theme-preview-bar--md2')
    expect(wrapper.get('[role="region"]').classes()).not.toContain('va-admin-theme-preview-bar--md3')

    await wrapper.setProps({ themeBase: 'md3Light' })
    expect(wrapper.get('[role="region"]').classes()).toContain('va-admin-theme-preview-bar--md3')
  })

  it('preserves the existing preview bar visual values and mobile layout', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminThemePreviewBar.vue'),
      'utf8',
    )

    expect(source).toContain('z-index: 2400;')
    expect(source).toContain('padding: 5px 10px 5px 6px;')
    expect(source).toContain('border-radius: 18px;')
    expect(source).toContain('padding-right: 12px;')
    expect(source).toContain('border-radius: 6px;')
    expect(source).toContain('@media (max-width: 640px)')
    expect(source).toContain('right: 12px;')
    expect(source).toContain('left: 12px;')
    expect(source).toContain('flex: 1 1 0;')
  })
})

function mountBar(props: Record<string, unknown>) {
  return mount(AdminThemePreviewBar, {
    props,
    global: {
      stubs: {
        VarButton: {
          props: ['text', 'type'],
          emits: ['click'],
          template: '<button v-bind="$attrs" type="button" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  })
}
