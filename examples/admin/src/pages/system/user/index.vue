<script setup>
import { computed, h, ref, resolveComponent, resolveDirective, withDirectives } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const VarButton = resolveComponent('var-button')
const VarChip = resolveComponent('var-chip')
const VarSpace = resolveComponent('var-space')
const permissionDirective = resolveDirective('permission')
const keyword = ref('')
const current = ref(1)
const size = ref(5)
const users = [
  { id: 1001, name: 'Lin', role: '管理员', department: '平台组', status: '启用' },
  { id: 1002, name: 'Chen', role: '运营', department: '内容组', status: '启用' },
  { id: 1003, name: 'Wang', role: '审计员', department: '风控组', status: '停用' },
  { id: 1004, name: 'Zhao', role: '客服', department: '客户成功', status: '待确认' },
  { id: 1005, name: 'Qian', role: '开发者', department: '研发组', status: '启用' },
  { id: 1006, name: 'Sun', role: '访客', department: '外部协作', status: '停用' },
]

const filteredUsers = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) {
    return users
  }

  return users.filter((user) => {
    return [user.name, user.role, user.department, user.status]
      .some((item) => item.toLowerCase().includes(value))
  })
})

const pagedUsers = computed(() => {
  const start = (current.value - 1) * size.value
  return filteredUsers.value.slice(start, start + size.value)
})

const columns = computed(() => [
  { title: '编号', key: 'id', width: 96 },
  { title: '姓名', key: 'name', minWidth: 120 },
  { title: '角色', key: 'role', minWidth: 120 },
  { title: '部门', key: 'department', minWidth: 140 },
  {
    title: '状态',
    key: 'status',
    width: 116,
    render: ({ row }) => h(VarChip, {
      class: 'admin-users__status',
      type: statusType(row.status),
      plain: true,
      size: 'small',
    }, () => row.status),
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render: ({ row }) => h(VarSpace, { size: [4, 4] }, () => [
      h(VarButton, {
        text: true,
        type: 'primary',
        onClick: () => openDetail(row.id),
      }, () => '详情'),
      withDirectives(
        h(VarButton, { text: true }, () => '编辑'),
        permissionDirective ? [[permissionDirective, 'system:user:edit']] : [],
      ),
    ]),
  },
])

function resetSearch() {
  keyword.value = ''
  current.value = 1
}

function openDetail(id) {
  router.push(`/system/user/${id}`)
}

function statusType(status) {
  if (status === '启用') {
    return 'success'
  }

  if (status === '停用') {
    return 'danger'
  }

  return 'warning'
}
</script>

<template>
  <section class="admin-users admin-page-span">
    <header class="admin-users__toolbar">
      <div class="admin-users__toolbar-main">
        <h2>用户管理</h2>
        <p>展示搜索、表格、分页、动态详情路由和按钮权限。</p>
      </div>

      <var-space :size="[8, 8]">
        <var-button v-permission="'system:user:add'" type="primary">
          新增用户
        </var-button>
        <var-button v-permission.any="['system:user:edit', 'system:user:admin']">
          批量编辑
        </var-button>
      </var-space>
    </header>

    <section class="admin-users__search">
      <var-space :size="[8, 8]" align="center">
        <var-input v-model="keyword" class="admin-users__keyword" placeholder="搜索姓名、角色、部门或状态" />
        <var-button type="primary" @click="current = 1">查询</var-button>
        <var-button @click="resetSearch">重置</var-button>
      </var-space>
    </section>

    <section class="admin-users__table-card">
      <div class="admin-users__table-scroll admin-users__desktop-table" aria-label="用户列表">
        <var-data-table
          :columns="columns"
          :data="pagedUsers"
          row-key="id"
          :scroll-x="760"
          size="small"
        >
          <template #empty>
            <var-result type="empty" title="暂无用户" description="请调整搜索条件后重试" :animation="false" />
          </template>
        </var-data-table>
      </div>

      <div class="admin-users__mobile-list" aria-label="移动端用户列表">
        <article
          v-for="user in pagedUsers"
          :key="user.id"
          class="admin-users__mobile-card"
        >
          <div class="admin-users__mobile-main">
            <div>
              <strong>{{ user.name }}</strong>
              <span>#{{ user.id }}</span>
            </div>
            <var-chip class="admin-users__status" :type="statusType(user.status)" plain size="small">
              {{ user.status }}
            </var-chip>
          </div>

          <dl class="admin-users__mobile-meta">
            <div>
              <dt>角色</dt>
              <dd>{{ user.role }}</dd>
            </div>
            <div>
              <dt>部门</dt>
              <dd>{{ user.department }}</dd>
            </div>
          </dl>

          <var-space :size="[4, 4]" class="admin-users__mobile-actions">
            <var-button text type="primary" @click="openDetail(user.id)">详情</var-button>
            <var-button v-permission="'system:user:edit'" text>编辑</var-button>
          </var-space>
        </article>
      </div>

      <div class="admin-users__pagination">
        <span>共 {{ filteredUsers.length }} 条</span>
        <var-pagination
          v-model:current="current"
          v-model:size="size"
          :total="filteredUsers.length"
          :size-option="[5, 10]"
          show-size-changer
          simple
        />
      </div>
    </section>
  </section>
</template>

<style scoped>
.admin-page-span {
  grid-column: 1 / -1;
}

.admin-users {
  display: grid;
  gap: 16px;
}

.admin-users__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-users__toolbar-main {
  min-width: 0;
}

.admin-users h2,
.admin-users p {
  overflow-wrap: anywhere;
}

.admin-users h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.admin-users p {
  margin: 6px 0 0;
  color: var(--color-on-surface-variant);
}

.admin-users__keyword {
  width: min(360px, 100%);
}

.admin-users__search {
  min-width: 0;
  padding-top: 16px;
  border-top: 1px solid var(--color-outline-variant);
}

.admin-users__search :deep(.var-space) {
  flex-wrap: wrap;
}

.admin-users__table-card {
  min-width: 0;
}

.admin-users__table-scroll {
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

.admin-users__table-scroll :deep(.var-table) {
  min-width: 760px;
}

.admin-users__mobile-list {
  display: none;
}

.admin-users__mobile-card {
  display: grid;
  padding: 14px;
  border: 1px solid var(--color-outline-variant);
  gap: 12px;
}

.admin-users__mobile-main,
.admin-users__mobile-meta,
.admin-users__mobile-actions {
  min-width: 0;
}

.admin-users__mobile-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.admin-users__mobile-main strong,
.admin-users__mobile-main span {
  display: block;
}

.admin-users__mobile-main span,
.admin-users__mobile-meta dt {
  color: var(--color-on-surface-variant);
  font-size: 12px;
}

.admin-users__mobile-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  gap: 10px;
}

.admin-users__mobile-meta div,
.admin-users__mobile-meta dd {
  min-width: 0;
}

.admin-users__mobile-meta dd {
  margin: 3px 0 0;
  overflow-wrap: anywhere;
}

.admin-users__mobile-actions {
  justify-content: flex-end;
}

.admin-users__status {
  justify-self: start;
}

.admin-users__pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  color: var(--color-on-surface-variant);
  gap: 12px;
}

@media (max-width: 720px) {
  .admin-users__toolbar {
    flex-direction: column;
  }

  .admin-users__keyword {
    width: 100%;
  }

  .admin-users__desktop-table {
    display: none;
  }

  .admin-users__mobile-list {
    display: grid;
    gap: 10px;
  }
}
</style>
