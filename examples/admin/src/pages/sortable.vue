<script setup>
import { ref } from 'vue'
import { VaIcon, VaSortable } from 'vela-admin/components'

const verticalItems = ref([
  { id: 'plan', title: '需求梳理', desc: '确认范围、限制和验收口径' }, { id: 'design', title: '方案设计', desc: '拆分组件职责与交互状态' },
  { id: 'build', title: '实现开发', desc: '完成组件与业务接入' }, { id: 'verify', title: '测试验收', desc: '运行自动化和浏览器检查' },
])

const tagItems = ref([
  { id: 'dashboard', title: '控制台', fixed: true, size: 'sm' }, { id: 'users', title: '用户与组织权限', size: 'lg' },
  { id: 'roles', title: '角色', size: 'xs' }, { id: 'settings', title: '系统设置中心', size: 'md' },
  { id: 'audit', title: '审计日志', size: 'sm' },
])

const cardItems = ref([
  { id: 'profile', title: '资料卡片', type: '基础', shape: 'wide' }, { id: 'security', title: '安全策略', type: '权限', shape: 'short' },
  { id: 'audit', title: '审计日志', type: '数据', shape: 'tall' }, { id: 'notice', title: '通知中心', type: '消息', shape: 'compact' },
  { id: 'report', title: '统计报表', type: '数据', shape: 'wide' }, { id: 'message', title: '消息订阅', type: '消息', shape: 'short' },
])

const placeholderItems = ref([
  { id: 'today', title: '今日待办', status: '8 项' }, { id: 'week', title: '本周计划', status: '14 项' },
  { id: 'month', title: '月度目标', status: '5 项' },
])

const selectedItems = ref([
  { id: 'users', title: '用户权限' }, { id: 'roles', title: '角色权限' },
  { id: 'menus', title: '菜单权限' }, { id: 'logs', title: '审计权限' },
])

const lockedItems = ref([
  { id: 'north', title: '北区概览' }, { id: 'core', title: '核心指标' },
  { id: 'south', title: '南区概览' }, { id: 'export', title: '导出队列' },
])

const ruleItems = ref([
  { id: 'draft', title: '草稿' }, { id: 'review', title: '审核' },
  { id: 'publish', title: '发布' }, { id: 'archive', title: '归档' },
])

const backlogItems = ref([
  { id: 'api', title: '接口联调' }, { id: 'theme', title: '主题验收' }, { id: 'docs', title: '文档补充' },
])
const doingItems = ref([{ id: 'tabs', title: '标签页拖动' }, { id: 'icons', title: '图标整理' }]), blockedItems = ref([{ id: 'release', title: '发布冻结' }])

const selectedDemoKeys = ref(['users', 'roles']), lockedDemoKeys = ['core']
const listMap = {
  vertical: verticalItems,
  tags: tagItems,
  cards: cardItems,
  placeholder: placeholderItems,
  selected: selectedItems,
  locked: lockedItems,
  rules: ruleItems,
  backlog: backlogItems,
  doing: doingItems,
  blocked: blockedItems,
}

function handleReorder(listId, payload) {
  const target = listMap[listId]
  if (!target) {
    return
  }

  target.value = reorderItems(target.value, payload.keys, payload.toIndex, payload.previewKeys)
}

function handleTransfer(payload) {
  const source = listMap[payload.fromListId]
  const target = listMap[payload.toListId]
  if (!source || !target || source === target) {
    return
  }

  const moving = payload.items
  source.value = source.value.filter(item => !payload.keys.includes(item.id))
  target.value = insertItems(target.value, moving, payload.toIndex)
}

function reorderItems(items, keys, toIndex, previewKeys) {
  if (Array.isArray(previewKeys) && previewKeys.length) {
    return orderItemsByKeys(items, previewKeys)
  }

  const moving = items.filter(item => keys.includes(item.id))
  const rest = items.filter(item => !keys.includes(item.id))
  return insertItems(rest, moving, toIndex)
}

function orderItemsByKeys(items, keys) {
  const map = new Map(items.map(item => [item.id, item]))
  const ordered = keys.map(key => map.get(key)).filter(Boolean)
  const rest = items.filter(item => !keys.includes(item.id))
  return [...ordered, ...rest]
}

function insertItems(items, moving, toIndex) {
  const next = [...items]
  next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, ...moving)
  return next
}

function canDropRule(context) {
  return context.previewKeys.indexOf('publish') > context.previewKeys.indexOf('review')
}
</script>

<template>
  <section class="admin-sortable admin-page-span">
    <header class="admin-sortable__header">
      <div>
        <p class="admin-sortable__eyebrow">Sortable</p>
        <h2>拖动排序组件</h2>
      </div>
    </header>

    <div class="admin-sortable__grid">
      <section class="admin-sortable__panel">
        <div class="admin-sortable__panel-head">
          <VaIcon name="sortable" />
          <div>
            <h3>纵向流程</h3>
          </div>
        </div>
        <VaSortable
          list-id="vertical"
          class="admin-sortable__stack"
          :items="verticalItems"
          item-key="id"
          strategy="vertical-list"
          @reorder="handleReorder('vertical', $event)"
        >
          <template #item="{ item, handleProps }">
            <article class="admin-sortable__row">
              <button class="admin-sortable__handle" type="button" v-bind="handleProps">
                <VaIcon name="drag-handle" />
              </button>
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ item.desc }}</small>
              </div>
            </article>
          </template>
        </VaSortable>
      </section>

      <section class="admin-sortable__panel">
        <div class="admin-sortable__panel-head">
          <VaIcon name="tabs" />
          <div>
            <h3>横向标签</h3>
          </div>
        </div>
        <VaSortable
          list-id="tags"
          class="admin-sortable__tags"
          :items="tagItems"
          item-key="id"
          strategy="horizontal-list"
          @reorder="handleReorder('tags', $event)"
        >
          <template #item="{ item, handleProps }">
            <button
              class="admin-sortable__tag"
              :class="`admin-sortable__tag--${item.size}`"
              type="button"
            >
              <span v-bind="handleProps" class="admin-sortable__tag-handle">
                <VaIcon name="drag-handle" />
              </span>
              {{ item.title }}
            </button>
          </template>
        </VaSortable>
      </section>

      <section class="admin-sortable__panel">
        <div class="admin-sortable__panel-head">
          <VaIcon name="table" />
          <div>
            <h3>换行卡片</h3>
          </div>
        </div>
        <VaSortable
          list-id="cards"
          class="admin-sortable__cards"
          :items="cardItems"
          item-key="id"
          strategy="row-grid"
          @reorder="handleReorder('cards', $event)"
        >
          <template #item="{ item, handleProps }">
            <article
              class="admin-sortable__card"
              :class="`admin-sortable__card--${item.shape}`"
            >
              <button class="admin-sortable__handle" type="button" v-bind="handleProps">
                <VaIcon name="drag-handle" />
              </button>
              <strong>{{ item.title }}</strong>
              <var-chip plain size="small">{{ item.type }}</var-chip>
            </article>
          </template>
        </VaSortable>
      </section>

      <section class="admin-sortable__panel">
        <div class="admin-sortable__panel-head">
          <VaIcon name="code" />
          <div>
            <h3>自定义占位</h3>
          </div>
        </div>
        <VaSortable
          list-id="placeholder"
          class="admin-sortable__stack"
          :items="placeholderItems"
          item-key="id"
          strategy="vertical-list"
          @reorder="handleReorder('placeholder', $event)"
        >
          <template #item="{ item, handleProps }">
            <article class="admin-sortable__row">
              <button class="admin-sortable__handle" type="button" v-bind="handleProps">
                <VaIcon name="drag-handle" />
              </button>
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ item.status }}</small>
              </div>
            </article>
          </template>
          <template #placeholder="{ item }">
            <article
              class="admin-sortable__row admin-sortable__custom-placeholder"
            >
              <strong>{{ item.title }}</strong>
            </article>
          </template>
        </VaSortable>
      </section>

      <section class="admin-sortable__panel">
        <div class="admin-sortable__panel-head">
          <VaIcon name="check" />
          <div>
            <h3>关联拖动</h3>
          </div>
        </div>
        <VaSortable
          list-id="selected"
          class="admin-sortable__stack"
          :items="selectedItems"
          item-key="id"
          strategy="vertical-list"
          :selected-keys="selectedDemoKeys"
          @reorder="handleReorder('selected', $event)"
        >
          <template #item="{ item, state, handleProps }">
            <article
              class="admin-sortable__row"
              :class="{ 'admin-sortable__row--selected': state.selected }"
            >
              <button class="admin-sortable__handle" type="button" v-bind="handleProps">
                <VaIcon name="drag-handle" />
              </button>
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ state.selected ? '批量项' : '单独项' }}</small>
              </div>
            </article>
          </template>
        </VaSortable>
      </section>

      <section class="admin-sortable__panel">
        <div class="admin-sortable__panel-head">
          <VaIcon name="pin" />
          <div>
            <h3>固定位置</h3>
          </div>
        </div>
        <VaSortable
          list-id="locked"
          class="admin-sortable__stack"
          :items="lockedItems"
          item-key="id"
          strategy="vertical-list"
          :locked-keys="lockedDemoKeys"
          @reorder="handleReorder('locked', $event)"
        >
          <template #item="{ item, state, handleProps }">
            <article
              class="admin-sortable__row"
              :class="{ 'admin-sortable__row--locked': state.locked }"
            >
              <button class="admin-sortable__handle" type="button" v-bind="handleProps">
                <VaIcon name="drag-handle" />
              </button>
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ state.locked ? '固定槽位' : '可排序' }}</small>
              </div>
            </article>
          </template>
        </VaSortable>
      </section>

      <section class="admin-sortable__panel">
        <div class="admin-sortable__panel-head">
          <VaIcon name="permission" />
          <div>
            <h3>顺序约束</h3>
          </div>
        </div>
        <VaSortable
          list-id="rules"
          class="admin-sortable__stack"
          :items="ruleItems"
          item-key="id"
          strategy="vertical-list"
          :can-drop="canDropRule"
          @reorder="handleReorder('rules', $event)"
        >
          <template #item="{ item, handleProps }">
            <article
              class="admin-sortable__row"
              :class="{ 'admin-sortable__row--linked': item.id === 'review' || item.id === 'publish' }"
            >
              <button class="admin-sortable__handle" type="button" v-bind="handleProps">
                <VaIcon name="drag-handle" />
              </button>
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ item.id === 'review' || item.id === 'publish' ? '关联节点' : '流程节点' }}</small>
              </div>
            </article>
          </template>
        </VaSortable>
      </section>

      <section class="admin-sortable__panel">
        <div class="admin-sortable__panel-head">
          <VaIcon name="data" />
          <div>
            <h3>跨列表任务</h3>
          </div>
        </div>
        <div class="admin-sortable__boards">
          <div
            v-for="board in [
              { id: 'backlog', title: '待处理', items: backlogItems, transfer: true },
              { id: 'doing', title: '进行中', items: doingItems, transfer: true },
              { id: 'blocked', title: '不可接收', items: blockedItems, transfer: false },
            ]"
            :key="board.id"
            class="admin-sortable__board"
          >
            <h4>{{ board.title }}</h4>
            <VaSortable
              :list-id="board.id"
              class="admin-sortable__board-list"
              group="tasks"
              :items="board.items"
              item-key="id"
              strategy="vertical-list"
              :allow-transfer="board.transfer"
              @reorder="handleReorder(board.id, $event)"
              @transfer="handleTransfer"
            >
              <template #item="{ item, handleProps }">
                <article class="admin-sortable__task">
                  <button class="admin-sortable__handle" type="button" v-bind="handleProps">
                    <VaIcon name="drag-handle" />
                  </button>
                  {{ item.title }}
                </article>
              </template>
            </VaSortable>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.admin-page-span {
  grid-column: 1 / -1;
}

.admin-sortable,
.admin-sortable__panel,
.admin-sortable__stack {
  display: grid;
  gap: 16px;
}

.admin-sortable {
  --admin-sortable-border-color: var(
    --color-outline-variant,
    var(--color-outline, color-mix(in srgb, currentColor 18%, transparent))
  );
}

.admin-sortable__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-sortable__eyebrow {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-sortable h2,
.admin-sortable h3,
.admin-sortable h4 {
  margin: 0;
  font-weight: 600;
}

.admin-sortable h2 { font-size: 22px; }
.admin-sortable h3 { font-size: 17px; }

.admin-sortable small {
  color: var(--color-on-surface-variant);
  line-height: 1.6;
}

.admin-sortable__grid,
.admin-sortable__boards {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.admin-sortable__panel {
  align-content: start;
  min-width: 0;
  padding-top: 16px;
  border-top: 1px solid var(--admin-sortable-border-color);
}

.admin-sortable__panel-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 12px;
}

.admin-sortable__panel-head > .va-icon {
  color: var(--color-primary);
  font-size: 26px;
}

.admin-sortable__row,
.admin-sortable__card,
.admin-sortable__task,
.admin-sortable__tag {
  display: flex;
  align-items: center;
  min-width: 0;
  color: var(--color-on-surface);
  background: var(--color-surface-container-low, var(--color-body));
  border: 1px dashed var(--admin-sortable-border-color);
  border-radius: var(--card-border-radius, 4px);
}

.admin-sortable__row {
  min-height: 58px;
  padding: 8px 12px 8px 6px;
  gap: 10px;
}

.admin-sortable__row > div {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.admin-sortable__tags {
  display: flex;
  min-width: 0;
  min-height: 44px;
  overflow-x: auto;
}

.admin-sortable__tag {
  flex: 0 0 auto;
  min-height: 36px;
  padding: 0 12px 0 4px;
  font: inherit;
  cursor: pointer;
  border-radius: 0;
}

.admin-sortable__tag + .admin-sortable__tag { margin-left: -1px; }
.admin-sortable__tag--xs { width: 82px; }
.admin-sortable__tag--sm { width: 116px; }
.admin-sortable__tag--md { width: 154px; }
.admin-sortable__tag--lg { width: 210px; }

.admin-sortable__tag-handle,
.admin-sortable__handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--color-on-surface-variant);
  cursor: grab;
}

.admin-sortable__handle {
  flex: 0 0 auto;
  padding: 0;
  background: transparent;
  border: 0;
}

.admin-sortable__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  align-items: start;
  gap: 10px;
  min-height: 280px;
}

.admin-sortable__card {
  min-height: 92px;
  padding: 10px;
  align-items: flex-start;
  flex-direction: column;
  gap: 8px;
}

.admin-sortable__card--compact { min-height: 72px; }
.admin-sortable__card--short { min-height: 88px; }
.admin-sortable__card--tall { min-height: 138px; }
.admin-sortable__card--wide {
  grid-column: span 2;
  min-height: 106px;
}

.admin-sortable__custom-placeholder {
  justify-content: center;
  min-height: 58px;
  color: var(--color-primary);
  border-style: dashed;
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.admin-sortable__row--selected {
  border-color: color-mix(in srgb, var(--color-primary) 50%, var(--admin-sortable-border-color));
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.admin-sortable__row--linked {
  border-left: 3px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
}

.admin-sortable__row--locked {
  border-style: dashed;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-primary) 6%, transparent),
      var(--color-surface-container-low, var(--color-body))
    );
}

.admin-sortable__board {
  min-height: 190px;
  padding: 10px;
  background: color-mix(in srgb, var(--color-primary) 4%, transparent);
  border: 1px solid var(--admin-sortable-border-color);
}

.admin-sortable__board > h4 {
  margin-bottom: 8px;
}

.admin-sortable__board-list {
  display: grid;
  gap: 8px;
  min-height: 54px;
}

.admin-sortable__task {
  min-height: 42px;
  padding: 6px 10px 6px 4px;
  gap: 8px;
}

:deep(.va-sortable__placeholder) { opacity: 0.42; }
:deep(.va-sortable__item--disabled) { cursor: not-allowed; opacity: 0.55; }

@media (max-width: 900px) {
  .admin-sortable__grid,
  .admin-sortable__boards { grid-template-columns: 1fr; }
}
</style>
