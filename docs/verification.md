# 验收记录

验收目标是确认 Vela Admin 在真实 Vue + Varlet 实现上可运行、可构建、关键页面可访问且响应式无明显布局问题。

## 命令验证

当前通过的命令：

```sh
pnpm run test
pnpm run build
pnpm run pack:framework
pnpm run pack:create
```

推荐结果：

- `pnpm run test`：框架测试和 create 包测试通过。
- `pnpm run build`：框架包和示例工程构建通过。
- `pnpm run pack:framework`：framework 包发布内容检查通过。
- `pnpm run pack:create`：create 包发布内容检查通过，并确认未留下临时 `template` 目录。

## 浏览器验收

使用本机 Chrome DevTools Protocol 自动检查过：

- 375px。
- 768px。
- 1024px。
- 1440px。

覆盖页面：

- `/login`
- `/`
- `/system/user`
- `/system/user/1001`
- `/permission/button`
- `/demo/level1/level2/level3/leaf`
- `/exception/403`
- `/exception/404`
- `/exception/500`

检查项：

- 页面关键文本存在。
- 无横向滚动。
- 登录页品牌图加载。
- 异常页 403/404/500 插图加载。
- 顶栏深色/浅色按钮会立即应用主题 CSS variables。

## 仍需人工复核

自动验收无法完全替代人工高保真检查，发布前仍建议人工复核：

- MD3 Light / Dark。
- MD2 Light / Dark。
- 设置中心抽屉。
- 命令面板搜索。
- 标签页溢出和关闭操作。
- 主题生成器的图片取色、导出和局部预览。
- 移动端抽屉菜单。
- 收缩侧栏浮层菜单。

## 端口约束

当前示例预览端口约定为：

```txt
127.0.0.1:5175
```

验收时应避免占用 `5173`、`5174` 和 `519x` 端口。最近一次检查只监听 `127.0.0.1:5175`。
