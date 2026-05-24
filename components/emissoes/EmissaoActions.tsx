'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'

interface Props {
  id: string
  status: string
}

export function EmissaoActions({ id, status }: Props) {
  const router = useRouter()
  const [delOpen, setDelOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function mudarStatus(novo: string) {
    setLoading(true)
    await fetch('/api/emissoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: novo }),
    })
    setLoading(false)
    router.refresh()
  }

  async function excluir() {
    setLoading(true)
    await fetch(`/api/emissoes?id=${id}`, { method: 'DELETE' })
    setLoading(false)
    setDelOpen(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={v => mudarStatus(v ?? status)}>
        <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="confirmada">Confirmada</SelectItem>
          <SelectItem value="cancelada">Cancelada</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon-sm" className="text-red-600" title="Excluir" onClick={() => setDelOpen(true)} disabled={loading}>
        <Trash2 size={14} />
      </Button>

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir emissao</DialogTitle>
            <DialogDescription>Remove a emissao e as receitas vinculadas. Nao pode ser desfeito.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setDelOpen(false)}>Cancelar</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={excluir} disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
