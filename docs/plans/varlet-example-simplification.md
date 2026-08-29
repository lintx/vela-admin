# Varlet 知识沉淀与 Example 精简计划

## 状态

已完成（2026-07-30）。

## 目标

在不主动改变页面视觉与交互的前提下，减少 `examples/admin` 的参数、设置项、自定义结构和样式冗余，并建立可持续的 Varlet 查询与公开 API 弃用治理能力。

## 基本原则

1. 先建立知识与治理工具，再修改 example。
2. Varlet 官方组件能够等价覆盖时优先使用 Varlet。
3. 具有通用后台复用价值的能力优先下沉 `packages/framework`。
4. 不为减少行数或 class 数量机械重构。
5. `AdminLayout` 新接口必须向后兼容；旧公开 props、events 或配置字段先弃用，再按兼容规范移除。
6. 完整官方资料只保存在本地忽略缓存中，不提交 Git。
7. AI 仅在准备执行 commit 前运行一次弃用到期审计，不增加 Git hook、任务启动检查或后台定时任务。

## 批次一：项目级 Varlet Skill

### 目录与安装

- 新增 `.agents/skills/using-varlet/`。
- 保持 `SKILL.md` 精简，详细资料通过 `references/` 和本地缓存按需读取。
- 泛化 `scripts/install-codex-skill.js`，支持指定项目 skill 或全部项目 skill。
- 保留现有 `codex:install-skill`、`codex:link-skill` 默认行为，避免破坏已有使用方式。

### 官方资料同步

1. 读取 workspace 实际安装的 `@varlet/ui` 版本。
2. 映射到 `varletjs/varlet` 的 `v<version>` tag。
3. 下载该 tag 的官方源码归档，不抓取渲染后的官网 HTML。
4. 只提取 `packages/varlet-ui` 下的文档、源码、类型、JSON、站点配置和必要元数据。
5. 缓存按版本更新：缓存缺失或安装版本变化时同步；相同 tag 不做周期轮询。
6. 网络失败时回退到已有缓存或本地 npm 包中的类型、JSON 和编译产物。

### Skill 能力

- 根据需求选择 Varlet 原生组件、Vela Admin 封装或保留业务实现。
- 查询组件 props、events、slots、主题变量、默认样式和源码行为。
- 审查 Vue 页面中过度自定义的结构与 CSS。
- 区分等价替换、视觉变化、框架复用价值和一次性业务结构。
- 输出可追溯的官方 tag、文档路径或源码路径。

### 验证

- 在 skill 编写前运行不带 skill 的基线检索与选型场景。
- 编写后用同类场景验证组件检索、API 定位和替换判断。
- 运行 skill 结构校验、同步脚本测试和安装脚本测试。

## 批次二：弃用生命周期治理

### 中央注册表

新增机器可读注册表，至少记录：

- 稳定 ID。
- 包、API 类型、所属符号和源码位置。
- 弃用版本。
- 替代方案和迁移说明。
- 最早移除版本或移除条件。
- `active`、`removed` 等生命周期状态。

首个登记项为 `CreateTabsServiceOptions.homePath`。

### 一致性与用户文档

- 源码 `@deprecated` 注释携带注册表 ID。
- 校验脚本双向检查注册表与源码注释，拒绝漏登记、重复 ID 和提前删除。
- 从注册表生成用户可读的 `docs/deprecations.md`。
- 将严格一致性检查接入测试与 `release:verify`。
- commit 前审计只报告已满足移除条件的 active 项，不自动删除、不阻断普通开发。

### 规范沉淀

- 更新兼容性与发布规范。
- 新增 ADR 记录中央注册表、移除条件和审计时机。
- `vela-admin-maintainer` 增加“AI commit 前运行弃用审计”的轻量规则。

## 批次三：Example 审计与精简

### 审计输出

先只读审计全部 example Vue 文件和 `AdminLayout` 调用面，每个候选项归入以下一类：

1. 未使用或重复，可直接删除。
2. Varlet 原生组件可视觉等价替换。
3. 已有 Vela Admin 能力可复用。
4. 具有跨页面或通用后台价值，应下沉 framework。
5. 保留现状；替换收益不足或会改变视觉、语义、可访问性。

审计不设置机械的行数、props 数量或 class 数量目标。

### AdminLayout 接口

- 优先按 layout、theme、tabs 等内聚领域收拢对象接口，减少调用方逐项绑定。
- 显式定义新旧接口同时存在时的优先级。
- 保持 `AdminLayout` 为可组合、可受控组件，不引入全能 `AdminAppShell`。
- 旧公开 props/events 保留行为并登记弃用；不在当前 minor 直接删除。

### 页面结构与样式

- 只有在 Varlet 组件默认结构能够保持当前视觉时才替换。
- 仅用于布局的 wrapper 优先评估 `var-space`、`var-row`、`var-col`、`var-cell`、`var-list`、`var-card` 等原生能力。
- 通用交互优先下沉 framework；纯业务展示保持在 example。
- 删除 class 前同时检查模板引用、动态 class、测试选择器、脚本选择器和 `:deep()`。
- 不因统一风格顺手改动页面配色、间距、圆角、排版或信息层级。

### 验收

- framework：定向测试、`pnpm --filter vela-admin test` 和必要的 build。
- example：`pnpm --filter vela-admin-example build`。
- create：涉及模板边界时运行 `pnpm run test:create`。
- 浏览器：使用本机 Chrome 检查关键页面、375/768/1024/1440 视口、浅色/深色主题和主要布局模式。
- 对视觉等价调整保留修改前后截图或可复现检查记录。

### 2026-07-30 审计记录

本轮使用项目级 `using-varlet`，基于安装版本 `@varlet/ui 3.18.2`、官方 tag `v3.18.2` 完成 `examples/admin/src` 全量 Vue 文件和 `AdminLayout` 调用面只读审计。

| 候选 | 结论 | 证据与原因 |
| --- | --- | --- |
| `App.vue` 的 `headerToolsRef`、`adminSettings`、品牌 class | 保留 | 变量在模板、事件或 scoped 样式中有引用；品牌 class 同时覆盖展开/收缩 logo 的布局，不能按名称判断未使用。 |
| `AdminLayout` 的 `sidebarCollapsedWidth`、`sidebarIconSize`、`sidebarCollapsedIconSize`、`mobileBreakpoint`、`layoutFeatures`、主题与标签 props/events | 保留 | 分别被 Side/Top/Mixed layout、响应式媒体查询、设置抽屉、主题预览和标签操作实际消费；删除会改变公开 API 或视觉行为。 |
| `AdminSettingsDrawer` 的 `sidebarCollapsedWidth`、`sidebarCollapsedIconSize`、`expandedParentBackground` | 删除 | 抽屉只声明但不转发这些 props，也不发出对应事件；布局组件仍保留并继续消费公开设置。 |
| `App.vue` 的 `app-name="Vela Admin"` | 删除 | `AdminLayout` 默认值已是同一字符串，且 logo 插槽已覆盖展开/收缩品牌内容。 |
| 页面中的 `var-cell`、`var-list`、`var-space`、`var-row/col`、`var-result` | 保留 | 当前结构承担移动端布局、状态 class、菜单交互或视觉间距；Varlet 原生组件无法在不改变 DOM/视觉的前提下等价替换。 |
| context-menu、sortable、icons、permission、用户移动卡片等自定义 class | 保留 | 属于一次性演示结构、拖动状态、响应式断点或可访问性/测试选择器，不是死样式。 |

本轮没有对 `AdminLayout` 做对象化新 API 或批量 class 重构：这些调整会扩大兼容面或改变页面视觉，收益不足以抵消风险。

## 风险控制

1. 官方文档结构变化：同步脚本使用白名单、tag 和内容校验，失败时保留旧缓存。
2. 公开 API 冲突：新增兼容测试并明确新旧接口优先级。
3. 过度抽象：framework 下沉必须证明跨页面或后台通用价值。
4. 视觉漂移：高风险替换不纳入本轮，浏览器验收发现差异时回退候选实现。
5. 计划膨胀：三个批次独立 checkpoint 和候选 patch，前一批通过后才进入下一批。

## 收尾条件

- [x] Varlet skill 可通过项目链接安装并完成版本化资料查询。
- [x] 弃用注册表、文档、校验与 commit 前审计可用。
- [x] Example 全量审计完成并处理所有高置信度冗余项。
- [x] 公开 API 保持向后兼容，新增弃用项均完成登记。
- [x] 对应测试、构建和浏览器验收通过。
- [x] 过程性结论已合并到稳定规范、用户文档或 ADR。
- [x] 计划保留为跨批次设计与审计记录，并标记完成日期。
