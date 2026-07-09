import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

import type { AdminMenuMeta } from '../menu/create-menu-service'
import {
  throwDuplicateRouteName,
  throwDuplicateRoutePath,
} from './route-diagnostics'
import type { AdminRouteMeta } from './route-meta'

export type PageModule = Component | { default?: Component; route?: Partial<RouteRecordRaw> }
export type MetaModule = AdminRouteMeta | { default?: AdminRouteMeta }
export type PageGlob = Record<string, PageModule | MetaModule | (() => Promise<PageModule | MetaModule>)>

export interface ParseAdminRoutesOptions {
  pagesRoot?: string
}

interface RouteEntry {
  index: number
  filePath: string
  routePath: string
  name: NonNullable<RouteRecordRaw['name']>
  module: PageGlob[string]
  route?: Partial<RouteRecordRaw>
  meta?: AdminRouteMeta
}

export function parseAdminRoutes(glob: PageGlob, options: ParseAdminRoutesOptions = {}): RouteRecordRaw[] {
  const pagesRoot = normalizePagesRoot(options.pagesRoot ?? inferPagesRoot(Object.keys(glob)))
  const metaMap = createMetaMap(glob, pagesRoot)
  const routeEntries = Object.entries(glob)
    .filter(([filePath]) => isPageFile(filePath))
    .map(([filePath, module], index) => createRouteEntry(filePath, module, pagesRoot, metaMap, index))

  assertUniqueRoutes(routeEntries)
  applyInheritedPermissions(routeEntries, metaMap)

  return routeEntries
    .sort(compareRouteEntries)
    .map((entry) => ({
      ...entry.route,
      path: entry.routePath,
      name: entry.name,
      component: resolvePageComponent(entry.module),
      meta: entry.meta,
    }))
}

export function parseAdminMenuMeta(glob: PageGlob, options: ParseAdminRoutesOptions = {}): AdminMenuMeta[] {
  const pagesRoot = normalizePagesRoot(options.pagesRoot ?? inferPagesRoot(Object.keys(glob)))
  const pagePaths = new Set(
    Object.keys(glob)
      .filter(isPageFile)
      .map((filePath) => stripExtension(stripPagesRoot(normalizePath(filePath), pagesRoot))),
  )

  return Object.entries(glob)
    .filter(([filePath]) => isMetaFile(filePath))
    .map(([filePath, module], index) => {
      const relativePath = stripMetaExtension(stripPagesRoot(normalizePath(filePath), pagesRoot))
      return {
        index,
        relativePath,
        routePath: fileNameToRoutePath(relativePath),
        meta: resolveMeta(module),
      }
    })
    .filter((entry) => !pagePaths.has(entry.relativePath))
    .filter((entry) => typeof entry.meta.title === 'string')
    .sort((a, b) => a.index - b.index)
    .map((entry) => {
      const menuMeta: AdminMenuMeta = {
        path: entry.routePath,
        title: String(entry.meta.title),
      }
      const permission = normalizePermission(entry.meta.permission)

      if (typeof entry.meta.icon === 'string') {
        menuMeta.icon = entry.meta.icon
      }

      if (permission) {
        menuMeta.permission = permission
      }

      if (typeof entry.meta.order === 'number') {
        menuMeta.order = entry.meta.order
      }

      if (typeof entry.meta.hidden === 'boolean') {
        menuMeta.hidden = entry.meta.hidden
      }

      if (typeof entry.meta.activeMenu === 'string') {
        menuMeta.activeMenu = entry.meta.activeMenu
      }

      return menuMeta
    })
}

function applyInheritedPermissions(routeEntries: RouteEntry[], metaMap: Map<string, AdminRouteMeta>): void {
  const permissionMap = new Map<string, string[]>()

  metaMap.forEach((meta, relativePath) => {
    const permission = normalizePermissionList(meta.permission)
    if (permission) {
      permissionMap.set(fileNameToRoutePath(relativePath), permission)
    }
  })

  routeEntries.forEach((entry) => {
    const permission = normalizePermissionList(entry.meta?.permission)
    if (permission) {
      permissionMap.set(entry.routePath, permission)
    }
  })

  routeEntries.forEach((entry) => {
    if (entry.meta?.public || entry.meta?.specialRoute) {
      return
    }

    const inheritedPermission = collectInheritedPermissions(entry.routePath, permissionMap)
    if (inheritedPermission) {
      entry.meta = {
        ...entry.meta,
        permission: inheritedPermission,
      }
    }
  })
}

function collectInheritedPermissions(path: string, permissionMap: Map<string, string[]>): string | string[] | undefined {
  const pathChain = [...createRouteParentPaths(path).reverse(), path]
  const permissions = pathChain.flatMap((item) => permissionMap.get(item) ?? [])
  const uniquePermissions = Array.from(new Set(permissions))

  if (uniquePermissions.length === 0) {
    return undefined
  }

  return uniquePermissions.length === 1 ? uniquePermissions[0] : uniquePermissions
}
function createRouteParentPaths(path: string): string[] {
  const segments = path.split('/').filter(Boolean)
  const parentPaths: string[] = []

  for (let index = segments.length - 1; index > 0; index -= 1) {
    parentPaths.push(`/${segments.slice(0, index).join('/')}`)
  }

  return parentPaths
}

function normalizePermissionList(permission: unknown): string[] | undefined {
  if (typeof permission === 'string') {
    return [permission]
  }

  if (Array.isArray(permission)) {
    const permissions = permission.filter((item): item is string => typeof item === 'string')
    return permissions.length > 0 ? permissions : undefined
  }

  return undefined
}
function createRouteEntry(
  filePath: string,
  module: PageGlob[string],
  pagesRoot: string,
  metaMap: Map<string, AdminRouteMeta>,
  index: number,
): RouteEntry {
  const relativePath = stripExtension(stripPagesRoot(normalizePath(filePath), pagesRoot))
  const inlineRoute = resolveInlineRoute(module)
  const inferredRoutePath = fileNameToRoutePath(relativePath)
  const routePath = typeof inlineRoute?.path === 'string' ? inlineRoute.path : inferredRoutePath

  return {
    index,
    filePath,
    routePath,
    name: inlineRoute?.name ?? routeNameFromPath(routePath),
    module,
    route: inlineRoute,
    meta: {
      ...(inlineRoute?.meta ?? {}),
      ...(metaMap.get(relativePath) ?? {}),
    },
  }
}

function createMetaMap(glob: PageGlob, pagesRoot: string): Map<string, AdminRouteMeta> {
  const metaMap = new Map<string, AdminRouteMeta>()

  Object.entries(glob).forEach(([filePath, module]) => {
    if (!isMetaFile(filePath)) {
      return
    }

    const relativePath = stripMetaExtension(stripPagesRoot(normalizePath(filePath), pagesRoot))
    metaMap.set(relativePath, resolveMeta(module))
  })

  return metaMap
}

function fileNameToRoutePath(relativePath: string): string {
  const segments = splitRouteSegments(relativePath)
  const routeSegments = segments
    .filter((segment, index) => !(segment === 'index' && (segments.length === 1 || index === segments.length - 1)))
    .map(routeSegmentFromFileSegment)

  return `/${routeSegments.join('/')}`.replace(/\/$/, '') || '/'
}

function splitRouteSegments(relativePath: string): string[] {
  const segments: string[] = []
  let current = ''
  let bracketDepth = 0

  for (const char of relativePath) {
    if (char === '[') {
      bracketDepth += 1
      current += char
      continue
    }

    if (char === ']') {
      bracketDepth -= 1
      current += char
      continue
    }

    if ((char === '.' || char === '/') && bracketDepth === 0) {
      if (current) {
        segments.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (current) {
    segments.push(current)
  }

  return segments
}

function routeSegmentFromFileSegment(segment: string): string {
  const catchAll = segment.match(/^\[\.\.\.([A-Za-z0-9_]+)]$/)

  if (catchAll) {
    return `:${catchAll[1]}(.*)`
  }

  const optional = segment.match(/^\[\[([A-Za-z0-9_]+)]]$/)

  if (optional) {
    return `:${optional[1]}?`
  }

  const dynamic = segment.match(/^\[([A-Za-z0-9_]+)]$/)

  if (dynamic) {
    return `:${dynamic[1]}`
  }

  return segment
}

function routeNameFromPath(path: string): string {
  if (path === '/') {
    return 'index'
  }

  return path
    .split('/')
    .filter(Boolean)
    .join('-')
    .replace(/[:()?*.]+/g, '')
}

function compareRouteEntries(a: RouteEntry, b: RouteEntry): number {
  const orderA = Number(a.meta?.order ?? 0)
  const orderB = Number(b.meta?.order ?? 0)

  if (orderA !== orderB) {
    return orderA - orderB
  }

  return a.index - b.index
}

function normalizePermission(permission: unknown): AdminMenuMeta['permission'] {
  if (typeof permission === 'string') {
    return permission
  }

  if (Array.isArray(permission)) {
    return permission.filter((item): item is string => typeof item === 'string')
  }

  return undefined
}

function assertUniqueRoutes(entries: RouteEntry[]): void {
  const paths = new Set<string>()
  const names = new Set<string>()

  entries.forEach((entry) => {
    if (paths.has(entry.routePath)) {
      throwDuplicateRoutePath(entry.routePath)
    }

    if (names.has(entry.name)) {
      throwDuplicateRouteName(entry.name)
    }

    paths.add(entry.routePath)
    names.add(entry.name)
  })
}

function inferPagesRoot(paths: string[]): string {
  const pagePaths = paths.filter(isPageFile).map(normalizePath)
  const explicitPagesRoot = pagePaths
    .map(path => path.match(/^(.*\/pages\/).*\.vue$/)?.[1])
    .find((root): root is string => Boolean(root))

  if (explicitPagesRoot) {
    return explicitPagesRoot
  }

  if (pagePaths.length === 0) {
    return './pages/'
  }

  return commonDirectory(pagePaths)
}

function commonDirectory(paths: string[]): string {
  const directories = paths.map(path => path.replace(/[^/]+\.vue$/, ''))
  const [firstDirectory = './pages/'] = directories
  const firstSegments = firstDirectory.split('/').filter(Boolean)
  const commonSegments = [...firstSegments]

  directories.slice(1).forEach((directory) => {
    const segments = directory.split('/').filter(Boolean)
    let index = 0

    while (index < commonSegments.length && commonSegments[index] === segments[index]) {
      index += 1
    }

    commonSegments.length = index
  })

  return `${firstDirectory.startsWith('./') ? './' : ''}${commonSegments.join('/')}/`
}

function normalizePagesRoot(root: string): string {
  const normalized = normalizePath(root)
  return normalized.endsWith('/') ? normalized : `${normalized}/`
}

function stripPagesRoot(filePath: string, pagesRoot: string): string {
  return filePath.startsWith(pagesRoot) ? filePath.slice(pagesRoot.length) : filePath
}

function stripExtension(filePath: string): string {
  return filePath.replace(/\.vue$/i, '')
}

function stripMetaExtension(filePath: string): string {
  return filePath.replace(/\.meta\.[cm]?[jt]s$/i, '')
}

function isPageFile(filePath: string): boolean {
  return /\.vue$/i.test(filePath)
}

function isMetaFile(filePath: string): boolean {
  return /\.meta\.[cm]?[jt]s$/i.test(filePath)
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

function resolveMeta(module: PageGlob[string]): AdminRouteMeta {
  return (isModuleObject(module) && 'default' in module ? module.default : module) as AdminRouteMeta
}

function resolveInlineRoute(module: PageGlob[string]): Partial<RouteRecordRaw> | undefined {
  return isModuleObject(module) && 'route' in module ? module.route : undefined
}

function resolvePageComponent(module: PageGlob[string]): RouteRecordRaw['component'] {
  if (typeof module === 'function') {
    return module as RouteRecordRaw['component']
  }

  if (isModuleObject(module) && 'default' in module) {
    return module.default as RouteRecordRaw['component']
  }

  return module as RouteRecordRaw['component']
}

function isModuleObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
