export interface FloatingMenuAnchorRect {
  left: number
  right?: number
  top: number
  bottom?: number
}

export interface ResolveFloatingChildPanelPositionOptions {
  rootRect: FloatingMenuAnchorRect
  parentPanelRect: FloatingMenuAnchorRect
  parentItemRect: FloatingMenuAnchorRect
  viewportWidth: number
  viewportHeight: number
  panelWidth: number
  panelHeight: number
  panelPadding: number
  panelBorderTop: number
  viewportMargin?: number
}

export interface FloatingPanelPosition {
  left: string
  top: string
}

export function resolveFloatingChildPanelPosition(
  options: ResolveFloatingChildPanelPositionOptions,
): FloatingPanelPosition {
  const {
    rootRect,
    parentPanelRect,
    parentItemRect,
    viewportWidth,
    viewportHeight,
    panelWidth,
    panelHeight,
    panelPadding,
    panelBorderTop,
    viewportMargin = 8,
  } = options
  const parentRight = parentPanelRect.right ?? parentPanelRect.left + panelWidth
  const rightLeft = parentRight - rootRect.left - 1
  const leftLeft = parentPanelRect.left - rootRect.left - panelWidth + 1
  const absoluteRightEdge = parentRight - 1 + panelWidth
  const hasRightSpace = absoluteRightEdge <= viewportWidth - viewportMargin
  const absoluteLeftEdge = parentPanelRect.left - panelWidth - 1
  const hasLeftSpace = absoluteLeftEdge >= viewportMargin
  const left = hasRightSpace || !hasLeftSpace
    ? rightLeft
    : leftLeft
  const preferredTop = parentItemRect.top - rootRect.top - panelPadding - panelBorderTop
  const minTop = viewportMargin - rootRect.top
  const maxTop = viewportHeight - viewportMargin - panelHeight - rootRect.top
  const top = Math.min(Math.max(preferredTop, minTop), Math.max(minTop, maxTop))

  return {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  }
}
