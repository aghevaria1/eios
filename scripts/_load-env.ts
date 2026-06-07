// Minimal synchronous .env.local loader for tsx-driven scripts.
//
// Next.js loads .env.local automatically for dev/build; tsx does not. Importing this
// module first (before any module that touches process.env at module scope) makes
// .env.local available to the rest of the script.
//
// No external dep — just fs + a tiny parser.

import fs from 'node:fs'
import path from 'node:path'

const envLocal = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}
