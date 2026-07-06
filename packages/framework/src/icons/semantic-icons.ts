import type { AdminSemanticIconEntry } from './icon-types'

export const adminSemanticIcons = [
  { name: 'dashboard', label: '控制台', usage: '后台首页、仪表盘菜单', phosphor: 'chart-pie-slice', tabler: 'layout-dashboard' },
  { name: 'home', label: '首页', usage: '首页入口、返回首页操作', phosphor: 'house', tabler: 'home' },
  { name: 'system', label: '系统', usage: '系统管理顶级菜单', phosphor: 'gear', tabler: 'settings' },
  { name: 'settings', label: '设置', usage: '设置中心、偏好配置入口', phosphor: 'gear', tabler: 'settings' },
  { name: 'users', label: '用户', usage: '用户管理菜单和用户列表', phosphor: 'users', tabler: 'users' },
  { name: 'user', label: '用户详情', usage: '用户详情、个人资料', phosphor: 'user-circle', tabler: 'user-circle' },
  { name: 'user-add', label: '新增用户', usage: '新增用户操作', phosphor: 'user-circle-plus', tabler: 'user-plus' },
  { name: 'user-check', label: '用户验证', usage: '登录验证、账号状态', phosphor: 'user-check', tabler: 'user-check' },
  { name: 'user-edit', label: '编辑用户', usage: '编辑用户资料、账号维护', phosphor: 'user-gear', tabler: 'user-cog' },
  { name: 'user-key', label: '用户权限', usage: '用户权限、账号密钥', phosphor: 'user-list', tabler: 'user-cog' },
  { name: 'role', label: '角色', usage: '角色管理、身份配置', phosphor: 'user-gear', tabler: 'user-cog' },
  { name: 'permission', label: '权限', usage: '权限菜单、权限按钮示例', phosphor: 'key', tabler: 'key' },
  { name: 'security', label: '安全', usage: '安全设置、权限边界', phosphor: 'shield', tabler: 'shield' },
  { name: 'shield-check', label: '安全通过', usage: '权限通过、安全状态正常', phosphor: 'shield-check', tabler: 'shield-check' },
  { name: 'lock', label: '锁定', usage: '登录、锁定、受限入口', phosphor: 'lock', tabler: 'lock' },
  { name: 'lock-open', label: '解锁', usage: '可访问状态、开放权限', phosphor: 'lock-open', tabler: 'lock' },
  { name: 'exception', label: '异常', usage: '异常页顶级菜单', phosphor: 'warning-circle', tabler: 'shield-x' },
  { name: 'forbidden', label: '403', usage: '无权限异常页', phosphor: 'shield-warning', tabler: 'shield-lock' },
  { name: 'not-found', label: '404', usage: '页面不存在异常页', phosphor: 'map-pin-area', tabler: 'map-pin-question' },
  { name: 'server-error', label: '500', usage: '服务异常、系统错误', phosphor: 'database', tabler: 'database' },
  { name: 'demo', label: '示例', usage: '示例页面、多级菜单', phosphor: 'list-bullets', tabler: 'list-details' },
  { name: 'level-1', label: '一级', usage: '多级菜单一级示例', phosphor: 'list', tabler: 'list' },
  { name: 'level-2', label: '二级', usage: '多级菜单二级示例', phosphor: 'list', tabler: 'list' },
  { name: 'level-3', label: '三级', usage: '多级菜单三级示例', phosphor: 'list', tabler: 'list' },
  { name: 'level-4', label: '四级', usage: '多级菜单四级示例', phosphor: 'list', tabler: 'list' },
  { name: 'icons', label: '图标', usage: '图标用法页面、图标能力展示', phosphor: 'squares-four', tabler: 'icons' },
  { name: 'theme', label: '主题', usage: '主题切换、主题生成器', phosphor: 'palette', tabler: 'palette' },
  { name: 'table', label: '表格', usage: '数据表格、列表数据', phosphor: 'chart-bar', tabler: 'table' },
  { name: 'data', label: '数据', usage: '数据统计、可见菜单数量', phosphor: 'database', tabler: 'database' },
  { name: 'search', label: '搜索', usage: '菜单搜索、命令面板搜索', phosphor: 'magnifying-glass', tabler: 'search' },
  { name: 'menu', label: '展开侧栏', usage: '收缩态侧栏切换按钮，点击后展开侧栏', phosphor: 'text-indent', tabler: 'indent-increase' },
  { name: 'menu-open', label: '收缩侧栏', usage: '展开态侧栏切换按钮，点击后收缩侧栏', phosphor: 'text-outdent', tabler: 'indent-decrease' },
  { name: 'more', label: '更多', usage: '更多操作、移动端顶部工具菜单', phosphor: 'dots-three-vertical', tabler: 'dots-vertical' },
  { name: 'close', label: '关闭', usage: '关闭弹层、关闭标签页', phosphor: 'x', tabler: 'x' },
  { name: 'check', label: '完成', usage: '完成状态、选中状态', phosphor: 'check', tabler: 'check' },
  { name: 'pin', label: '固定', usage: '固定标签页', phosphor: 'push-pin', tabler: 'pinned' },
  { name: 'image', label: '图片', usage: '图片取色、上传图片入口', phosphor: 'image', tabler: 'photo' },
  { name: 'sun', label: '浅色', usage: '浅色主题切换', phosphor: 'sun', tabler: 'sun' },
  { name: 'moon', label: '深色', usage: '深色主题切换', phosphor: 'moon', tabler: 'moon' },
  { name: 'logout', label: '退出', usage: '退出登录操作', phosphor: 'sign-out', tabler: 'sign-right' },
  { name: 'email', label: '邮箱', usage: '邮箱字段、联系方式', phosphor: 'envelope', tabler: 'mail' },
  { name: 'notification', label: '通知', usage: '消息通知入口', phosphor: 'bell', tabler: 'bell' },
  { name: 'tabs', label: '标签页', usage: '多标签页能力展示', phosphor: 'tabs', tabler: 'layout' },
  { name: 'code', label: '代码', usage: '代码示例、开发者能力', phosphor: 'code', tabler: 'code' },
  { name: 'question', label: '未知', usage: '未知图标 fallback', phosphor: 'question', tabler: 'question-mark' },
] satisfies AdminSemanticIconEntry[]

export function getAdminSemanticIconEntries(): AdminSemanticIconEntry[] {
  return [...adminSemanticIcons]
}

export function findAdminSemanticIcon(name: string): AdminSemanticIconEntry | undefined {
  return adminSemanticIcons.find((icon) => icon.name === name)
}
