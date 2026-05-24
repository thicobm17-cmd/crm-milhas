import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const isWindows = process.platform === 'win32'
const npxCommand = isWindows ? 'npx.cmd' : 'npx'
const scriptDir = dirname(fileURLToPath(import.meta.url))
const nextBin = resolve(scriptDir, '../node_modules/next/dist/bin/next')

function runOptionalStep(label, command, args, timeoutMs = 30_000) {
  return new Promise((resolve) => {
    console.log(`[startup] ${label}...`)

    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env,
      shell: isWindows,
    })

    const timeout = setTimeout(() => {
      console.warn(`[startup] ${label} timed out. Continuing startup.`)
      child.kill('SIGTERM')
      resolve()
    }, timeoutMs)

    child.on('error', (error) => {
      clearTimeout(timeout)
      console.warn(`[startup] ${label} skipped/failed: ${error.message}`)
      resolve()
    })

    child.on('exit', (code, signal) => {
      clearTimeout(timeout)

      if (signal) {
        console.warn(`[startup] ${label} stopped by signal ${signal}. Continuing startup.`)
      } else if (code !== 0) {
        console.warn(`[startup] ${label} exited with code ${code}. Continuing startup.`)
      } else {
        console.log(`[startup] ${label} completed.`)
      }

      resolve()
    })
  })
}

async function syncDatabaseInBackground() {
  if (process.env.SKIP_DB_SYNC === '1') {
    console.log('[startup] SKIP_DB_SYNC=1, skipping Prisma setup.')
    return
  }

  if (!process.env.DATABASE_URL) {
    console.warn('[startup] DATABASE_URL is not set. Skipping Prisma setup.')
    return
  }

  await runOptionalStep('Prisma db push', npxCommand, ['prisma', 'db', 'push', '--accept-data-loss'])
  await runOptionalStep('Prisma seed', npxCommand, ['prisma', 'db', 'seed'])
}

console.log('[startup] Starting Next.js...')

const app = spawn(process.execPath, [nextBin, 'start', '-H', '0.0.0.0', '-p', '3000'], {
  stdio: 'inherit',
  env: process.env,
})

setTimeout(() => {
  syncDatabaseInBackground().catch((error) => {
    console.warn(`[startup] Prisma setup failed in background: ${error.message}`)
  })
}, 2_000)

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
