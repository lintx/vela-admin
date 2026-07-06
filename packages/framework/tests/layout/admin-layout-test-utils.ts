import { RouterLinkStub } from '@vue/test-utils'
import { vi } from 'vitest'

import type { AdminMenuItem } from '../../src/index'

const originalMatchMedia = window.matchMedia

export function resetLayoutTestDom() {
  window.matchMedia = originalMatchMedia
  document.body.innerHTML = ''
}

export function mockViewport(mobile: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: mobile && query.includes('max-width'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

export function layoutProps(overrides: Record<string, unknown> = {}) {
  return {
    appName: 'Vela Admin',
    menus: menus(),
    activePaths: ['/'],
    currentPath: '/',
    pageTitle: '控制台',
    tags: [
      { path: '/', title: '控制台', fixed: true },
      { path: '/system/user', title: '用户管理' },
    ],
    sourceColor: '#6750A4',
    customColors: [
      { color: '#10B981', label: '自定义青绿', removable: true },
    ],
    layoutFeatures: {
      tagsView: true,
      menuSearch: true,
      settings: true,
    },
    ...overrides,
  }
}

export function menus(): AdminMenuItem[] {
  return [
    {
      path: '/',
      title: '控制台',
      icon: 'view-dashboard-outline',
      order: 10,
      navigable: true,
      children: [],
    },
    {
      path: '/system',
      title: '系统管理',
      icon: 'cog-outline',
      order: 20,
      navigable: false,
      children: [
        {
          path: '/system/user',
          title: '用户管理',
          order: 10,
          navigable: true,
          children: [],
        },
      ],
    },
  ]
}

export function globalStubs(overrides: Record<string, unknown> = {}) {
  return {
    stubs: {
      RouterLink: RouterLinkStub,
      RouterView: { template: '<main data-testid="router-view" />' },
      VaIcon: {
        props: ['name', 'library', 'size'],
        template: '<span class="va-icon" :data-admin-icon="name" :data-admin-icon-library="library" :data-admin-icon-size="size"><slot /></span>',
      },
      VarButton: {
        props: {
          text: Boolean,
          round: Boolean,
          outline: Boolean,
          type: String,
        },
        template: '<button v-bind="$attrs" type="button" :data-outline="outline ? \'true\' : \'false\'" :data-round="round ? \'true\' : \'false\'" :data-text="text ? \'true\' : \'false\'" :data-button-type="type"><slot /></button>',
      },
      VarSpace: {
        template: '<div><slot /></div>',
      },
      VarInput: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
      },
      VarSwitch: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template: '<button v-bind="$attrs" type="button" data-testid="admin-settings-switch" @click="$emit(\'update:modelValue\', !modelValue)"><slot /></button>',
      },
      VarSlider: {
        props: ['modelValue', 'min', 'max', 'step'],
        emits: ['update:modelValue'],
        template: `
          <div v-bind="$attrs" data-testid="admin-settings-slider" :data-step="step">
            <input type="range" :min="min" :max="max" :step="step" :value="modelValue" @input="$emit('update:modelValue', Number($event.target.value))" />
            <slot name="button" :current-value="modelValue" />
          </div>
        `,
      },
      VarPopup: {
        props: ['show', 'defaultStyle'],
        emits: ['update:show'],
        template: '<div v-if="show" v-bind="$attrs" :data-default-style="defaultStyle === false ? \'false\' : \'true\'"><slot /></div>',
      },
      VarSegmentedButtons: {
        props: ['modelValue', 'options', 'checkmark'],
        emits: ['update:modelValue'],
        template: '<button v-bind="$attrs" type="button" :data-checkmark="checkmark === false ? \'false\' : \'true\'" @click="$emit(\'update:modelValue\', options?.[1]?.value ?? modelValue)"><slot />{{ options?.map((option) => option.label).join(\'\') }}</button>',
      },
      VarBreadcrumbs: {
        template: '<nav data-testid="admin-header-breadcrumb"><slot /></nav>',
      },
      VarBreadcrumb: {
        template: '<span class="var-breadcrumb-item" @click="$emit(\'click\')"><slot /></span>',
      },
      VarMenu: {
        template: '<span class="var-menu"><slot /></span>',
      },
      VarMenuSelect: {
        props: ['show', 'options'],
        emits: ['select', 'update:show'],
        template: `
          <div v-if="show" class="var-menu-select" data-testid="admin-tag-context-menu">
            <template v-for="option in options" :key="option.value ?? option.label">
              <hr v-if="option.divider" class="va-admin-tags-view__menu-divider" data-testid="admin-tag-menu-divider" />
              <button
                v-else
                type="button"
                :disabled="option.disabled"
                class="va-admin-tags-view__menu-option"
                :data-testid="\`admin-tag-menu-\${option.value}\`"
                @click="$emit('select', option.value)"
              >
                <span v-if="option.icon" class="va-icon" :data-admin-icon="option.icon" />
                {{ option.text ?? option.label }}
              </button>
            </template>
          </div>
        `,
      },
      VarTabs: {
        props: ['active'],
        emits: ['click'],
        template: '<div class="var-tabs"><slot /><div class="var-tabs__indicator"><div class="var-tabs__indicator-inner" /></div></div>',
      },
      VarTab: {
        props: ['name'],
        template: '<div class="var-tab va-admin-top-menu__item" @mouseenter="$emit(\'mouseenter\', $event)" @mouseleave="$emit(\'mouseleave\', $event)" @focusin="$emit(\'focusin\', $event)" @click="$emit(\'click\', name)"><slot /></div>',
      },
      'var-tree-menu': {
        props: ['modelValue', 'active', 'options', 'expandedValues'],
        emits: ['update:modelValue', 'update:active', 'update:expandedValues', 'change'],
        template: `
          <div class="var-tree-menu" data-testid="admin-sidebar-tree-menu">
            <slot />
            <template v-for="option in options" :key="option.path">
              <button
                type="button"
                class="var-tree-menu__item"
                :class="{ 'var-tree-menu__item--active': active === option.path }"
                :data-path="option.path"
                :data-navigable="option.navigable ? 'true' : 'false'"
                @click="$emit('change', option.path, option)"
              >
                {{ option.title }}
              </button>
              <button
                v-for="child in option.children"
                :key="child.path"
                type="button"
                class="var-tree-menu__item"
                :data-path="child.path"
                :data-navigable="child.navigable ? 'true' : 'false'"
                @click="$emit('change', child.path, child)"
              >
                {{ child.title }}
              </button>
            </template>
          </div>
        `,
      },
      ...overrides,
    },
  }
}

export function createMenuSelectStub() {
  const setReference = vi.fn()
  const resize = vi.fn()

  return {
    setReference,
    resize,
    stub: {
      props: ['show', 'options'],
      emits: ['select', 'update:show'],
      methods: {
        setReference,
        resize,
      },
      template: `
        <div v-if="show" class="var-menu-select" data-testid="admin-tag-context-menu">
          <template v-for="option in options" :key="option.value ?? option.label">
            <hr v-if="option.divider" class="va-admin-tags-view__menu-divider" data-testid="admin-tag-menu-divider" />
            <button
              v-else
              type="button"
              :disabled="option.disabled"
              class="va-admin-tags-view__menu-option"
              :data-testid="\`admin-tag-menu-\${option.value}\`"
              @click="$emit('select', option.value)"
            >
              <span v-if="option.icon" class="va-icon" :data-admin-icon="option.icon" />
              {{ option.text ?? option.label }}
            </button>
          </template>
        </div>
      `,
    },
  }
}

