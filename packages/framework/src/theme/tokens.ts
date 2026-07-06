export type AdminScrollbarMode = 'thin' | 'hover' | 'native'

export interface AdminThemeTokens {
  sidebarWidth: number
  sidebarCollapsedWidth: number
  sidebarMenuItemHeight: number
  sidebarIconSize: number
  sidebarCollapsedIconSize: number
  expandedParentBackground: boolean
  expandedParentStateOpacity: number
  activeStateOpacity: number
  hoverStateOpacity: number
  scrollbar: AdminScrollbarMode
  scrollbarWidth: number
  scrollbarThumbOpacity: number
  scrollbarThumbHoverOpacity: number
  headerHeight: number
  tagsViewHeight: number
}

export const defaultAdminTokens: AdminThemeTokens = {
  sidebarWidth: 272,
  sidebarCollapsedWidth: 56,
  sidebarMenuItemHeight: 44,
  sidebarIconSize: 22,
  sidebarCollapsedIconSize: 26,
  expandedParentBackground: true,
  expandedParentStateOpacity: 0.04,
  activeStateOpacity: 0.11,
  hoverStateOpacity: 0.06,
  scrollbar: 'thin',
  scrollbarWidth: 8,
  scrollbarThumbOpacity: 0.26,
  scrollbarThumbHoverOpacity: 0.42,
  headerHeight: 56,
  tagsViewHeight: 40,
}

export function adminTokenToCssVariables(tokens: AdminThemeTokens): Record<string, string> {
  return {
    '--va-admin-sidebar-bg': 'var(--color-surface-container-high, var(--color-surface-container, var(--color-body)))',
    '--va-admin-sidebar-border': 'var(--color-outline-variant, var(--color-outline))',
    '--va-admin-panel-bg': 'var(--card-background, var(--color-surface-container-low, var(--color-body)))',
    '--va-admin-panel-radius': 'var(--card-border-radius, 4px)',
    '--va-admin-control-radius': 'var(--card-border-radius, 4px)',
    '--va-admin-menu-radius': 'var(--menu-border-radius, 4px)',
    '--va-admin-sidebar-width': `${tokens.sidebarWidth}px`,
    '--va-admin-sidebar-collapsed-width': `${tokens.sidebarCollapsedWidth}px`,
    '--va-admin-sidebar-menu-item-height': `${tokens.sidebarMenuItemHeight}px`,
    '--va-admin-sidebar-icon-size': `${tokens.sidebarIconSize}px`,
    '--va-admin-sidebar-collapsed-icon-size': `${tokens.sidebarCollapsedIconSize}px`,
    '--va-admin-header-height': `${tokens.headerHeight}px`,
    '--va-admin-tags-view-height': `${tokens.tagsViewHeight}px`,
    '--va-admin-menu-text': 'var(--color-on-surface-variant)',
    '--va-admin-menu-active-text': 'var(--color-on-primary-container)',
    '--va-admin-menu-indicator': 'var(--color-primary)',
    '--va-admin-menu-active-bg': `color-mix(in srgb, var(--color-primary) ${tokens.activeStateOpacity * 100}%, transparent)`,
    '--va-admin-menu-hover-bg': `color-mix(in srgb, var(--color-primary) ${tokens.hoverStateOpacity * 100}%, transparent)`,
    '--va-admin-menu-expanded-bg': tokens.expandedParentBackground
      ? `color-mix(in srgb, var(--color-primary) ${tokens.expandedParentStateOpacity * 100}%, transparent)`
      : 'transparent',
    '--va-admin-scrollbar-mode': tokens.scrollbar,
    '--va-admin-scrollbar-width': `${tokens.scrollbarWidth}px`,
    '--va-admin-scrollbar-thumb': `color-mix(in srgb, var(--color-on-surface-variant) ${tokens.scrollbarThumbOpacity * 100}%, transparent)`,
    '--va-admin-scrollbar-thumb-hover': `color-mix(in srgb, var(--color-on-surface-variant) ${tokens.scrollbarThumbHoverOpacity * 100}%, transparent)`,
  }
}
