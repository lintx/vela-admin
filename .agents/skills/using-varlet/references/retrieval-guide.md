# Varlet 资料检索指南

## 版本与缓存

```powershell
node .agents/skills/using-varlet/scripts/sync-varlet-docs.mjs status
node .agents/skills/using-varlet/scripts/sync-varlet-docs.mjs update
```

缓存入口由 `status` 输出。查询脚本时从 manifest 读取当前发布目录，避免依赖内部唯一后缀：

```powershell
$manifest = Get-Content -LiteralPath '.agents/skills/using-varlet/.cache/manifest.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$cache = Join-Path '.agents/skills/using-varlet/.cache' $manifest.cachePath
```

`manifest.json` 提供版本、tag、官方 URL、同步时间和文件数量。相同版本不会重复下载；只有缓存缺失、安装版本变化或显式 `--force` 时同步。

## 组件文档与源码

以 `button` 为例：

```powershell
rg -n 'auto-loading|Auto Loading' (Join-Path $cache 'src/button/docs')
rg -n 'autoLoading|attemptAutoLoading' (Join-Path $cache 'src/button')
rg -n 'autoLoading' (Join-Path $cache 'types') (Join-Path $cache 'json')
```

常用路径：

- `src/<component>/docs/zh-CN.md`：中文示例、API、events、slots、主题变量。
- `src/<component>/props.ts`：props 类型与默认值。
- `src/<component>/*.vue`、`*.tsx`：真实运行行为。
- `src/<component>/__tests__/`：边界与兼容语义。
- `types/`：发布类型声明。
- `json/`：组件元数据。
- `varlet.config.mjs`：官网菜单与文档路由。

## 本地 npm 回退

官方缓存不可用时，从实际安装包检索：

```powershell
rg -n 'autoLoading' examples/admin/node_modules/@varlet/ui/es/button
rg -n 'auto-loading' examples/admin/node_modules/@varlet/ui/types examples/admin/node_modules/@varlet/ui/highlight
```

优先顺序：

1. 当前 tag 的 Markdown 与原始源码。
2. 本地已安装包的 ESM、类型和 web-types。
3. 只有前两者都未覆盖时，才查询官方仓库同 tag 的其他文件。

## 引用格式

结论至少包含：

```text
@varlet/ui 3.18.2
tag: v3.18.2
docs: packages/varlet-ui/src/button/docs/zh-CN.md
source: packages/varlet-ui/src/button/Button.vue
```

不要只给官网首页或 latest 分支链接。
