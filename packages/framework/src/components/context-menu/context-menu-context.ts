import type { InjectionKey } from 'vue'

import type {
  VaContextMenuItemOption,
  VaContextMenuRegisteredGroup,
  VaContextMenuRegisteredItem,
} from './context-menu-types'

export interface VaContextMenuGroupContext {
  groupId: symbol
}

export interface VaContextMenuContext {
  registerGroup(group: VaContextMenuRegisteredGroup): void
  unregisterGroup(groupId: symbol): void
  registerItem(item: VaContextMenuRegisteredItem): void
  unregisterItem(groupId: symbol, value: VaContextMenuItemOption['value']): void
}

export const vaContextMenuInjectionKey: InjectionKey<VaContextMenuContext> = Symbol('va-context-menu')
export const vaContextMenuGroupInjectionKey: InjectionKey<VaContextMenuGroupContext> = Symbol('va-context-menu-group')
