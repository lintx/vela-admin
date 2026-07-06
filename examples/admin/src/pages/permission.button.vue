<script setup>
import { computed, inject } from 'vue'

import { VaIcon } from 'vela-admin/components'
import { permissionInjectionKey } from 'vela-admin/permission'

const permission = inject(permissionInjectionKey)
const session = computed(() => permission?.getSession() ?? { roles: [], permissions: [] })
const visiblePermissionLabels = computed(() => session.value.permissions.slice(0, 6))
</script>

<template>
  <section class="admin-permission admin-page-span">
    <header class="admin-permission__header">
      <div>
        <p class="admin-permission__eyebrow">按钮权限</p>
        <h2>权限按钮示例</h2>
        <span>默认无权限行为为 remove，因此未授权按钮会直接从 DOM 中移除。</span>
      </div>
      <var-chip type="primary" plain>{{ session.roles.join('、') || '未登录' }}</var-chip>
    </header>

    <section class="admin-permission__panel">
      <h3>当前会话</h3>
      <var-row :gutter="[12, 12]">
        <var-col :span="24" :md="8">
          <var-cell title="角色" :description="session.roles.join('、') || '无'">
            <template #icon>
              <VaIcon name="user-key" />
            </template>
          </var-cell>
        </var-col>
        <var-col :span="24" :md="8">
          <var-cell title="权限码" :description="String(session.permissions.length)">
            <template #icon>
              <VaIcon name="shield-check" />
            </template>
          </var-cell>
        </var-col>
        <var-col :span="24" :md="8">
          <var-cell title="指令" description="v-permission">
            <template #icon>
              <VaIcon name="code" />
            </template>
          </var-cell>
        </var-col>
      </var-row>
      <var-divider />
      <var-space :size="[6, 6]">
        <var-chip v-for="item in visiblePermissionLabels" :key="item" plain size="small">{{ item }}</var-chip>
      </var-space>
    </section>

    <section class="admin-permission__panel">
      <h3>按钮权限</h3>
      <var-row :gutter="[12, 12]">
        <var-col :span="24" :md="12">
          <div class="admin-permission__action">
            <VaIcon name="lock-open" />
            <strong>无需权限</strong>
            <var-button type="primary">无权限要求</var-button>
          </div>
        </var-col>
        <var-col :span="24" :md="12">
          <div class="admin-permission__action">
            <VaIcon name="user-add" />
            <strong>新增用户</strong>
            <var-button v-permission="'system:user:add'" type="primary">
              system:user:add
            </var-button>
          </div>
        </var-col>
        <var-col :span="24" :md="12">
          <div class="admin-permission__action">
            <VaIcon name="role" />
            <strong>角色维护</strong>
            <var-button v-permission="'system:role:edit'">
              system:role:edit
            </var-button>
          </div>
        </var-col>
        <var-col :span="24" :md="12">
          <div class="admin-permission__action">
            <VaIcon name="user-edit" />
            <strong>任一权限</strong>
            <var-button v-permission.any="['system:user:edit', 'system:user:admin']" type="warning">
              any: 用户编辑或管理员
            </var-button>
          </div>
        </var-col>
      </var-row>
    </section>

    <section class="admin-permission__panel">
      <h3>验证方式</h3>
      <p>使用 admin 账号可看到新增、角色编辑和 any 按钮；使用 operator 账号只会保留无权限要求按钮。</p>
      <var-button v-permission="'missing:permission'" type="danger">
        缺失权限
      </var-button>
    </section>
  </section>
</template>

<style scoped>
.admin-page-span {
  grid-column: 1 / -1;
}

.admin-permission {
  display: grid;
  gap: 16px;
}

.admin-permission__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-permission__eyebrow {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-permission h2,
.admin-permission h3 {
  margin: 0;
  font-weight: 600;
}

.admin-permission h2 {
  font-size: 20px;
}

.admin-permission h3 {
  margin-bottom: 12px;
  font-size: 17px;
}

.admin-permission__header span,
.admin-permission p {
  margin: 8px 0 0;
  color: var(--color-on-surface-variant);
  overflow-wrap: anywhere;
}

.admin-permission__panel {
  min-width: 0;
  padding-top: 16px;
  border-top: 1px solid var(--color-outline-variant);
}

.admin-permission__action {
  display: grid;
  min-height: 132px;
  align-content: center;
  justify-items: start;
  padding: 16px;
  gap: 10px;
  border: 1px solid var(--color-outline-variant);
}

.admin-permission__action .va-icon {
  color: var(--color-primary);
  font-size: 26px;
}

.admin-permission__action strong {
  font-weight: 600;
}
</style>
