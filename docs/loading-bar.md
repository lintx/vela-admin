# 页面进度条

Vela Admin 基于 Varlet 的 `LoadingBar` 提供页面顶部进度条能力。

## 自动控制

`createAdminRouter()` 默认会在路由导航开始时调用 `start()`，导航完成后调用 `finish()`；发生未处理的导航异常时调用 `error()`。

```js
const router = createAdminRouter({
  pages: pagesMap,
})
```

如果业务工程不需要自动进度条，可以关闭：

```js
const router = createAdminRouter({
  pages: pagesMap,
  loadingBar: false,
})
```

也可以传入实现了 `AdminLoadingBarService` 的自定义服务，用于接入自己的展示层或测试替身。

## 手动控制

在页面或业务服务中使用共享加载条：

```js
import { useAdminLoadingBar } from 'vela-admin/loading-bar'

const loadingBar = useAdminLoadingBar()

async function loadData() {
  loadingBar.start()

  try {
    await fetchData()
    loadingBar.finish()
  } catch (error) {
    loadingBar.error()
    throw error
  }
}
```

API 包含：

- `start()`：开始显示加载条。
- `finish()`：完成并隐藏加载条。
- `error()`：以错误态完成加载并隐藏。
- `setDefaultOptions(options)`：设置颜色、高度、顶部偏移和结束延时。
- `resetDefaultOptions()`：恢复 Varlet 默认配置。

## 样式配置

```js
loadingBar.setDefaultOptions({
  color: 'var(--color-primary)',
  errorColor: 'var(--color-danger)',
  height: '4px',
  top: 0,
  finishDelay: 180,
})
```

`vela-admin/loading-bar` 同时导出 `createAdminLoadingBar()`、`adminLoadingBar`、`useAdminLoadingBar()` 以及对应的 `AdminLoadingBarOptions`、`AdminLoadingBarService` 类型。

