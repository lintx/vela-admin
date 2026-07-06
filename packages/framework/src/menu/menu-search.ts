import type { AdminMenuItem } from './create-menu-service'

export interface AdminMenuSearchResult {
  path: string
  title: string
  icon?: string
  permission?: string | string[]
  parents: string[]
}

export function searchAdminMenus(menus: AdminMenuItem[], keyword: string): AdminMenuSearchResult[] {
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (!normalizedKeyword) {
    return []
  }

  const results: AdminMenuSearchResult[] = []
  walkMenus(menus, [], (menu, parents) => {
    const searchable = [
      menu.title,
      menu.path,
      Array.isArray(menu.permission) ? menu.permission.join(' ') : menu.permission,
      ...parents,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (menu.navigable && searchable.includes(normalizedKeyword)) {
      results.push({
        path: menu.path,
        title: menu.title,
        icon: menu.icon,
        permission: menu.permission,
        parents,
      })
    }
  })

  return results
}

function walkMenus(
  menus: AdminMenuItem[],
  parents: string[],
  visit: (menu: AdminMenuItem, parents: string[]) => void,
) {
  menus.forEach((menu) => {
    visit(menu, parents)
    walkMenus(menu.children, [...parents, menu.title], visit)
  })
}
