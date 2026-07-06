# 主题说明

Vela Admin 主题系统由三层组成：

1. Varlet 原生主题：MD2 / MD3、Light / Dark。
2. Material 动态主题：基于源颜色或图片生成。
3. Admin token：侧栏、菜单、标签栏、滚动条和布局语义变量。

## 默认主题

```ts
theme: {
  base: 'md3Light',
  mode: 'light',
  sourceColor: '#6750A4',
}
```

支持的基础主题：

- `md3Light`
- `md3Dark`
- `md2Light`
- `md2Dark`

## 应用主题

```js
import {
  applyAdminTheme,
  createAdminTheme,
  createSourceColorAdminTheme,
} from 'vela-admin/theme'

applyAdminTheme(createAdminTheme())

applyAdminTheme(createSourceColorAdminTheme({
  sourceColor: '#6750A4',
  themeBase: 'md3Light',
  themeMode: 'light',
}))
```

## 主题生成器

`AdminThemeGenerator` 提供：

- 源颜色输入。
- 图片取色。
- MD2 / MD3 切换。
- Light / Dark 预览。
- 真实后台组件预览。
- 应用、重置和预览。
- CSS variables 和 JSON token 导出。

示例工程开启了开发者导出：

```vue
<AdminThemeGenerator developer-export />
```

普通业务系统默认建议关闭 `developerTools` / `developer-export`。

## Token 设计

Admin token 通过 CSS variables 注入：

```css
--va-admin-sidebar-bg
--va-admin-sidebar-border
--va-admin-menu-active-bg
--va-admin-menu-hover-bg
--va-admin-menu-indicator
```

原则：

- 主题色只作为状态层、指示条和重点操作使用。
- 不用 primary 大面积铺满侧栏、页面或设置中心。
- 动态主题只覆盖强调色相关变量，避免污染大面积底色。
