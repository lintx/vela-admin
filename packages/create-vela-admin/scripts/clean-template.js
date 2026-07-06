import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const targetTemplateRoot = path.join(packageRoot, 'template')

await fs.rm(targetTemplateRoot, { recursive: true, force: true })
console.log('已清理发布模板')
