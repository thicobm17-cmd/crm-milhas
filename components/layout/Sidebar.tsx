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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-[#d7ad68]/25 bg-[#061411] text-[#f8e7c4]">
      <div className="border-b border-[#d7ad68]/20 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-[#d7ad68]/60 bg-black">
            <Image
              src="/atlas-beyond-destinations.png"
              alt="Atlas Beyond Destinations"
              fill
              sizes="56px"
              className="object-cover"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="atlas-wordmark text-base font-semibold leading-none text-[#f4d59a]">ATLAS</p>
            <p className="mt-1 text-[0.63rem] uppercase tracking-[0.24em] text-[#d7ad68]">Beyond Destinations</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-[#d7ad68] text-[#081613]'
                  : 'text-[#e8d3ab]/75 hover:bg-[#0f2d27] hover:text-[#f8e7c4]'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[#d7ad68]/20 p-4">
        <div className="mb-3 rounded-md border border-[#d7ad68]/20 bg-[#0f2d27] p-3">
          <p className="text-xs font-medium text-[#f4d59a]">Ecossistema Atlas</p>
          <p className="mt-1 text-xs text-[#e8d3ab]/65">SaaS multiempresa preparado para gestao de viagens.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[#e8d3ab]/75 transition-colors hover:bg-[#0f2d27] hover:text-[#f8e7c4]"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}
