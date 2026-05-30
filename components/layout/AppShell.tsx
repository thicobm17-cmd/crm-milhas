'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('atlas-sidebar-collapsed') === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      window.localStorage.setItem('atlas-sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[#d7ad68]/25 bg-[#061411]/95 px-3 text-[#f8e7c4] shadow-lg backdrop-blur md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-[#f4d59a] hover:bg-[#0f2d27] hover:text-[#f4d59a]"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </Button>
        <div className="text-center">
          <p className="atlas-wordmark text-sm font-semibold text-[#f4d59a]">ATLAS CRM</p>
          <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[#d7ad68]">Beyond Destinations</p>
        </div>
        <div className="size-9" />
      </header>

      <main
        className={cn(
          'min-w-0 max-w-full px-3 pb-5 pt-[4.25rem] transition-[padding] duration-200 sm:px-4 md:py-5 md:pr-5 lg:py-5 lg:pr-5 xl:py-6 xl:pr-6',
          collapsed ? 'md:pl-24' : 'md:pl-72',
        )}
      >
        {children}
      </main>
    </div>
  )
}
