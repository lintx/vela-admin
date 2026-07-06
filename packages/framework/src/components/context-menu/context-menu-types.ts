export type VaContextMenuTrigger = 'click' | 'contextmenu' | 'both' | 'manual'

export type VaContextMenuPlacement =
  | 'cursor'
  | 'target-center'
  | 'target-top'
  | 'target-top-right'
  | 'target-right'
  | 'target-bottom-right'
  | 'target-bottom'
  | 'target-bottom-left'
  | 'target-left'
  | 'target-top-left'

export type VaContextMenuItemValue = string | number

export interface VaContextMenuItemOption {
  value: VaContextMenuItemValue
  text: string
  icon?: string
  disabled?: boolean
  danger?: boolean
  shortcut?: string
  children?: VaContextMenuItemOption[]
}

export type VaContextMenuGroupOption = VaContextMenuItemOption[]

export interface VaContextMenuRegisteredGroup {
  id: symbol
}

export interface VaContextMenuRegisteredItem {
  groupId: symbol
  item: VaContextMenuItemOption
}
