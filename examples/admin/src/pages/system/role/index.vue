<script setup>
import { h, resolveComponent, resolveDirective, withDirectives } from 'vue'

const roles = [
  {
    name: '管理员',
    code: 'admin',
    users: 3,
    permissions: ['dashboard:view', 'system:user:*', 'system:role:*'],
  },
  {
    name: '运营',
    code: 'operator',
    users: 8,
    permissions: ['dashboard:view', 'system:user:list', 'system:user:view'],
  },
]
const VarButton = resolveComponent('var-button')
const VarChip = resolveComponent('var-chip')
const VarSpace = resolveComponent('var-space')
const permissionDirective = resolveDirective('permission')
const columns = [
  { title: '角色名称', key: 'name', minWidth: 120 },
  { title: '标识', key: 'code', minWidth: 120 },
  { title: '用户数', key: 'users', width: 96 },
  {
    title: '权限范围',
    key: 'permissions',
    minWidth: 280,
    render: ({ row }) => h(VarSpace, { size: [6, 6] }, () => row.permissions.map((item) => h(VarChip, {
      key: item,
      type: 'primary',
      plain: true,
      size: 'small',
    }, () => item))),
  },
  {
    title: '操作',
    key: 'actions',
    width: 96,
    render: () => withDirectives(
      h(VarButton, { text: true, type: 'primary' }, () => '编辑'),
      permissionDirective ? [[permissionDirective, 'system:role:edit']] : [],
    ),
  },
]
</script>

<template>
  <section class="admin-roles admin-page-span">
    <header class="admin-roles__header">
      <div>
        <h2>角色管理</h2>
        <p>管理员账号可见该菜单，运营账号会被权限过滤。</p>
      </div>
      <var-button v-permission="'system:role:edit'" type="primary">新增角色</var-button>
    </header>

    <section class="admin-roles__table-card">
      <var-data-table
        :columns="columns"
        :data="roles"
        row-key="code"
        :scroll-x="760"
        size="small"
      />
    </section>
  </section>
</template>

<style scoped>
.admin-page-span {
  grid-column: 1 / -1;
}

.admin-roles {
  display: grid;
  gap: 16px;
}

.admin-roles__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-roles h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.admin-roles p {
  margin: 6px 0 0;
  color: var(--color-on-surface-variant);
}

.admin-roles__table-card {
  min-width: 0;
}

@media (max-width: 720px) {
  .admin-roles__header {
    flex-direction: column;
  }
}
</style>
