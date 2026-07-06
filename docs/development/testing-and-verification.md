# 测试与验收规范

## 常用命令

根级命令：

```sh
pnpm run build
pnpm run test
pnpm run test:create
pnpm run pack:framework
pnpm run pack:create
```

包级命令：

```sh
pnpm --filter vela-admin test
pnpm --filter vela-admin build
pnpm --filter vela-admin-example build
```

## 按修改范围选择验证

只改文档：

1. 检查 Markdown 链接。
2. 查看 `git diff --stat`，确认没有业务代码或生成物。

改 framework 运行逻辑：

1. 运行 `pnpm --filter vela-admin test`。
2. 必要时运行 `pnpm --filter vela-admin build`。
3. 如果影响示例工程，继续运行 `pnpm --filter vela-admin-example build`。

改 example：

1. 运行 `pnpm --filter vela-admin-example build`。
2. 涉及 UI、布局、主题或路由时，启动示例工程做浏览器验收。

改 create 包或模板同步：

1. 运行 `pnpm run test:create`。
2. 涉及发布包内容时运行 `pnpm run pack:create`。

改发布边界：

1. 运行 `pnpm run pack:framework`。
2. 运行 `pnpm run pack:create`。

## UI 验收

涉及布局、主题、菜单、标签页、设置中心或基础业务页面时，至少检查：

1. 375px 手机宽度。
2. 768px 平板宽度。
3. 1024px 小桌面。
4. 1440px 桌面。
5. 浅色 MD3。
6. 深色 MD3。
7. 侧栏展开和收缩。
8. 多级菜单。
9. 设置中心。
10. 登录页和错误页。

无法完成浏览器验收时，必须在总结中明确说明原因和剩余风险。

## 验收记录

重要发布前检查或阶段性验收可以记录到 `docs/verification.md`。普通开发任务只需在最终说明中列出已运行命令和结果。
