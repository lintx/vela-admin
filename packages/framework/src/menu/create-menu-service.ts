import type { RouteRecordRaw } from 'vue-router'

import type { PermissionService } from '../permission/create-permission-service'

export interface AdminMenuItem {
  path: string
  title: string
  icon?: string
  permission?: string | string[]
  order: number
  hidden?: boolean
  activeMenu?: string
  navigable: boolean
  firstNavigableChildPath?: string
  children: AdminMenuItem[]
}

export interface AdminMenuMeta {
  path: string
  title: string
  icon?: string
  permission?: string | string[]
  order?: number
  hidden?: boolean
  activeMenu?: string
}

export interface AdminMenuDiagnostic {
  code: 'MISSING_TOP_LEVEL_ICON'
  message: string
  path: string
}

export interface CreateMenuServiceOptions {
  routes: RouteRecordRaw[]
  menuMeta?: AdminMenuMeta[]
  permission?: PermissionService
}

export interface MenuService {
  getMenus(): AdminMenuItem[]
  getDiagnostics(): AdminMenuDiagnostic[]
  getActivePaths(path: string): string[]
}

interface MenuNode extends AdminMenuItem {
  parent?: MenuNode
  children: MenuNode[]
}

export function createMenuService(options: CreateMenuServiceOptions): MenuService {
  const visibleRoutes = options.routes
    .filter((route) => hasMenuTitle(route))
    .filter((route) => canAccessRoute(route, options.permission))
    .sort(compareRoutes)
  const visibleMenuMeta = (options.menuMeta ?? [])
    .filter((meta) => canAccessMenuMeta(meta, options.permission))

  const nodes = [
    ...visibleMenuMeta.map(createMenuMetaNode),
    ...visibleRoutes.map(createMenuNode),
  ]
  const nodeMap = new Map<string, MenuNode>()

  nodes.forEach((node) => {
    const existing = nodeMap.get(node.path)

    if (!existing) {
      nodeMap.set(node.path, node)
      return
    }

    if (node.navigable) {
      node.children = existing.children
      nodeMap.set(node.path, {
        ...existing,
        ...node,
      })
    }
  })
  const menuNodes = Array.from(nodeMap.values()).sort(compareMenuNodes)

  menuNodes.forEach((node) => {
    const parent = findParentNode(node, nodeMap)

    if (parent) {
      node.parent = parent
      parent.children.push(node)
    }
  })

  const menus = menuNodes
    .filter((node) => !node.parent && !node.hidden)
    .map(toPublicMenu)
  const diagnostics = createDiagnostics(menus)

  return {
    getMenus() {
      return menus.map(cloneMenu)
    },

    getDiagnostics() {
      return diagnostics.map((diagnostic) => ({ ...diagnostic }))
    },

    getActivePaths(path) {
      const activeNode = findActiveNode(path, menuNodes)
      if (!activeNode) {
        return []
      }

      const activeMenuPath = activeNode.activeMenu
      if (activeMenuPath && nodeMap.has(activeMenuPath)) {
        return collectNodePath(nodeMap.get(activeMenuPath)!).concat(activeNode.path)
      }

      return collectNodePath(activeNode)
    },
  }
}

function hasMenuTitle(route: RouteRecordRaw) {
  return typeof route.meta?.title === 'string'
}

function canAccessRoute(route: RouteRecordRaw, permission?: PermissionService) {
  const requiredPermission = route.meta?.permission

  if (!permission || !requiredPermission) {
    return true
  }

  if (typeof requiredPermission === 'string' || Array.isArray(requiredPermission)) {
    return permission.hasPermission(requiredPermission)
  }

  return true
}

function canAccessMenuMeta(meta: AdminMenuMeta, permission?: PermissionService) {
  const requiredPermission = meta.permission

  if (!permission || !requiredPermission) {
    return true
  }

  return permission.hasPermission(requiredPermission)
}

function createMenuNode(route: RouteRecordRaw): MenuNode {
  return {
    path: route.path,
    title: String(route.meta?.title ?? route.path),
    icon: typeof route.meta?.icon === 'string' ? route.meta.icon : undefined,
    permission: normalizePermission(route.meta?.permission),
    order: Number(route.meta?.order ?? 0),
    hidden: Boolean(route.meta?.hidden),
    activeMenu: typeof route.meta?.activeMenu === 'string' ? route.meta.activeMenu : undefined,
    navigable: true,
    children: [],
  }
}

function createMenuMetaNode(meta: AdminMenuMeta): MenuNode {
  return {
    path: meta.path,
    title: meta.title,
    icon: meta.icon,
    permission: normalizePermission(meta.permission),
    order: Number(meta.order ?? 0),
    hidden: Boolean(meta.hidden),
    activeMenu: meta.activeMenu,
    navigable: false,
    children: [],
  }
}

function normalizePermission(permission: unknown) {
  if (typeof permission === 'string') {
    return permission
  }

  if (Array.isArray(permission)) {
    return permission.filter((item): item is string => typeof item === 'string')
  }

  return undefined
}

function findParentNode(node: MenuNode, nodeMap: Map<string, MenuNode>) {
  const parentPaths = createParentPaths(node.path)

  return parentPaths
    .map((path) => nodeMap.get(path))
    .find((parent): parent is MenuNode => Boolean(parent))
}

function createParentPaths(path: string) {
  const segments = path.split('/').filter(Boolean)
  const parentPaths: string[] = []

  for (let index = segments.length - 1; index > 0; index -= 1) {
    parentPaths.push(`/${segments.slice(0, index).join('/')}`)
  }

  return parentPaths
}

function compareRoutes(a: RouteRecordRaw, b: RouteRecordRaw) {
  const orderA = Number(a.meta?.order ?? 0)
  const orderB = Number(b.meta?.order ?? 0)

  if (orderA !== orderB) {
    return orderA - orderB
  }

  return a.path.localeCompare(b.path)
}

function compareMenuNodes(a: MenuNode, b: MenuNode) {
  if (a.order !== b.order) {
    return a.order - b.order
  }

  return a.path.localeCompare(b.path)
}

function toPublicMenu(node: MenuNode): AdminMenuItem {
  const children = node.children
    .filter((child) => !child.hidden)
    .sort((a, b) => a.order - b.order || a.path.localeCompare(b.path))
    .map(toPublicMenu)

  return {
    path: node.path,
    title: node.title,
    icon: node.icon,
    permission: node.permission,
    order: node.order,
    hidden: node.hidden,
    activeMenu: node.activeMenu,
    navigable: children.length > 0 ? false : node.navigable,
    firstNavigableChildPath: findFirstNavigableChildPath(children),
    children,
  }
}

function findFirstNavigableChildPath(children: AdminMenuItem[]): string | undefined {
  for (const child of children) {
    if (child.children.length > 0) {
      const childPath = findFirstNavigableChildPath(child.children)

      if (childPath) {
        return childPath
      }
    }

    if (child.navigable) {
      return child.path
    }
  }

  return undefined
}

function createDiagnostics(menus: AdminMenuItem[]) {
  return menus
    .filter((menu) => !menu.icon)
    .map((menu) => ({
      code: 'MISSING_TOP_LEVEL_ICON' as const,
      message: `Top-level menu "${menu.path}" should define an icon.`,
      path: menu.path,
    }))
}

function cloneMenu(menu: AdminMenuItem): AdminMenuItem {
  return {
    ...menu,
    children: menu.children.map(cloneMenu),
  }
}

function findActiveNode(path: string, nodes: MenuNode[]) {
  return nodes
    .filter((node) => matchRoutePath(node.path, path))
    .sort((a, b) => b.path.length - a.path.length)[0]
}

function matchRoutePath(routePath: string, currentPath: string) {
  if (routePath === currentPath) {
    return true
  }

  const pattern = routePath
    .replace(/:[^/]+\(.*\)/g, '.+')
    .replace(/:[^/]+\?/g, '[^/]*')
    .replace(/:[^/]+/g, '[^/]+')

  return new RegExp(`^${pattern}$`).test(currentPath)
}

function collectNodePath(node: MenuNode) {
  const paths: string[] = []
  let current: MenuNode | undefined = node

  while (current) {
    paths.unshift(current.path)
    current = current.parent
  }

  return paths
}
