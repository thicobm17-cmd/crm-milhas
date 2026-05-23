'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

interface Programa { id: number; nome: string; cor: string; companhia: string }

interface Props {
  clienteId: string
  programas: Programa[]
}

export function AdicionarContaForm({ clienteId, programas }: Props) {
  const [open, setOpen] = useState(false)
  const [programaId, setProgramaId] = useState('')
  const [numeroConta, setNumeroConta] = useState('')
  const [saldo, setSaldo] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAdd() {
    if (!programaId) return
    setLoading(true)

    await fetch('/api/contas-programas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId, programaId: parseInt(programaId), numeroConta, saldoAtual: parseInt(saldo) || 0 }),
    })

    setOpen(false)
    setProgramaId('')
    setNumeroConta('')
    setSaldo('')
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors w-full"
      >
        <Plus size={16} />
        Adicionar programa
      </button>
    )
  }

  return (
    <Card className="border-2 border-blue-200 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <h4 className="font-medium text-sm">Adicionar programa de fidelidade</h4>
        <div className="space-y-2">
          <Label className="text-xs">Programa</Label>
          <Select value={programaId} onValueChange={v => setProgramaId(v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {programas.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Número da conta / CPF do programa</Label>
          <Input placeholder="Ex: 12345678" value={numeroConta} onChange={e => setNumeroConta(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Saldo atual (milhas)</Label>
          <Input type="number" placeholder="0" value={saldo} onChange={e => setSaldo(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAdd} disabled={loading || !programaId}>
            {loading ? 'Salvando...' : 'Adicionar'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  )
}
