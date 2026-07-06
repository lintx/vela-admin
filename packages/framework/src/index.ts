export {
  adminTokenToCssVariables,
  defaultAdminTokens,
  type AdminScrollbarMode,
  type AdminThemeTokens,
} from './theme/tokens'
export {
  createAdminTheme,
  createAdminThemeCssText,
  resolveVarletTheme,
  type AdminThemeBase,
  type AdminThemeOptions,
  type ResolvedAdminTheme,
} from './theme/create-theme'
export {
  generateMaterialAdminThemes,
  type GeneratedMaterialAdminThemes,
} from './theme/material-theme-generator'
export {
  createSourceColorAdminTheme,
  createThemeGeneratorExport,
  extractDominantColorFromImageData,
  validateThemeImageFile,
  type SourceColorAdminThemeInput,
  type ThemeGeneratorExportInput,
  type ThemeGeneratorExportResult,
  type ThemeImageDataLike,
  type ThemeImageLike,
} from './theme/theme-generator-service'
export {
  applyAdminTheme,
  type ThemeStyleTarget,
} from './theme/theme-provider'
export {
  createAdminApp,
  type AdminAppContext,
  type CreateAdminAppOptions,
} from './app/create-admin-app'
export {
  defineAdminConfig,
  mergeAdminConfig,
  type AdminConfig,
  type AdminConfigInput,
  type AdminLayoutConfig,
  type AdminLayoutMode,
  type AdminPermissionConfig,
  type AdminResolvedThemeMode,
  type AdminSettingsConfig,
  type AdminThemeConfig,
  type AdminThemeMode,
} from './app/define-admin-config'
export {
  defaultAdminConfig,
} from './settings/default-settings'
export {
  default as VaIcon,
} from './icons/VaIcon.vue'
export {
  defaultAdminIconConfig,
  resolveAdminIcon,
} from './icons/icon-registry'
export {
  getAdminSemanticIconEntries,
  type AdminSemanticIconEntry,
} from './icons/semantic-icons'
export type {
  AdminIconConfig,
  AdminIconLibrary,
  AdminPhosphorWeight,
  ResolvedAdminIcon,
} from './icons/icon-types'
export {
  createSettingsService,
  type CreateSettingsServiceOptions,
  type SettingsService,
} from './settings/create-settings-service'
export {
  defineRouteMeta,
  type AdminRouteMeta,
} from './router/route-meta'
export {
  parseAdminMenuMeta,
  parseAdminRoutes,
  type PageGlob,
  type PageModule,
  type ParseAdminRoutesOptions,
} from './router/route-parser'
export {
  AdminRouteDiagnosticError,
} from './router/route-diagnostics'
export {
  createAdminRouter,
  type CreateAdminRouterOptions,
} from './router/create-admin-router'
export {
  createPermissionService,
  type AdminSession,
  type AdminUser,
  type PermissionCheckMode,
  type PermissionOptions,
  type PermissionService,
  type UnauthorizedBehavior,
} from './permission/create-permission-service'
export {
  permissionDirective,
} from './permission/permission-directive'
export {
  createPermissionGuard,
  type CreatePermissionGuardOptions,
} from './permission/permission-guard'
export {
  permissionInjectionKey,
  providePermission,
  usePermission,
} from './permission/use-permission'
export {
  createMenuService,
  type AdminMenuDiagnostic,
  type AdminMenuItem,
  type AdminMenuMeta,
  type CreateMenuServiceOptions,
  type MenuService,
} from './menu/create-menu-service'
export {
  searchAdminMenus,
  type AdminMenuSearchResult,
} from './menu/menu-search'
export {
  menuInjectionKey,
  provideMenu,
  useMenu,
} from './menu/use-menu'
export {
  createTabsService,
  type AdminTab,
  type CreateTabsServiceOptions,
  type TabsService,
} from './tabs/create-tabs-service'
export {
  default as AdminSidebar,
} from './layout/components/AdminSidebar.vue'
export {
  default as AdminLayout,
} from './layout/AdminLayout.vue'
export {
  default as SideLayout,
} from './layout/SideLayout.vue'
export {
  default as TopLayout,
} from './layout/TopLayout.vue'
export {
  default as MixedLayout,
} from './layout/MixedLayout.vue'
export {
  default as AdminHeader,
} from './layout/components/AdminHeader.vue'
export {
  default as AdminMain,
} from './layout/components/AdminMain.vue'
export {
  default as AdminDrawerSidebar,
} from './layout/components/AdminDrawerSidebar.vue'
export {
  default as AdminTopMenu,
} from './layout/components/AdminTopMenu.vue'
export {
  default as AdminSidebarItem,
} from './layout/components/AdminSidebarItem.vue'
export {
  default as AdminCollapsedSubMenu,
} from './layout/components/AdminCollapsedSubMenu.vue'
export {
  default as AdminTagsView,
} from './layout/components/AdminTagsView.vue'
export {
  default as AdminMenuSearch,
} from './layout/components/AdminMenuSearch.vue'
export {
  default as AdminSettingsDrawer,
} from './layout/components/AdminSettingsDrawer.vue'
export {
  default as AdminThemeGenerator,
  type AdminThemeGeneratorPayload,
  type ThemeColorChip,
} from './layout/components/AdminThemeGenerator.vue'
export {
  default as VaContextMenu,
} from './components/context-menu/VaContextMenu.vue'
export {
  default as VaContextMenuGroup,
} from './components/context-menu/VaContextMenuGroup.vue'
export {
  default as VaContextMenuItem,
} from './components/context-menu/VaContextMenuItem.vue'
export {
  default as VaDialog,
} from './components/dialog/VaDialog.vue'
export type {
  VaContextMenuGroupOption,
  VaContextMenuItemOption,
  VaContextMenuItemValue,
  VaContextMenuPlacement,
  VaContextMenuTrigger,
} from './components/context-menu/context-menu-types'
