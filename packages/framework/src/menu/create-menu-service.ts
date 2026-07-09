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
  public?: boolean
  specialRoute?: unknown
}

export function createMenuService(options: CreateMenuServiceOptions): MenuService {
  const nodes = [
    ...(options.menuMeta ?? []).map(createMenuMetaNode),
    ...options.routes.filter((route) => hasMenuTitle(route)).map(createMenuNode),
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

  menuNodes
    .filter((node) => !node.parent)
    .forEach((node) => inheritNodePermission(node))

  const menus = menuNodes
    .filter((node) => !node.parent)
    .map((node) => toPublicMenu(node, options.permission))
    .filter((menu): menu is AdminMenuItem => Boolean(menu))
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
    public: route.meta?.public === true,
    specialRoute: route.meta?.specialRoute,
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

function normalizePermission(permission: unknown): string[] | undefined {
  if (typeof permission === 'string') {
    return [permission]
  }

  if (Array.isArray(permission)) {
    const permissions = permission.filter((item): item is string => typeof item === 'string')
    return permissions.length > 0 ? permissions : undefined
  }

  return undefined
}

function mergePermissions(parentPermission?: string | string[], ownPermission?: string | string[]) {
  const permissions = [
    ...(Array.isArray(parentPermission) ? parentPermission : parentPermission ? [parentPermission] : []),
    ...(Array.isArray(ownPermission) ? ownPermission : ownPermission ? [ownPermission] : []),
  ]

  return permissions.length > 0 ? Array.from(new Set(permissions)) : undefined
}

function inheritNodePermission(node: MenuNode, parentPermission?: string | string[]) {
  node.permission = node.public || node.specialRoute
    ? normalizePermission(node.permission)
    : mergePermissions(parentPermission, node.permission)

  node.children.forEach((child) => inheritNodePermission(child, node.permission))
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

function compareMenuNodes(a: MenuNode, b: MenuNode) {
  if (a.order !== b.order) {
    return a.order - b.order
  }

  return a.path.localeCompare(b.path)
}

function toPublicMenu(node: MenuNode, permission?: PermissionService): AdminMenuItem | undefined {
  if (node.hidden || !canAccessNode(node, permission)) {
    return undefined
  }

  const children = node.children
    .sort((a, b) => a.order - b.order || a.path.localeCompare(b.path))
    .map((child) => toPublicMenu(child, permission))
    .filter((child): child is AdminMenuItem => Boolean(child))

  if (!node.navigable && children.length === 0) {
    return undefined
  }

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

function canAccessNode(node: MenuNode, permission?: PermissionService) {
  if (node.public || node.specialRoute || !node.permission || !permission) {
    return true
  }

  return permission.hasPermission(node.permission)
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
