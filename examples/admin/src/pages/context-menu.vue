<script setup>
import { computed, ref } from 'vue'

import {
  VaContextMenu,
  VaContextMenuGroup,
  VaContextMenuItem,
  VaIcon,
} from 'vela-admin/components'

const lastAction = ref('尚未选择')
const templateAction = ref('尚未选择')
const triggerAction = ref('尚未选择')
const placementAction = ref('尚未选择')
const placementValue = ref('target-center')
const plainAction = ref('尚未选择')
const customAction = ref('尚未选择')

const dataGroups = [
  [
    { value: 'refresh', text: '刷新', icon: 'refresh', shortcut: 'R' },
    { value: 'rename', text: '重命名' },
    { value: 'copy-link', text: '复制链接', icon: 'link' },
  ],
  [
    {
      value: 'move',
      text: '移动到',
      icon: 'tabs',
      children: [
        { value: 'move-dashboard', text: '控制台' },
        { value: 'move-system', text: '系统管理' },
        { value: 'move-permission', text: '权限示例' },
      ],
    },
    { value: 'pin', text: '固定', icon: 'pin' },
  ],
  [
    { value: 'delete', text: '删除', icon: 'close', danger: true, shortcut: 'Del' },
  ],
]

const customGroups = [
  [
    { value: 'preview', text: '预览', icon: 'view' },
    { value: 'duplicate', text: '复制副本', icon: 'copy' },
    { value: 'disabled', text: '已禁用操作', icon: 'lock', disabled: true },
  ],
  [
    {
      value: 'export',
      text: '导出',
      icon: 'download',
      children: [
        { value: 'export-csv', text: 'CSV' },
        { value: 'export-xlsx', text: 'Excel' },
        { value: 'export-json', text: 'JSON' },
      ],
    },
  ],
]

const placementOptions = [
  { label: '鼠标位置', value: 'cursor' },
  { label: '目标中心', value: 'target-center' },
  { label: '目标上方', value: 'target-top' },
  { label: '目标右上', value: 'target-top-right' },
  { label: '目标右侧', value: 'target-right' },
  { label: '目标右下', value: 'target-bottom-right' },
  { label: '目标下方', value: 'target-bottom' },
  { label: '目标左下', value: 'target-bottom-left' },
  { label: '目标左侧', value: 'target-left' },
  { label: '目标左上', value: 'target-top-left' },
]

const lastActionType = computed(() => lastAction.value.includes('delete') ? 'danger' : 'primary')
const dataCode = `<VaContextMenu :groups="dataGroups" @select="updateLastAction">
  <button>右键打开文件操作菜单</button>
</VaContextMenu>`
const templateCode = `<VaContextMenu trigger="click" @select="updateTemplateAction">
  <button>左键打开模板菜单</button>

  <template #menu>
    <VaContextMenuGroup>
      <VaContextMenuItem value="template-refresh" icon="refresh">刷新数据</VaContextMenuItem>
      <VaContextMenuItem value="template-rename">重命名视图</VaContextMenuItem>
    </VaContextMenuGroup>
    <VaContextMenuGroup>
      <VaContextMenuItem value="template-close" icon="close" danger>关闭视图</VaContextMenuItem>
    </VaContextMenuGroup>
  </template>
</VaContextMenu>`
const bothCode = '<VaContextMenu trigger="both" :groups="dataGroups" @select="updateTriggerAction" />'
const placementCode = `<var-select v-model="placementValue" :options="placementOptions" />

<VaContextMenu
  trigger="both"
  :placement="placementValue"
  :groups="dataGroups"
  @select="updatePlacementAction"
>
  <button>按当前 placement 打开</button>
</VaContextMenu>`
const plainCode = '<VaContextMenu :show-icon="false" :groups="dataGroups" @select="updatePlainAction" />'
const customCode = `<VaContextMenu :groups="customGroups" @select="updateCustomAction">
  <button>右键打开高级菜单</button>

  <template #item="{ item }">
    <span>
      <strong>{{ item.text }}</strong>
      <small v-if="item.disabled">不可用</small>
      <small v-else-if="item.children?.length">级联</small>
      <small v-else>操作</small>
    </span>
  </template>
</VaContextMenu>`

function updateLastAction(value) {
  lastAction.value = String(value)
}

function updateTemplateAction(value) {
  templateAction.value = String(value)
}

function updateTriggerAction(value) {
  triggerAction.value = String(value)
}

function updatePlacementAction(value) {
  placementAction.value = String(value)
}

function updatePlainAction(value) {
  plainAction.value = String(value)
}

function updateCustomAction(value) {
  customAction.value = String(value)
}
</script>

<template>
  <section class="admin-context-menu admin-page-span">
    <header class="admin-context-menu__header">
      <div>
        <p class="admin-context-menu__eyebrow">Menu</p>
        <h2>上下文菜单示例</h2>
        <span>展示数据驱动、模板组合、分组、级联、图标列、触发方式和自定义渲染。</span>
      </div>
    </header>

    <div class="admin-context-menu__grid">
      <section class="admin-context-menu__panel">
        <div class="admin-context-menu__panel-head">
          <VaIcon name="menu-2" />
          <div>
            <h3>数据驱动右键菜单</h3>
            <p>使用 groups 描述菜单项，空图标项会保留图标列，组之间自动插入分割线。</p>
          </div>
        </div>
        <VaContextMenu :groups="dataGroups" @select="updateLastAction">
          <button class="admin-context-menu__target" type="button">
            右键打开文件操作菜单
          </button>
        </VaContextMenu>
        <var-chip :type="lastActionType" plain size="small">选择：{{ lastAction }}</var-chip>
        <details class="admin-context-menu__source">
          <summary>查看源码</summary>
          <pre><code>{{ dataCode }}</code></pre>
        </details>
      </section>

      <section class="admin-context-menu__panel">
        <div class="admin-context-menu__panel-head">
          <VaIcon name="code" />
          <div>
            <h3>模板组合写法</h3>
            <p>使用 VaContextMenuGroup 和 VaContextMenuItem 直接组织菜单内容。</p>
          </div>
        </div>
        <VaContextMenu trigger="click" @select="updateTemplateAction">
          <button class="admin-context-menu__target" type="button">
            左键打开模板菜单
          </button>

          <template #menu>
            <VaContextMenuGroup>
              <VaContextMenuItem value="template-refresh" icon="refresh">刷新数据</VaContextMenuItem>
              <VaContextMenuItem value="template-rename">重命名视图</VaContextMenuItem>
            </VaContextMenuGroup>
            <VaContextMenuGroup>
              <VaContextMenuItem value="template-close" icon="close" danger>关闭视图</VaContextMenuItem>
            </VaContextMenuGroup>
          </template>
        </VaContextMenu>
        <var-chip plain size="small">选择：{{ templateAction }}</var-chip>
        <details class="admin-context-menu__source">
          <summary>查看源码</summary>
          <pre><code>{{ templateCode }}</code></pre>
        </details>
      </section>

      <section class="admin-context-menu__panel">
        <div class="admin-context-menu__panel-head">
          <VaIcon name="focus-2" />
          <div>
            <h3>定位配置</h3>
            <p>通过 placement 调整菜单相对鼠标或目标元素的位置。</p>
          </div>
        </div>
        <div class="admin-context-menu__placement">
          <var-select v-model="placementValue" :options="placementOptions" placeholder="选择定位方式" />
          <code>placement: {{ placementValue }}</code>
        </div>
        <VaContextMenu
          trigger="both"
          :placement="placementValue"
          :groups="dataGroups"
          @select="updatePlacementAction"
        >
          <button class="admin-context-menu__target" type="button">
            按当前 placement 打开
          </button>
        </VaContextMenu>
        <var-chip plain size="small">选择：{{ placementAction }}</var-chip>
        <details class="admin-context-menu__source">
          <summary>查看源码</summary>
          <pre><code>{{ placementCode }}</code></pre>
        </details>
      </section>

      <section class="admin-context-menu__panel">
        <div class="admin-context-menu__panel-head">
          <VaIcon name="cursor-click" />
          <div>
            <h3>双触发与级联</h3>
            <p>trigger="both" 同时支持左键和右键；包含 children 的项会展开子菜单。</p>
          </div>
        </div>
        <VaContextMenu trigger="both" :groups="dataGroups" @select="updateTriggerAction">
          <button class="admin-context-menu__target" type="button">
            左键或右键打开
          </button>
        </VaContextMenu>
        <var-chip plain size="small">选择：{{ triggerAction }}</var-chip>
        <details class="admin-context-menu__source">
          <summary>查看源码</summary>
          <pre><code>{{ bothCode }}</code></pre>
        </details>
      </section>

      <section class="admin-context-menu__panel">
        <div class="admin-context-menu__panel-head">
          <VaIcon name="text" />
          <div>
            <h3>无图标列</h3>
            <p>show-icon 为 false 时，整组菜单不再预留图标列，文字直接左对齐。</p>
          </div>
        </div>
        <VaContextMenu :show-icon="false" :groups="dataGroups" @select="updatePlainAction">
          <button class="admin-context-menu__target" type="button">
            右键打开无图标列菜单
          </button>
        </VaContextMenu>
        <var-chip plain size="small">选择：{{ plainAction }}</var-chip>
        <details class="admin-context-menu__source">
          <summary>查看源码</summary>
          <pre><code>{{ plainCode }}</code></pre>
        </details>
      </section>

      <section class="admin-context-menu__panel">
        <div class="admin-context-menu__panel-head">
          <VaIcon name="settings" />
          <div>
            <h3>自定义项、禁用项和快捷键</h3>
            <p>通过 #item slot 自定义菜单项正文，同时保留图标、禁用、危险和级联行为。</p>
          </div>
        </div>
        <VaContextMenu :groups="customGroups" @select="updateCustomAction">
          <button class="admin-context-menu__target" type="button">
            右键打开高级菜单
          </button>

          <template #item="{ item }">
            <span class="admin-context-menu__custom-item">
              <strong>{{ item.text }}</strong>
              <small v-if="item.disabled">不可用</small>
              <small v-else-if="item.children?.length">级联</small>
              <small v-else>操作</small>
            </span>
          </template>
        </VaContextMenu>
        <div class="admin-context-menu__summary">
          <var-chip plain size="small">选择：{{ customAction }}</var-chip>
          <code>#item="{ item }"</code>
        </div>
        <details class="admin-context-menu__source">
          <summary>查看源码</summary>
          <pre><code>{{ customCode }}</code></pre>
        </details>
      </section>
    </div>
  </section>
</template>

<style scoped>
.admin-page-span {
  grid-column: 1 / -1;
}

.admin-context-menu {
  display: grid;
  gap: 16px;
}

.admin-context-menu__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-context-menu__eyebrow {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-context-menu h2,
.admin-context-menu h3 {
  margin: 0;
  font-weight: 600;
}

.admin-context-menu h2 {
  font-size: 22px;
}

.admin-context-menu h3 {
  font-size: 17px;
}

.admin-context-menu__header span,
.admin-context-menu__panel p {
  display: block;
  margin: 8px 0 0;
  color: var(--color-on-surface-variant);
  line-height: 1.65;
}

.admin-context-menu__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.admin-context-menu__panel {
  display: grid;
  align-content: start;
  min-width: 0;
  padding-top: 16px;
  border-top: 1px solid var(--color-outline-variant);
  gap: 16px;
}

.admin-context-menu__panel-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 12px;
}

.admin-context-menu__panel-head > .va-icon {
  color: var(--color-primary);
  font-size: 26px;
}

.admin-context-menu__target {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  min-height: 72px;
  padding: 0 18px;
  color: var(--color-on-surface);
  font: inherit;
  text-align: center;
  cursor: context-menu;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px),
    linear-gradient(color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px),
    var(--color-surface-container-low, var(--color-body));
  background-size: 18px 18px;
  border: 1px dashed color-mix(in srgb, var(--color-primary) 35%, var(--va-admin-sidebar-border));
  border-radius: var(--card-border-radius, 4px);
}

.admin-context-menu__target:hover {
  background-color: var(--va-admin-menu-hover-bg);
}

.admin-context-menu code {
  display: inline-block;
  max-width: 100%;
  padding: 3px 6px;
  overflow: hidden;
  color: var(--color-on-surface-variant);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: color-mix(in srgb, var(--color-primary) 7%, transparent);
  border-radius: var(--card-border-radius, 4px);
}

.admin-context-menu__source {
  min-width: 0;
  border-top: 1px solid var(--va-admin-sidebar-border);
  padding-top: 10px;
}

.admin-context-menu__source summary {
  width: fit-content;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.admin-context-menu__source pre {
  max-width: 100%;
  min-width: 0;
  margin: 10px 0 0;
  overflow: auto;
}

.admin-context-menu__source code {
  display: block;
  min-width: max-content;
  padding: 10px 12px;
  font-family: Consolas, "Cascadia Mono", monospace;
  line-height: 1.6;
  white-space: pre;
}

.admin-context-menu__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.admin-context-menu__placement {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.admin-context-menu__custom-item {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.admin-context-menu__custom-item strong {
  min-width: 0;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-context-menu__custom-item small {
  color: var(--color-on-surface-variant);
  font-size: 11px;
}

@media (max-width: 900px) {
  .admin-context-menu__grid,
  .admin-context-menu__header {
    grid-template-columns: 1fr;
  }

  .admin-context-menu__grid {
    display: grid;
  }

  .admin-context-menu__header {
    display: grid;
  }

  .admin-context-menu__placement {
    grid-template-columns: 1fr;
  }
}
</style>
