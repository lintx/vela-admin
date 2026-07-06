import type { AdminConfig } from '../app/define-admin-config'

export const defaultAdminConfig: AdminConfig = {
  appName: 'Vela Admin',
  homePath: '/',
  loginPath: '/login',
  icons: {
    defaultLibrary: 'phosphor',
    fallbackLibrary: 'tabler',
    phosphor: {
      weight: 'regular',
    },
  },
  layout: {
    mode: 'side',
    sidebarWidth: 272,
    sidebarCollapsedWidth: 56,
    sidebarMenuItemHeight: 44,
    sidebarIconSize: 22,
    sidebarCollapsedIconSize: 26,
    expandedParentBackground: true,
    expandedParentStateOpacity: 0.04,
    activeStateOpacity: 0.11,
    hoverStateOpacity: 0.06,
    collapsedSubMenuTrigger: 'hover',
    scrollbar: 'thin',
    scrollbarWidth: 8,
    scrollbarThumbOpacity: 0.26,
    scrollbarThumbHoverOpacity: 0.42,
    tagsView: true,
    menuSearch: true,
    settings: true,
  },
  theme: {
    base: 'md3Light',
    mode: 'light',
    persist: true,
    developerTools: false,
    sourceColor: '#6750A4',
  },
  settings: {
    persist: true,
    storageKey: 'varlet-admin:settings',
  },
  permission: {
    unauthorizedBehavior: 'remove',
  },
}
