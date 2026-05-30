'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  DollarSign,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PhoneCall,
  Plane,
  RefreshCw,
  Settings,
  Target,
  Users,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/funil', label: 'Funil de vendas', icon: ClipboardList },
  { href: '/call-vendas', label: 'Call de vendas', icon: PhoneCall },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/emissoes', label: 'Emissoes', icon: Plane },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/renovacoes', label: 'Renovacoes', icon: RefreshCw },
  { href: '/configuracoes', label: 'Configuracoes', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapsed: () => void
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, mobileOpen, onToggleCollapsed, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-dvh flex-col border-r border-[#d7ad68]/25 bg-[#061411] text-[#f8e7c4] shadow-2xl transition-[width,transform] duration-200 md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        collapsed ? 'w-72 md:w-20' : 'w-72 md:w-64',
      )}
    >
      <div className={cn('border-b border-[#d7ad68]/20 px-4 py-4', collapsed && 'md:px-3')}>
        <div className={cn('flex items-center gap-2.5', collapsed && 'md:justify-center')}>
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-[#d7ad68]/60 bg-black">
            <Image
              src="/atlas-beyond-destinations.png"
              alt="Atlas Beyond Destinations"
              fill
              sizes="48px"
              className="object-cover"
              priority
            />
          </div>
          <div className={cn('min-w-0', collapsed && 'md:hidden')}>
            <p className="atlas-wordmark text-base font-semibold leading-none text-[#f4d59a]">ATLAS</p>
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-[#d7ad68]">Beyond Destinations</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="mt-3 hidden w-full items-center justify-center gap-2 rounded-md border border-[#d7ad68]/20 px-2.5 py-2 text-xs font-medium text-[#e8d3ab]/75 transition hover:bg-[#0f2d27] hover:text-[#f8e7c4] md:flex"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          {!collapsed && 'Recolher menu'}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors md:py-2',
                collapsed && 'md:justify-center md:px-2',
                active
                  ? 'bg-[#d7ad68] text-[#081613]'
                  : 'text-[#e8d3ab]/75 hover:bg-[#0f2d27] hover:text-[#f8e7c4]'
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span className={cn(collapsed && 'md:hidden')}>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={cn('border-t border-[#d7ad68]/20 p-3', collapsed && 'md:px-2')}>
        <div className={cn('mb-2.5 rounded-md border border-[#d7ad68]/20 bg-[#0f2d27] p-2.5', collapsed && 'md:hidden')}>
          <p className="text-xs font-medium text-[#f4d59a]">Ecossistema Atlas</p>
          <p className="mt-1 text-xs text-[#e8d3ab]/65">SaaS multiempresa preparado para gestão de viagens.</p>
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-[#e8d3ab]/75 transition-colors hover:bg-[#0f2d27] hover:text-[#f8e7c4]',
            collapsed && 'md:justify-center md:px-2',
          )}
        >
          <LogOut size={18} className="shrink-0" />
          <span className={cn(collapsed && 'md:hidden')}>Sair</span>
        </button>
      </div>
    </aside>
  )
}
