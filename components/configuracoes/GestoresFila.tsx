'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, Trash2, UserCheck } from 'lucide-react'

interface GestorItem {
  id: string
  nome: string
  email: string
  cargo: string
  autorizado: boolean
}

interface Props {
  pendentes: GestorItem[]
  equipe: GestorItem[]
  meId: string
  souCEO: boolean
}

export function GestoresFila({ pendentes, equipe, meId, souCEO }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState('')

  async function autorizar(id: string, cargo: string) {
    setLoading(id)
    await fetch('/api/gestores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'autorizar', cargo }),
    })
    setLoading('')
    router.refresh()
  }

  async function definirCargo(id: string, cargo: string) {
    setLoading(id)
    await fetch('/api/gestores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'definir_cargo', cargo }),
    })
    setLoading('')
    router.refresh()
  }

  async function remover(id: string) {
    setLoading(id)
    await fetch(`/api/gestores?id=${id}`, { method: 'DELETE' })
    setLoading('')
    router.refresh()
  }

  if (!souCEO) {
    return (
      <p className="text-sm text-[#e8d3ab]/70">
        Apenas o CEO gerencia acessos e cargos da equipe.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[#f8e7c4]">
          <UserCheck size={15} /> Fila de solicitacoes {pendentes.length > 0 && <Badge className="bg-amber-400 text-amber-950">{pendentes.length}</Badge>}
        </p>
        {pendentes.length === 0 ? (
          <p className="text-xs text-[#e8d3ab]/60">Nenhuma solicitacao pendente.</p>
        ) : (
          <div className="space-y-2">
            {pendentes.map(g => (
              <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-3">
                <div>
                  <p className="text-sm font-medium text-[#f8e7c4]">{g.nome}</p>
                  <p className="text-xs text-[#e8d3ab]/65">{g.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400" disabled={loading === g.id} onClick={() => autorizar(g.id, 'GESTOR')}>
                    <Check size={14} className="mr-1" /> Gestor
                  </Button>
                  <Button size="sm" variant="outline" className="border-[#d7ad68]/40 text-[#f8e7c4]" disabled={loading === g.id} onClick={() => autorizar(g.id, 'CEO')}>
                    CEO
                  </Button>
                  <Button size="icon-sm" variant="ghost" className="text-red-400" disabled={loading === g.id} onClick={() => remover(g.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-[#f8e7c4]">Equipe ativa</p>
        <div className="space-y-2">
          {equipe.map(g => (
            <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-3">
              <div>
                <p className="text-sm font-medium text-[#f8e7c4]">{g.nome} {g.id === meId && <span className="text-xs text-[#d7ad68]">(voce)</span>}</p>
                <p className="text-xs text-[#e8d3ab]/65">{g.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={g.cargo} onValueChange={v => definirCargo(g.id, v ?? g.cargo)} disabled={g.id === meId || loading === g.id}>
                  <SelectTrigger className="h-8 w-[120px] bg-white/90"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CEO">CEO</SelectItem>
                    <SelectItem value="GESTOR">Gestor de Milhas</SelectItem>
                  </SelectContent>
                </Select>
                {g.id !== meId && (
                  <Button size="icon-sm" variant="ghost" className="text-red-400" disabled={loading === g.id} onClick={() => remover(g.id)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
