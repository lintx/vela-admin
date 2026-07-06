import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AdminThemeGenerator from '../../src/layout/components/AdminThemeGenerator.vue'

describe('AdminThemeGenerator', () => {
  it('renders source color controls, real preview controls, and emits generated themes', async () => {
    const wrapper = mount(AdminThemeGenerator, {
      props: {
        open: true,
        sourceColor: '#6750A4',
        themeBase: 'md3Light',
        themeMode: 'light',
        developerExport: true,
      },
      global: globalStubs(),
    })

    expect(wrapper.find('[data-testid="admin-theme-generator"]').exists()).toBe(true)
    expect(wrapper.find('.va-admin-theme-generator__controls').exists()).toBe(true)
    expect(wrapper.find('.va-admin-theme-generator__preview').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-theme-version"]').attributes('data-checkmark')).toBe('false')
    expect(wrapper.find('[data-testid="admin-theme-mode"]').attributes('data-checkmark')).toBe('false')
    expect(wrapper.text()).toContain('推荐主题色')
    expect(wrapper.text()).toContain('自定义颜色')
    expect(wrapper.text()).toContain('MD2 蓝')
    expect(wrapper.text()).toContain('主色')
    expect(wrapper.text()).toContain('主色背景')
    expect(wrapper.text()).toContain('面板底色')
    expect(wrapper.findAll('[data-testid="admin-theme-custom-colors"] .va-admin-theme-generator__custom-item')).toHaveLength(0)
    expect(wrapper.find('[data-testid="admin-theme-preview"]').text()).toContain('预览侧栏')
    expect(wrapper.find('[data-testid="admin-theme-preview"]').text()).toContain('主要操作')
    expect(wrapper.find('[data-testid="admin-theme-preview-keyword"][placeholder="请输入关键词"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-theme-source-color-text"]').attributes('aria-label')).toBe('自定义主题色 HEX')
    expect(wrapper.find('[data-testid="admin-theme-preview-keyword"]').attributes('aria-label')).toBe('预览关键词')
    expect(wrapper.find('[data-testid="admin-theme-image-uploader"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-theme-image-uploader"]').attributes('data-maxlength')).toBeUndefined()
    expect(wrapper.find('[data-testid="admin-theme-add-custom-color"]').attributes('data-outline')).toBe('true')
    expect(wrapper.find('[data-testid="admin-theme-add-custom-color"]').attributes('data-button-type')).toBe('primary')
    expect(wrapper.find('[data-testid="admin-theme-image-uploader"] .va-admin-theme-generator__upload-action').attributes('data-outline')).toBe('true')
    expect(wrapper.find('[data-testid="admin-theme-image-uploader"] .va-admin-theme-generator__upload-action').attributes('data-button-type')).toBe('primary')
    expect(wrapper.find('[data-testid="admin-theme-reset"]').attributes('data-outline')).toBe('true')
    expect(wrapper.find('[data-testid="admin-theme-reset"]').attributes('data-button-type')).toBe('info')
    expect(wrapper.find('[data-testid="admin-theme-preview-action"]').attributes('data-outline')).toBe('true')
    expect(wrapper.find('[data-testid="admin-theme-preview-action"]').attributes('data-button-type')).toBe('info')
    expect(wrapper.find('[data-testid="admin-theme-apply"]').attributes('data-outline')).toBe('true')
    expect(wrapper.find('[data-testid="admin-theme-apply"]').attributes('data-button-type')).toBe('primary')
    expect((wrapper.find('[data-testid="admin-theme-export"]').element as HTMLInputElement).value).toContain('--color-primary')

    await wrapper.find('[data-testid="admin-theme-version"]').trigger('click')
    expect(wrapper.emitted('update:themeBase')).toBeUndefined()

    await wrapper.find('[data-testid="admin-theme-apply"]').trigger('click')
    const payload = wrapper.emitted('apply')?.at(-1)?.[0]

    expect(payload).toMatchObject({
      sourceColor: '#6750A4',
      themeBase: 'md2Light',
      themeMode: 'light',
    })
    expect(payload.theme.cssVariables['--color-primary']).toBeTypeOf('string')
  })

  it('resets the generator draft state to the default preview', async () => {
    const wrapper = mount(AdminThemeGenerator, {
      props: {
        open: true,
        sourceColor: '#10B981',
        themeBase: 'md2Dark',
        themeMode: 'dark',
      },
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-theme-version"]').trigger('click')
    await wrapper.find('[aria-label="选择MD2 蓝"]').trigger('click')
    await wrapper.find('[data-testid="admin-theme-reset"]').trigger('click')
    await wrapper.find('[data-testid="admin-theme-apply"]').trigger('click')

    expect(wrapper.emitted('apply')?.at(-1)?.[0]).toMatchObject({
      sourceColor: '#6750A4',
      themeBase: 'md3Light',
      themeMode: 'light',
    })
  })

  it('does not add recommended colors into custom colors when applying', async () => {
    const wrapper = mount(AdminThemeGenerator, {
      props: {
        open: true,
        sourceColor: '#10B981',
        themeBase: 'md3Light',
        themeMode: 'light',
        customColors: [{ color: '#B141C8', label: '自定义 #B141C8', removable: true }],
      },
      global: globalStubs(),
    })

    expect(wrapper.findAll('[data-testid="admin-theme-custom-colors"] .va-admin-theme-generator__custom-item')).toHaveLength(1)

    await wrapper.find('[aria-label="选择MD2 蓝"]').trigger('click')
    await wrapper.find('[data-testid="admin-theme-apply"]').trigger('click')

    expect(wrapper.emitted('apply')?.at(-1)?.[0]).toMatchObject({
      sourceColor: '#2563EB',
      themeBase: 'md3Light',
      themeMode: 'light',
    })
    expect(wrapper.emitted('update:customColors')).toBeUndefined()
    expect(wrapper.findAll('[data-testid="admin-theme-custom-colors"] .va-admin-theme-generator__custom-item')).toHaveLength(1)
  })

  it('adds custom source colors only from the add button', async () => {
    const wrapper = mount(AdminThemeGenerator, {
      props: {
        open: true,
        sourceColor: '#6750A4',
        themeBase: 'md3Light',
        themeMode: 'light',
        customColors: [],
      },
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-theme-source-color-text"]').setValue('#B141C8')
    await wrapper.find('[data-testid="admin-theme-source-color-text"]').trigger('blur')
    await wrapper.find('[data-testid="admin-theme-add-custom-color"]').trigger('click')

    expect(wrapper.emitted('update:customColors')?.at(-1)).toEqual([[
      { color: '#B141C8', label: '自定义 #B141C8', removable: true },
    ]])
  })

  it('uses outline Varlet buttons for custom color selection and deletion', () => {
    const wrapper = mount(AdminThemeGenerator, {
      props: {
        open: true,
        sourceColor: '#6750A4',
        themeBase: 'md3Light',
        themeMode: 'light',
        customColors: [{ color: '#B141C8', label: '自定义 #B141C8', removable: true }],
      },
      global: globalStubs(),
    })

    expect(wrapper.find('[aria-label="选择自定义 #B141C8"]').attributes('data-outline')).toBe('true')
    expect(wrapper.find('[aria-label="选择自定义 #B141C8"]').attributes('data-button-type')).toBe('primary')
    expect(wrapper.find('[aria-label="删除自定义 #B141C8"]').attributes('data-outline')).toBe('true')
    expect(wrapper.find('[aria-label="删除自定义 #B141C8"]').attributes('data-button-type')).toBe('primary')
    expect(wrapper.find('[aria-label="删除自定义 #B141C8"]').attributes('data-round')).toBe('true')
  })

  it('uses larger icons for icon-only theme generator actions', () => {
    const wrapper = mount(AdminThemeGenerator, {
      props: {
        open: true,
        sourceColor: '#6750A4',
        themeBase: 'md3Light',
        themeMode: 'light',
      },
      global: globalStubs(),
    })

    expect(wrapper.find('[aria-label="关闭主题生成器"] va-icon-stub').attributes('size')).toBe('22')
  })
})

function globalStubs() {
  return {
    stubs: {
      VaIcon: true,
      VarAlert: {
        props: ['message'],
        template: '<div v-bind="$attrs">{{ message }}</div>',
      },
      VarPopup: {
        props: ['show', 'defaultStyle'],
        emits: ['update:show'],
        template: '<div v-if="show" v-bind="$attrs" :data-default-style="defaultStyle === false ? \'false\' : \'true\'"><slot /></div>',
      },
      VarButton: {
        props: {
          type: String,
          block: Boolean,
          text: Boolean,
          round: Boolean,
          outline: Boolean,
        },
        template: '<button v-bind="$attrs" type="button" :data-button-type="type" :data-outline="outline ? \'true\' : \'false\'" :data-round="round ? \'true\' : \'false\'"><slot /></button>',
      },
      VarInput: {
        props: ['modelValue', 'placeholder', 'hint', 'textarea', 'readonly', 'rows'],
        emits: ['update:modelValue', 'blur'],
        template: '<input v-bind="$attrs" :data-hint="hint" :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @blur="$emit(\'blur\')" />',
      },
      VarUploader: {
        props: ['modelValue', 'accept', 'maxlength'],
        emits: ['update:modelValue', 'beforeRead', 'afterRead'],
        template: '<div v-bind="$attrs" :data-maxlength="maxlength"><slot /></div>',
      },
      VarSwitch: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template: '<button type="button" @click="$emit(\'update:modelValue\', !modelValue)"><slot /></button>',
      },
      VarSpace: {
        template: '<div><slot /></div>',
      },
      VarSegmentedButtons: {
        props: ['modelValue', 'options', 'checkmark'],
        emits: ['update:modelValue'],
        template: '<button v-bind="$attrs" type="button" :data-checkmark="checkmark === false ? \'false\' : \'true\'" @click="$emit(\'update:modelValue\', options?.[1]?.value ?? modelValue)"><slot />{{ options?.map((option) => option.label).join(\'\') }}</button>',
      },
    },
  }
}
