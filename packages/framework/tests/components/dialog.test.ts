import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { VaDialog } from '../../src/index'

describe('VaDialog', () => {
  it('renders a Varlet based dialog with title, close button, content, and footer slots', async () => {
    const wrapper = mount(VaDialog, {
      props: {
        show: true,
        title: '系统弹窗',
      },
      slots: {
        default: '<p data-testid="dialog-body">弹窗内容</p>',
        footer: '<button data-testid="dialog-action">确认</button>',
      },
      global: globalStubs(),
    })

    expect(wrapper.find('[data-testid="va-dialog"]').exists()).toBe(true)
    expect(wrapper.find('.va-dialog__panel').attributes('role')).toBe('dialog')
    expect(wrapper.find('.va-dialog__panel').attributes('aria-modal')).toBe('true')
    expect(wrapper.find('.va-dialog__title').text()).toBe('系统弹窗')
    expect(wrapper.find('[data-testid="dialog-body"]').text()).toBe('弹窗内容')
    expect(wrapper.find('[data-testid="dialog-action"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="关闭系统弹窗"]').attributes('data-round')).toBe('true')

    await wrapper.find('[aria-label="关闭系统弹窗"]').trigger('click')

    expect(wrapper.emitted('update:show')?.at(-1)).toEqual([false])
    expect(wrapper.emitted('close')?.at(-1)).toEqual([])
  })

  it('can hide the default close button and forwards popup visibility changes', async () => {
    const wrapper = mount(VaDialog, {
      props: {
        show: true,
        title: '无关闭按钮弹窗',
        closeable: false,
      },
      global: globalStubs(),
    })

    expect(wrapper.find('[aria-label="关闭无关闭按钮弹窗"]').exists()).toBe(false)

    await wrapper.find('[data-testid="popup-hide"]').trigger('click')

    expect(wrapper.emitted('update:show')?.at(-1)).toEqual([false])
    expect(wrapper.emitted('close')?.at(-1)).toEqual([])
  })
})

function globalStubs() {
  return {
    stubs: {
      VaIcon: {
        props: ['name', 'size'],
        template: '<span class="va-icon" :data-admin-icon="name" :data-admin-icon-size="size" />',
      },
      VarButton: {
        props: {
          text: Boolean,
          round: Boolean,
          outline: Boolean,
          type: String,
        },
        template: '<button v-bind="$attrs" type="button" :data-text="text ? \'true\' : \'false\'" :data-round="round ? \'true\' : \'false\'" :data-outline="outline ? \'true\' : \'false\'"><slot /></button>',
      },
      VarPopup: {
        props: ['show', 'defaultStyle', 'position', 'teleport', 'closeOnClickOverlay'],
        emits: ['update:show'],
        template: '<div v-if="show" v-bind="$attrs" :data-default-style="defaultStyle === false ? \'false\' : \'true\'" :data-position="position" :data-teleport="teleport" :data-close-on-click-overlay="closeOnClickOverlay === false ? \'false\' : \'true\'"><slot /><button data-testid="popup-hide" type="button" @click="$emit(\'update:show\', false)">hide</button></div>',
      },
    },
  }
}
