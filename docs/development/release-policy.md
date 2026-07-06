# 发布规范

本规范用于约束 Vela Admin 的 npm 发布流程、版本决策和发布前检查。

## 包边界

`vela-admin` 发布 framework 包，只应包含：

1. `src`
2. `styles`

`create-vela-admin` 发布生成器包，只应包含：

1. `src`
2. `template`

`packages/create-vela-admin/template` 由 `prepack` 临时生成，`postpack` 清理，不作为长期维护源码提交。

## 发布顺序

发布两个包时，默认顺序为：

1. 发布 `vela-admin`。
2. 发布 `create-vela-admin`。

原因是 create 包生成的用户项目会依赖已经发布的 framework 版本。

## 发布前检查

发布前至少运行：

```sh
pnpm run release:verify
```

如果只准备验证某个包，也应运行对应 `pack:*` 命令确认发布内容。

## 自动发布

仓库使用 `.github/workflows/publish-npm.yml` 发布 npm 包。工作流触发方式：

1. 推送 `v*` 标签，例如 `v0.1.0`。
2. 在 GitHub Actions 页面手动运行 `Publish npm packages`。

工作流会执行：

```sh
pnpm install --frozen-lockfile
pnpm run release:verify
pnpm run release:publish
```

`release:verify` 会依次运行测试、构建和两个包的 dry-run pack；`release:publish` 会按发布顺序执行：

1. `pnpm run publish:framework`
2. `pnpm run publish:create`

## npm 身份验证

推荐长期使用 npm Trusted Publishing。GitHub Actions workflow 已配置：

```yaml
permissions:
  contents: read
  id-token: write
```

稳定发布路径：

1. 在 npm 上进入 `vela-admin` 包设置。
2. 添加 Trusted Publisher，选择 GitHub Actions。
3. 仓库填写当前 GitHub 仓库。
4. Workflow 文件填写 `publish-npm.yml`。
5. 对 `create-vela-admin` 重复同样设置。
6. GitHub 仓库不保留 `NPM_TOKEN`。

首次发布时，如果 npm 上还没有这两个包，就还没有包设置页，无法提前绑定 Trusted Publisher。首次发布可选两种方式：

1. 使用一次性 npm token bootstrap。
2. 本地手动发布一次，再进入 npm 包设置绑定 Trusted Publisher。

为了让第一次推送 GitHub 后也能自动发布，使用一次性 token bootstrap：

1. 在 npm 创建只用于首次发布的 automation/granular access token，权限限制为发布包。
2. 在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 新增 repository secret：`NPM_TOKEN`。
3. 推送首个发布标签，例如 `v0.1.0`。
4. GitHub Actions 会在 Trusted Publishing 不可用时使用 `NPM_TOKEN` 完成首次发布。
5. 首次发布成功后，进入 npm 两个包的设置页绑定 Trusted Publisher。
6. 删除 GitHub `NPM_TOKEN` secret，并在 npm 撤销该 token。
7. 后续版本只保留 Trusted Publishing，不再使用长期 token。

发布工作流中的 `Configure npm token for first publish` 步骤只在 `NPM_TOKEN` 存在时生效。

## 版本规则

版本号调整应基于用户可感知变化：

1. patch：缺陷修复、文档修正、内部实现优化，且无兼容影响。
2. minor：新增向后兼容能力、配置项、组件或模板能力。
3. major：breaking change、公开 API 删除、默认行为不兼容变化。

版本和 changelog 尚未正式建立前，不应随意发布真实 npm 版本。

## 发布失败处理

发布失败后应先确认失败发生阶段：

1. build/test 失败：修复后重新完整验证。
2. pack 内容错误：修复 `files`、模板同步或发布脚本后重新 pack。
3. npm publish 失败：确认包名、版本、权限和网络状态，不直接重复发布未知状态版本。

涉及已发布错误版本时，应先制定处理计划，再决定 deprecate、补发 patch 或更新文档。
