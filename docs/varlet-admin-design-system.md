# Varlet Admin 设计系统

## 目录

- [1. 设计目标](#1-设计目标)
- [2. 主题基线](#2-主题基线)
- [3. 动态主题生成器](#3-动态主题生成器)
- [4. 组件选型](#4-组件选型)
- [5. 圆角规则](#5-圆角规则)
- [6. 侧栏](#6-侧栏)
- [7. 收缩态浮层菜单](#7-收缩态浮层菜单)
- [8. 滚动条](#8-滚动条)
- [9. 顶栏](#9-顶栏)
- [10. 标签栏](#10-标签栏)
- [11. 设置中心](#11-设置中心)
- [12. 页面模式、可访问性和验收](#12-页面模式可访问性和验收)

## 1. 设计目标

Varlet Admin 的视觉目标是“Varlet 官网式 Material Design 后台”，不是传统重色块后台，也不是大圆角卡片堆叠页面。

关键词：

- 克制。
- 清晰。
- Material Design 3 默认，Material Design 2 可切换。
- 功能密度接近后台系统。
- 主题色作为状态层和重点操作，不大面积铺底。
- 组件优先继承 Varlet 视觉，不重复发明组件体系。
- 示例工程只使用 Varlet 或 Vela Admin 组件组织页面。

## 2. 主题基线

默认主题：

- 浅色：`md3Light`
- 深色：`md3Dark`

可切换主题：

- `md2Light`
- `md2Dark`

主题切换位置：

- 设置抽屉。
- 主题生成器页面。
- 可选的顶栏快捷入口。

主题切换必须影响：

- Varlet 组件 token。
- 页面背景。
- 侧栏。
- 顶栏。
- 标签栏。
- 菜单 state layer。
- 滚动条。
- 浮层。

## 3. 动态主题生成器

主题生成器是框架功能的一部分，不是示例页装饰。

能力：

- 选择源颜色。
- 上传图片并提取主色。
- 生成 light/dark 两套主题。
- 选择 MD3/MD2 基础模式。
- 预览真实后台组件和布局状态。
- 应用到当前页面。
- 重置为默认主题。
- 开发者模式下复制 CSS variables 或 JSON token。

主题生成器不是高频入口，不放主导航。默认从设置中心进入，作为高级主题工具使用。

主流程只保留：

- 主题版本。
- 来源：颜色或图片。
- 源颜色或图片取色。
- 生成结果色板。
- 浅色和深色预览。
- 仅预览。
- 应用主题。
- 重置默认。

开发者选项：

- 默认只在框架示例和开发模式展示。
- 普通业务系统默认隐藏，可通过配置打开。
- 提供复制 CSS variables 和复制 JSON token。
- 不显示解释性提示文案，只保留复制成功/失败反馈。

预览区要求：

- 不能为空白占位。
- 必须使用真实 Vue + Varlet 组件渲染。
- 至少包含侧栏、顶栏、标签页、按钮、输入框、表面容器和状态色。
- 同一个源颜色生成的浅色和深色主题都必须可预览。

推荐实现基础：

- 使用 `@material/material-color-utilities` 生成 Material Design 3 动态色系。
- 图片取色可先使用该库能力；如果实际 API 不满足，再评估补充轻量取色库。
- 不手写完整 HCT/tonal palette 算法。

## 4. 组件选型

框架开发需要新增 UI 或功能时，必须先检查 Varlet 是否已有直接可用的组件。若 Varlet 组件通过轻量封装、样式定制或组合即可满足需求，应优先使用 Varlet。

当 Varlet 无法合理覆盖需求时，可以评估公开包。推荐公开包前应确认：

- 许可证与项目发布兼容。
- 维护状态健康。
- 体积和依赖成本可接受。
- API 不会和 Vela Admin 的公开边界强耦合。

只有 Varlet 和合适公开包都无法满足时，才自行实现。自行实现的组件应保持框架职责清晰，避免把一次性业务 UI 写入框架核心。

示例工程开发应全部使用 Varlet 或 Vela Admin 已提供的组件和能力。如果示例中出现无法通过二者自然实现的通用能力，应优先评估是否沉淀为 Vela Admin 的可复用组件。

Token 映射：

```txt
source color
  -> Material dynamic scheme
  -> Varlet theme variables
  -> Admin semantic variables
```

Admin semantic variables 示例：

```css
:root {
  --va-admin-sidebar-bg: var(--color-body);
  --va-admin-sidebar-border: var(--color-outline-variant);
  --va-admin-menu-text: var(--color-on-surface-variant);
  --va-admin-menu-active-text: var(--color-on-primary-container);
  --va-admin-menu-indicator: var(--color-primary);
  --va-admin-menu-active-bg: color-mix(in srgb, var(--color-primary) 11%, transparent);
  --va-admin-menu-hover-bg: color-mix(in srgb, var(--color-primary) 6%, transparent);
  --va-admin-menu-expanded-bg: color-mix(in srgb, var(--color-primary) 4%, transparent);
}
```

## 5. 圆角规则

Varlet Admin 不使用大圆角作为后台框架主视觉。

默认规则：

- 侧栏：无圆角。
- 顶栏：无圆角。
- 标签栏容器：无圆角。
- 主内容布局容器：不做外层大卡片。
- 菜单项 active：MD3 使用足球场形状背景；MD2 使用整行背景和左侧指示条。
- 浮层、弹窗、按钮、输入框、卡片：遵循 Varlet 组件自身圆角。

如果业务需要更圆润的风格，应通过 token 配置，不改变默认风格。

## 6. 侧栏

### 6.1 背景

侧栏默认使用 surface/body 色，不直接使用 `primary` 或 `primary-container` 铺满。

默认：

```css
--va-admin-sidebar-bg: var(--color-body);
--va-admin-sidebar-border: var(--color-outline-variant);
```

避免：

- 大面积 primary 背景。
- 大面积 primary-container 背景。
- 重阴影侧栏。
- 粉紫背景铺满页面。

### 6.2 菜单状态

菜单状态分为四类：

- normal：普通状态。
- hover：鼠标悬浮。
- expanded：展开路径上的父级。
- active：当前页面。

默认表现：

```txt
normal   -> surface 背景，on-surface-variant 文本
hover    -> primary 6% state layer
expanded -> primary 4% state layer + active 文本色
active   -> MD3 使用足球场形状背景；MD2 使用 primary 11% state layer + 左侧 4px 指示条
```

父级菜单背景作为配置项：

```ts
expandedParentBackground: boolean
expandedParentStateOpacity: number
```

默认开启轻背景，允许业务关闭，关闭后父级只改变文字和图标色。

### 6.3 当前页高亮

当前页只允许一个 active 项。

active 规则：

- MD3 默认使用足球场形状背景，不显示左侧指示条。
- MD2 背景覆盖完整菜单行，左侧 4px 指示条贴边，不留下空隙。
- MD2 指示条使用 `--va-admin-menu-indicator`。
- 文本和图标使用 active 文本色。

实现注意：

- 不用 `border-left` 导致背景缺一块。
- MD2 指示条应使用 `::before` 或绝对定位。

### 6.4 多级菜单

至少支持四级菜单。

层级规则：

- 一级菜单必须配置图标。
- 二级及以下图标可选。
- 每级固定缩进，默认每级增加 26px。
- 多级菜单不使用嵌套卡片。
- 多级菜单不使用大圆角容器。
- 展开路径通过轻背景和文本色表达。

一级图标规则：

- 一级菜单强制有图标，保证收缩态视觉。
- 开发环境缺失图标时输出诊断。
- 可配置 fallback 默认图标，但推荐让业务显式配置。

### 6.5 展开态默认尺寸

```ts
sidebarWidth: 272
sidebarMenuItemHeight: 44
sidebarIconSize: 22
```

这些都是默认值，必须可配置。

### 6.6 收缩态默认尺寸

用户确认的默认审美值：

```ts
sidebarCollapsedWidth: 56
sidebarCollapsedIconSize: 26
sidebarMenuItemHeight: 44
```

规则：

- 收缩态行高和展开态一致。
- 收缩态只是隐藏文字并放大一级图标。
- 不把收缩侧栏改造成更高的 navigation rail。
- 不因为图标变大而拉高菜单项。
- 收缩态 active 仍使用整行背景和左侧指示条。

## 7. 收缩态浮层菜单

收缩态只显示一级图标。一级菜单 hover 或 click 后显示浮层子菜单。

浮层规则：

- 背景使用 surface/body。
- 1px outline。
- 轻阴影。
- 不使用大圆角。
- 保留多级缩进和 active 指示。
- 如果内容超出高度，浮层内部独立滚动。

浮层出现方式需可配置：

```ts
collapsedSubMenuTrigger: 'hover' | 'click'
```

默认可先使用 `hover`，移动端或触控环境使用 `click`。

## 8. 滚动条

侧栏滚动条默认采用 thin 常规可见方案。

默认规则：

```ts
scrollbar: 'thin'
scrollbarWidth: 8
scrollbarThumbOpacity: 0.26
scrollbarThumbHoverOpacity: 0.42
```

行为：

- Logo/Header 固定。
- 菜单区域独立滚动。
- 滚动条不隐藏。
- thumb 使用 `on-surface-variant` 低透明度。
- hover 时略增强。
- 收缩态浮层子菜单使用同一滚动条 token。

可配置：

```ts
scrollbar: 'thin' | 'hover' | 'native'
```

默认选择 `thin`，不是 `hover`，因为后台菜单滚动需要可发现性。

## 9. 顶栏

顶栏默认 sticky。

规则：

- 高度默认 56px。
- 背景使用 body/surface。
- 底部 1px outline。
- 不使用重阴影。
- 菜单折叠按钮使用图标按钮。
- 顶栏工具区通过插槽扩展。
- 左侧显示折叠按钮、当前页面标题和可选面包屑。
- 右侧显示搜索入口、明暗/主题快捷入口、设置入口和用户菜单。
- 窄屏隐藏面包屑，搜索入口折叠为图标按钮。
- 搜索菜单、主题切换、用户信息、设置入口都应是可组合能力。

### 9.1 命令面板搜索

顶部不常驻长搜索输入框。默认使用命令面板式搜索。

规则：

- 点击搜索按钮或按 `Ctrl+K` / `Cmd+K` 打开。
- 快捷键可配置或关闭。
- 搜索菜单、页面标题、路径和权限码。
- 无权限菜单不出现在搜索结果中。
- 支持 `ArrowUp`、`ArrowDown`、`Enter`、`Escape`。
- 移动端点击打开并自动聚焦输入框。
- 面板使用 surface、outline 和轻阴影，不使用大圆角。

## 10. 标签栏

标签栏提供常见后台多页签操作能力，视觉遵循 Varlet。

能力：

- 当前标签高亮。
- 关闭当前。
- 关闭其他。
- 关闭左侧。
- 关闭右侧。
- 关闭全部。
- 刷新当前页。
- 固定标签。

视觉：

- 不做浏览器标签页拟物。
- 使用贴合标签、轻边线和 state layer。
- 标签栏高度默认 40px。
- 标签项占满标签栏高度，不做独立小按钮。
- 标签之间不留 gap，使用 1px 分割线。
- 当前标签使用 primary 8% state layer。
- 当前标签底部使用 2px 指示条。
- 指示条需要覆盖相邻分割线，避免视觉上短 1px。
- 相邻区域之间只允许一条分隔线，默认由左侧区域提供 `border-right`。
- 不做浏览器拟物标签。
- 不做大圆角胶囊。
- 当前项清晰但不重色块。

标签栏边框规则：

- 标签栏整体只有底部 1px outline。
- 左滚动按钮使用 `border-right`，标签容器不再额外加 `border-left`。
- 最后一个标签项保留 `border-right`，用于分隔右滚动按钮。
- 右滚动按钮不额外加 `border-left`，避免双边框。
- 中间 active 标签的底部指示条使用 `left: -1px; right: -1px; height: 2px`。
- 第一个可见标签 active 时左侧需要裁切，最后一个可见标签 active 时右侧需要裁切，避免覆盖滚动按钮边界。

更多操作：

- 刷新当前。
- 关闭当前。
- 关闭其他。
- 关闭左侧。
- 关闭右侧。
- 关闭全部。
- 固定标签。
- 固定标签不被关闭全部移除。

## 11. 设置中心

设置中心默认使用右侧分组抽屉。

规则：

- 桌面宽度默认 380px。
- 小屏占满宽度。
- 普通设置按分组纵向排列，不在抽屉内再套顶部标签页。
- 复杂主题生成器从设置中心打开独立面板或页面。
- 控件正式实现应尽量使用 Varlet 组件，不使用临时占位元素替代真实控件。
- 布局模式使用分段控制。
- 布尔项使用 `var-switch`。
- 尺寸项使用 `var-slider`，必要时搭配数值输入。
- 操作按钮使用 `var-button`。
- 底部固定操作区包含重置和应用。
- 应用、重置、复制等操作需要 loading、success、error 反馈。
- 所有输入必须有标签，支持键盘访问和可见 focus。

## 12. 页面模式、可访问性和验收

页面级模式、可访问性要求和视觉验收清单见 [页面模式与视觉验收](varlet-admin-page-patterns.md)。
