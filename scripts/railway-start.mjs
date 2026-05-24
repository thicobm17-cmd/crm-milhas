import { spawn } from 'node:child_process'
import { createServer, request } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const isWindows = process.platform === 'win32'
const npxCommand = isWindows ? 'npx.cmd' : 'npx'
const scriptDir = dirname(fileURLToPath(import.meta.url))
const nextBin = resolve(scriptDir, '../node_modules/next/dist/bin/next')
const appPort = process.env.PORT || '3000'
const publicAliasPort = '3000'

function normalizePublicUrl(value) {
  if (!value) return undefined
  return /^https?:\/\//.test(value) ? value : `https://${value}`
}

const publicAppUrl = process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  normalizePublicUrl(process.env.RAILWAY_PUBLIC_DOMAIN)

if (publicAppUrl) {
  process.env.AUTH_URL = publicAppUrl
  process.env.NEXTAUTH_URL = publicAppUrl
  console.log(`[startup] Auth public URL: ${publicAppUrl}`)
}

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

function startPublicPortProxy(fromPort, toPort) {
  if (fromPort === toPort) return undefined

  const server = createServer((clientReq, clientRes) => {
    const forwardedHost = Array.isArray(clientReq.headers['x-forwarded-host'])
      ? clientReq.headers['x-forwarded-host'][0]
      : clientReq.headers['x-forwarded-host'] || clientReq.headers.host
    const forwardedProto = Array.isArray(clientReq.headers['x-forwarded-proto'])
      ? clientReq.headers['x-forwarded-proto'][0]
      : clientReq.headers['x-forwarded-proto'] || 'https'
    const headers = {
      ...clientReq.headers,
      ...(forwardedHost ? { host: forwardedHost, 'x-forwarded-host': forwardedHost } : {}),
      'x-forwarded-proto': forwardedProto,
    }

    const proxyReq = request(
      {
        hostname: '127.0.0.1',
        port: Number(toPort),
        method: clientReq.method,
        path: clientReq.url,
        headers,
      },
      (proxyRes) => {
        clientRes.writeHead(proxyRes.statusCode ?? 502, proxyRes.statusMessage, proxyRes.headers)
        proxyRes.pipe(clientRes)
      },
    )

    proxyReq.on('error', (error) => {
      console.warn(`[startup] Public port proxy failed: ${error.message}`)

      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { 'content-type': 'application/json' })
      }

      clientRes.end(JSON.stringify({ status: 'error', message: 'Application proxy failed' }))
    })

    clientReq.pipe(proxyReq)
  })

  server.on('error', (error) => {
    console.warn(`[startup] Could not bind public alias port ${fromPort}: ${error.message}`)
  })

  server.listen(Number(fromPort), '0.0.0.0', () => {
    console.log(`[startup] Public alias proxy listening on 0.0.0.0:${fromPort} -> 127.0.0.1:${toPort}`)
  })

  return server
}

console.log(`[startup] Starting Next.js on 0.0.0.0:${appPort}...`)

const app = spawn(process.execPath, [nextBin, 'start', '-H', '0.0.0.0', '-p', appPort], {
  stdio: 'inherit',
  env: process.env,
})
const publicProxy = startPublicPortProxy(publicAliasPort, appPort)

setTimeout(() => {
  syncDatabaseInBackground().catch((error) => {
    console.warn(`[startup] Prisma setup failed in background: ${error.message}`)
  })
}, 2_000)

function forward(signal) {
  publicProxy?.close()
  if (!app.killed) app.kill(signal)
}

process.on('SIGINT', () => forward('SIGINT'))
process.on('SIGTERM', () => forward('SIGTERM'))

app.on('exit', (code, signal) => {
  publicProxy?.close()

  if (signal) {
    console.log(`[startup] Next.js stopped by signal ${signal}.`)
    process.exit(0)
    return
  }

  process.exit(code ?? 0)
})
