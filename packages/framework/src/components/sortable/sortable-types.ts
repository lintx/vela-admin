export type VaSortableKey = string | number

export type VaSortableItemLock = false | 'position'

export type VaSortableStrategy =
  | 'vertical-list'
  | 'horizontal-list'
  | 'row-grid'
  | 'column-grid'

export interface VaSortablePayload<T = Record<string, unknown>> {
  keys: VaSortableKey[]
  items: T[]
  fromIndex: number
  toIndex: number
  fromListId: string
  toListId: string
  previewKeys: VaSortableKey[]
}

export interface VaSortableDropContext<T = Record<string, unknown>> {
  keys: VaSortableKey[]
  movingItems: T[]
  listItems: T[]
  fromIndex: number
  toIndex: number
  fromListId: string
  toListId: string
  previewKeys: VaSortableKey[]
}

export interface VaSortableItemState {
  dragging: boolean
  placeholder: boolean
  selected: boolean
  disabled: boolean
  locked: boolean
}
