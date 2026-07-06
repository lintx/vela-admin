export interface TopMenuItemWidth {
  path: string
  width: number
}

export interface ResolveTopMenuOverflowOptions {
  menuWidths: TopMenuItemWidth[]
  availableWidth: number
  overflowWidth: number
  activePath?: string
}

export interface TopMenuOverflowResult {
  visiblePaths: string[]
  overflowPaths: string[]
  overflowActive: boolean
}

export function resolveTopMenuOverflow(options: ResolveTopMenuOverflowOptions): TopMenuOverflowResult {
  const { menuWidths, availableWidth, overflowWidth, activePath = '' } = options
  const totalWidth = menuWidths.reduce((sum, item) => sum + item.width, 0)

  if (totalWidth <= availableWidth) {
    return {
      visiblePaths: menuWidths.map((item) => item.path),
      overflowPaths: [],
      overflowActive: false,
    }
  }

  const visiblePaths: string[] = []
  let usedWidth = overflowWidth

  for (const item of menuWidths) {
    if (usedWidth + item.width <= availableWidth) {
      visiblePaths.push(item.path)
      usedWidth += item.width
      continue
    }

  }

  const activeItem = menuWidths.find((item) => item.path === activePath)
  if (
    activeItem
    && !visiblePaths.includes(activeItem.path)
    && overflowWidth + activeItem.width <= availableWidth
  ) {
    while (visiblePaths.length > 0 && usedWidth + activeItem.width > availableWidth) {
      const lastVisiblePath = visiblePaths[visiblePaths.length - 1]
      const lastVisibleItem = menuWidths.find((item) => item.path === lastVisiblePath)

      if (!lastVisibleItem) {
        break
      }

      visiblePaths.pop()
      usedWidth -= lastVisibleItem.width
    }

    if (usedWidth + activeItem.width <= availableWidth) {
      visiblePaths.push(activeItem.path)
    }
  }

  const visiblePathSet = new Set(visiblePaths)
  const overflowPaths = menuWidths
    .filter((item) => !visiblePathSet.has(item.path))
    .map((item) => item.path)

  return {
    visiblePaths,
    overflowPaths,
    overflowActive: overflowPaths.includes(activePath),
  }
}
