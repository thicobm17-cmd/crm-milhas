import { spawn, spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const isWindows = process.platform === 'win32'
const npxCommand = isWindows ? 'npx.cmd' : 'npx'
const scriptDir = dirname(fileURLToPath(import.meta.url))
const nextBin = resolve(scriptDir, '../node_modules/next/dist/bin/next')

function runOptionalStep(label, command, args, timeoutMs = 30_000) {
  console.log(`[startup] ${label}...`)

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    timeout: timeoutMs,
    env: process.env,
    shell: isWindows,
  })

  if (result.error) {
    console.warn(`[startup] ${label} skipped/failed: ${result.error.message}`)
    return
  }

  if (result.signal) {
    console.warn(`[startup] ${label} stopped by signal ${result.signal}. Continuing startup.`)
    return
  }

  if (result.status !== 0) {
    console.warn(`[startup] ${label} exited with code ${result.status}. Continuing startup.`)
    return
  }

  console.log(`[startup] ${label} completed.`)
}

if (process.env.SKIP_DB_SYNC === '1') {
  console.log('[startup] SKIP_DB_SYNC=1, skipping Prisma setup.')
} else if (!process.env.DATABASE_URL) {
  console.warn('[startup] DATABASE_URL is not set. Skipping Prisma setup and starting the app.')
} else {
  runOptionalStep('Prisma db push', npxCommand, ['prisma', 'db', 'push', '--accept-data-loss'])
  runOptionalStep('Prisma seed', npxCommand, ['prisma', 'db', 'seed'])
}

console.log('[startup] Starting Next.js...')

const app = spawn(process.execPath, [nextBin, 'start'], {
  stdio: 'inherit',
  env: process.env,
})

function forward(signal) {
  if (!app.killed) app.kill(signal)
}

process.on('SIGINT', () => forward('SIGINT'))
process.on('SIGTERM', () => forward('SIGTERM'))

app.on('exit', (code, signal) => {
  if (signal) {
    console.log(`[startup] Next.js stopped by signal ${signal}.`)
    process.exit(0)
    return
  }

  process.exit(code ?? 0)
})
