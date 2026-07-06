import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export function isPathInsideWorkspace(workspaceRoot, targetRoot) {
  const relativePath = path.relative(workspaceRoot, targetRoot)

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
}

function main() {
  const [packageDir, command, ...args] = process.argv.slice(2)

  if (!packageDir || !command) {
    console.error('Usage: node scripts/package-command.js <package-dir> <npm-command> [...args]')
    process.exit(1)
  }

  const workspaceRoot = path.resolve(import.meta.dirname, '..')
  const packageRoot = path.resolve(workspaceRoot, packageDir)

  if (!isPathInsideWorkspace(workspaceRoot, packageRoot)) {
    console.error(`Refusing to run outside workspace: ${packageRoot}`)
    process.exit(1)
  }

  const result = spawnSync('npm', [command, ...args], {
    cwd: packageRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  process.exit(result.status ?? 1)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
