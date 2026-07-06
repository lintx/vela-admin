export interface AdminRouteMeta {
  title?: string
  icon?: string
  permission?: string | string[]
  order?: number
  keepAlive?: boolean
  hidden?: boolean
  activeMenu?: string
  [key: string]: unknown
}

export function defineRouteMeta<T extends AdminRouteMeta>(meta: T): T {
  return meta
}
