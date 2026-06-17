'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.update().catch(() => undefined)

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' })
          }
        })
      })
    }).catch(() => undefined)
  }, [])

  return null
}
