# Changelog

项目版本变更记录。版本号遵循语义化版本规范。

## [0.4.0] - 2026-10-05

### Added

- 新增基于 Varlet LoadingBar 的页面进度条，支持路由自动控制和手动 API 控制。
- 新增页面进度条例子与对应的 `vela-admin/loading-bar` 公共入口。
- 补充系统管理、业务管理、监控中心和开发工具菜单规划骨架。

### Changed

- 重组组件示例目录，将菜单、图标、权限按钮、上下文菜单、拖动排序和异常页统一归入组件示例。
- 将内容管理菜单压平为单页 TODO，避免无实际功能的多级菜单。

## [0.3.1] - 2026-10-05

### Added

- 新增主题联动的 SVG 异常插画，覆盖 403、404、500 页面。
- 提供模块化应用控制器，拆分设置、标签页和主题控制职责。
- 新增 `vela-admin/icons/phosphor` 子路径入口，支持按需使用 Phosphor 图标。

### Changed

- 重做示例工程异常页的视觉层级、全宽构图和大小屏响应式布局，继续使用 Varlet `var-result`。
- 精简示例布局，使用 Varlet `Row`/`Col` 重构图标、仪表盘和上下文菜单页面。
- 统一 CI 使用的 pnpm 与 Node 版本，补充 framework 类型检查和源码消费指引。
- 更新在线演示地址为 `demo.vela.pub`，并同步两个发布包 README 的演示入口。
- 同步 `vela-admin` 与 `create-vela-admin` 版本至 `0.3.1`。

### Fixed

- 修复高 DPI 场景下异常页布局、主题预览和部分框架类型问题。
- 缓存 `VaSortable` 热路径查询，降低重复渲染时的计算开销。

### Removed

- 移除不再使用的 403、404、500 PNG 插画资源。

## [0.3.0] - 2026-07-12

### Added

- 将主题切换动画下沉到 framework，支持自动切换和显式目标模式。
- 增加 Cloudflare Workers Static Assets 部署配置和 SPA history fallback。
- 补充主题切换、设置中心和部署配置回归测试。

### Fixed

- 修复高 DPI 缩放下主题过渡动画的圆心与半径计算。

## [0.2.0] - 2026-07-09

### Added

- 新增 `VaSortable` 排序组件及排序示例页面。
- 增强标签页固定、拖动和关闭行为。
- 扩展路由、菜单、权限和图标相关能力及测试覆盖。
- 增加 GitHub Pages 预览部署配置。

## [0.1.1] - 2026-07-07

### Changed

- 补充 npm 发布包元数据和包 README 使用说明。
- 精简高频维护文档，增加 Vela Admin 项目维护 skill。
- 修正首次 npm 发布时的 token 使用方式。

## [0.1.0] - 2026-07-06

### Added

- 完成 Vela Admin framework 与 `create-vela-admin` 生成器的首个发布版本。
