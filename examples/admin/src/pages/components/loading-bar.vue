<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

import { useAdminLoadingBar } from 'vela-admin/loading-bar'
import { VaIcon } from 'vela-admin/components'

const loadingBar = useAdminLoadingBar()
const status = ref('idle')
const customStyle = ref(false)
let timer

const statusText = computed(() => ({
  idle: '等待操作',
  loading: '加载中',
  finished: '已完成',
  error: '加载失败',
}[status.value] ?? '等待操作'))

const statusType = computed(() => ({
  idle: 'default',
  loading: 'primary',
  finished: 'success',
  error: 'danger',
}[status.value] ?? 'default'))

function clearTimer() {
  if (timer) {
    window.clearTimeout(timer)
    timer = undefined
  }
}

function startLoading() {
  clearTimer()
  status.value = 'loading'
  loadingBar.start()
}

function finishLoading() {
  clearTimer()
  status.value = 'finished'
  loadingBar.finish()
}

function failLoading() {
  clearTimer()
  status.value = 'error'
  loadingBar.error()
}

function simulateLoading() {
  startLoading()
  timer = window.setTimeout(finishLoading, 1600)
}

function toggleStyle(value) {
  const enabled = typeof value === 'boolean' ? value : customStyle.value
  customStyle.value = enabled

  if (customStyle.value) {
    loadingBar.setDefaultOptions({
      color: 'var(--color-primary)',
      errorColor: 'var(--color-danger)',
      height: '4px',
      finishDelay: 220,
    })
  } else {
    loadingBar.resetDefaultOptions()
  }
}

onBeforeUnmount(clearTimer)
</script>

<template>
  <section class="admin-loading-bar">
    <header class="admin-loading-bar__header">
      <div>
        <p class="admin-loading-bar__eyebrow">LoadingBar</p>
        <h2>页面进度条</h2>
        <p>路由切换时自动显示，导航完成后自动隐藏；业务请求也可以通过同一套 API 手动控制。</p>
      </div>
      <var-chip :type="statusType" plain>{{ statusText }}</var-chip>
    </header>

    <var-row align="stretch" :gutter="[16, 16]">
      <var-col :span="24" :md="14" :lg="14" :xl="14">
        <section class="admin-loading-bar__panel">
          <div class="admin-loading-bar__panel-head">
            <VaIcon name="refresh" />
            <div>
              <h3>手动控制</h3>
              <p>适合提交表单、刷新数据或加载异步模块等非路由场景。</p>
            </div>
          </div>

          <div class="admin-loading-bar__actions">
            <var-button type="primary" @click="startLoading">开始</var-button>
            <var-button @click="finishLoading">完成</var-button>
            <var-button type="danger" text @click="failLoading">错误</var-button>
            <var-button type="primary" plain @click="simulateLoading">模拟 1.6 秒加载</var-button>
          </div>

          <div class="admin-loading-bar__state">
            <span>当前状态</span>
            <strong>{{ statusText }}</strong>
          </div>
        </section>
      </var-col>

      <var-col :span="24" :md="10" :lg="10" :xl="10">
        <section class="admin-loading-bar__panel">
          <div class="admin-loading-bar__panel-head">
            <VaIcon name="settings" />
            <div>
              <h3>样式配置</h3>
              <p>配置会作用于 Varlet LoadingBar 的后续显示。</p>
            </div>
          </div>

          <div class="admin-loading-bar__setting">
            <var-switch v-model="customStyle" @change="toggleStyle" />
            <div>
              <strong>强调加载条</strong>
              <span>高度 4px，并增加结束延时</span>
            </div>
          </div>
        </section>
      </var-col>
    </var-row>

    <section class="admin-loading-bar__api">
      <div class="admin-loading-bar__panel-head">
        <VaIcon name="code" />
        <div>
          <h3>API</h3>
          <p>在任意页面中调用同一个全局服务。</p>
        </div>
      </div>
      <pre><code>import { useAdminLoadingBar } from 'vela-admin/loading-bar'

const loadingBar = useAdminLoadingBar()
loadingBar.start()
loadingBar.finish()
loadingBar.error()</code></pre>
    </section>
  </section>
</template>

<style scoped>
.admin-loading-bar {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.admin-loading-bar__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-loading-bar__eyebrow {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-loading-bar h2,
.admin-loading-bar h3,
.admin-loading-bar p {
  margin: 0;
}

.admin-loading-bar h2 {
  font-size: 22px;
  font-weight: 600;
}

.admin-loading-bar__header p,
.admin-loading-bar__panel-head p,
.admin-loading-bar__setting span {
  color: var(--color-on-surface-variant);
  line-height: 1.7;
}

.admin-loading-bar__header p {
  max-width: 720px;
  margin-top: 8px;
}

.admin-loading-bar__panel,
.admin-loading-bar__api {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 14px;
}

.admin-loading-bar__panel-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.admin-loading-bar__panel-head > :first-child {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--color-primary);
  font-size: 22px;
}

.admin-loading-bar__panel-head h3 {
  font-size: 16px;
  font-weight: 600;
}

.admin-loading-bar__panel-head p {
  margin-top: 4px;
  font-size: 13px;
}

.admin-loading-bar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.admin-loading-bar__state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid var(--color-outline-variant);
  color: var(--color-on-surface-variant);
  font-size: 13px;
}

.admin-loading-bar__state strong {
  color: var(--color-on-surface);
  font-size: 15px;
}

.admin-loading-bar__setting {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.admin-loading-bar__setting div {
  display: grid;
  gap: 3px;
}

.admin-loading-bar__setting strong {
  font-size: 14px;
}

.admin-loading-bar__setting span {
  font-size: 13px;
}

.admin-loading-bar__api pre {
  overflow-x: auto;
  margin: 18px 0 0;
  padding: 14px;
  border-radius: 10px;
  background: var(--color-surface-container-highest);
  color: var(--color-on-surface);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}

@media (max-width: 560px) {
  .admin-loading-bar__header {
    flex-direction: column;
  }

  .admin-loading-bar__panel,
  .admin-loading-bar__api {
    padding: 16px;
  }
}
</style>

