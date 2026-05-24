'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

interface ClienteSimples { id: string; nome: string }

interface Props {
  clientes: ClienteSimples[]
}

export function NovaTransacaoForm({ clientes }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [form, setForm] = useState({
    tipo: 'receita', descricao: '', valor: '', clienteId: '', dataVencimento: '', pago: 'false',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descricao || !form.valor) return
    setLoading(true)

    await fetch('/api/transacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setOpen(false)
    setForm({ tipo: 'receita', descricao: '', valor: '', clienteId: '', dataVencimento: '', pago: 'false' })
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <Button className="flex items-center gap-2" onClick={() => setOpen(true)}>
        <Plus size={16} />Nova transação
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => update('tipo', v ?? 'receita')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Produto contratado / receita</SelectItem>
                  <SelectItem value="receita_emissao">Receita de emissao</SelectItem>
                  <SelectItem value="compra_milhas">Compra de Milhas</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={e => update('descricao', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => update('valor', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input type="date" value={form.dataVencimento} onChange={e => update('dataVencimento', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <Select value={form.clienteId} onValueChange={v => update('clienteId', v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.pago} onValueChange={v => update('pago', v ?? 'false')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Pendente</SelectItem>
                  <SelectItem value="true">Pago/Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Registrar'}</Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
