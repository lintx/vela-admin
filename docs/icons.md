# 图标

Vela Admin 提供统一的 `VaIcon` 组件。默认图标库为 Phosphor，默认字重为 `regular`，同时内置 Tabler 作为可选库和 fallback。

## 基础用法

```vue
<script setup>
import { VaIcon } from 'vela-admin/components'
</script>

<template>
  <VaIcon name="dashboard" />
  <VaIcon library="tabler" name="database" />
</template>
```

`name` 默认优先按 Vela Admin 语义图标解析。语义图标由框架维护，适合菜单、顶栏、标签页和示例页面等稳定场景。

## 路由图标

路由 `meta.icon` 使用同一套语义名：

```js
import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '图标',
  icon: 'icons',
  order: 35,
})
```

顶级菜单必须配置 `icon`。子级菜单可以不配置图标。

## 指定图标库

需要绕过语义映射时，可以显式指定库：

```vue
<VaIcon library="phosphor" name="users" />
<VaIcon library="tabler" name="database" />
```

在字符串场景中也可以使用前缀：

```js
export default defineRouteMeta({
  title: '数据',
  icon: 'tabler:database',
})
```

## 配置

默认配置：

```ts
icons: {
  defaultLibrary: 'phosphor',
  fallbackLibrary: 'tabler',
  phosphor: {
    weight: 'regular',
  },
}
```

可以通过 `defineAdminConfig()` 调整默认 Phosphor 字重：

```js
import { defineAdminConfig } from 'vela-admin/app'

export default defineAdminConfig({
  icons: {
    phosphor: {
      weight: 'bold',
    },
  },
})
```

## 语义图标清单

示例工程内置“图标”页面会展示所有语义图标、推荐用途、Phosphor 映射和 Tabler 映射。也可以在代码中读取：

```js
import { getAdminSemanticIconEntries } from 'vela-admin/icons'

const icons = getAdminSemanticIconEntries()
```

未知图标名会在开发环境输出警告，并渲染统一的 `question` fallback 图标；生产环境只渲染 fallback，不输出警告。
