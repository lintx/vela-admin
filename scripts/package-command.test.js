import assert from 'node:assert/strict'
import path from 'node:path'
import { test } from 'node:test'

import { isPathInsideWorkspace } from './package-command.js'

test('workspace boundary rejects sibling paths with the same prefix', () => {
  const workspaceRoot = path.join(path.parse(process.cwd()).root, 'workspace', 'vela-admin')
  const siblingRoot = `${workspaceRoot}-evil`

  assert.equal(isPathInsideWorkspace(workspaceRoot, siblingRoot), false)
})

test('workspace boundary accepts package paths inside workspace', () => {
  const workspaceRoot = path.join(path.parse(process.cwd()).root, 'workspace', 'vela-admin')
  const packageRoot = path.join(workspaceRoot, 'packages', 'framework')

  assert.equal(isPathInsideWorkspace(workspaceRoot, packageRoot), true)
})
