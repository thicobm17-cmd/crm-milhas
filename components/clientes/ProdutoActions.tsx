'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2 } from 'lucide-react'

interface Props {
  id: string
  status: string
}

const statusLabels: Record<string, string> = {
  EM_COTACAO: 'Em cotacao',
  EMITIDO: 'Emitido',
}

export function ProdutoActions({ id, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function mudarStatus(novo: string) {
    setLoading(true)
    await fetch('/api/produtos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'status', status: novo }),
    })
    setLoading(false)
    router.refresh()
  }

  async function excluir() {
    setLoading(true)
    await fetch(`/api/produtos?id=${id}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      <Select value={status} onValueChange={v => mudarStatus(v ?? status)} disabled={loading}>
        <SelectTrigger className="h-7 w-[120px] text-xs">
          <SelectValue>{value => statusLabels[String(value)] ?? 'Em cotacao'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EM_COTACAO">Em cotacao</SelectItem>
          <SelectItem value="EMITIDO">Emitido</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon-sm" className="text-red-600" title="Excluir" onClick={excluir} disabled={loading}>
        <Trash2 size={13} />
      </Button>
    </div>
  )
}
