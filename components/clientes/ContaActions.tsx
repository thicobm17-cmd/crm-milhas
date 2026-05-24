'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Pencil, Trash2 } from 'lucide-react'

interface Props {
  id: string
  saldoAtual: number
  numeroConta: string | null
}

export function ContaActions({ id, saldoAtual, numeroConta }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [saldo, setSaldo] = useState(String(saldoAtual))
  const [conta, setConta] = useState(numeroConta ?? '')
  const [loading, setLoading] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/contas-programas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, saldoAtual: saldo, numeroConta: conta }),
    })
    setLoading(false)
    setEditOpen(false)
    router.refresh()
  }

  async function excluir() {
    setLoading(true)
    await fetch(`/api/contas-programas?id=${id}`, { method: 'DELETE' })
    setLoading(false)
    setDelOpen(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" title="Atualizar saldo" onClick={() => setEditOpen(true)}>
        <Pencil size={13} />
      </Button>
      <Button variant="ghost" size="icon-sm" className="text-red-600" title="Remover programa" onClick={() => setDelOpen(true)}>
        <Trash2 size={13} />
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atualizar programa</DialogTitle></DialogHeader>
          <form onSubmit={salvar} className="mt-2 space-y-3">
            <div className="space-y-2">
              <Label>Saldo de milhas</Label>
              <Input type="number" value={saldo} onChange={e => setSaldo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Numero da conta</Label>
              <Input value={conta} onChange={e => setConta(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading} className="bg-[#0b3b31] text-[#f4d59a]">{loading ? 'Salvando...' : 'Salvar'}</Button>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover programa</DialogTitle>
            <DialogDescription>Remove este programa de milhas do cliente.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setDelOpen(false)}>Cancelar</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={excluir} disabled={loading}>
              {loading ? 'Removendo...' : 'Remover'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
