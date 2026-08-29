# 弃用 API

本文件由 `deprecations.json` 生成，请勿手工编辑。

## VA-DEP-001: `CreateTabsServiceOptions.homePath`

- 包：`vela-admin`
- API 类型：`option`
- 弃用版本：`0.3.0`
- 状态：`active`
- 源码：`packages/framework/src/tabs/create-tabs-service.ts`
- 替代方案：使用 fixedTabs 显式传入首页标签。
- 迁移方式：删除 homePath，并把固定首页作为 fixedTabs 的首项传入。
- 最早移除版本：`1.0.0`
- 移除条件：仅在下一个 major、调用方完成迁移且至少经过一个稳定版本后移除。
