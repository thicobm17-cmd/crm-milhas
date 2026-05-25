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

const tipoItems: Record<string, string> = {
  receita: 'Produto contratado / receita',
  receita_emissao: 'Receita de emissao',
  compra_milhas: 'Compra de Milhas',
  despesa: 'Despesa',
  imposto: 'Imposto de renda',
}

const statusItems: Record<string, string> = {
  false: 'Pendente',
  true: 'Pago/Recebido',
}

export function NovaTransacaoForm({ clientes }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [form, setForm] = useState({
    tipo: 'receita', descricao: '', valor: '', clienteId: '', dataVencimento: '', pago: 'false',
    recorrente: false, recorrenteAte: '',
  })

  function update(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const ehDespesa = form.tipo === 'despesa' || form.tipo === 'imposto' || form.tipo === 'compra_milhas'
  const clienteItems: Record<string, string> = {
    '': 'Nenhum',
    ...Object.fromEntries(clientes.map(c => [c.id, c.nome])),
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
    setForm({ tipo: 'receita', descricao: '', valor: '', clienteId: '', dataVencimento: '', pago: 'false', recorrente: false, recorrenteAte: '' })
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
              <Select items={tipoItems} value={form.tipo} onValueChange={v => update('tipo', v ?? 'receita')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
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
              <Select items={clienteItems} value={form.clienteId} onValueChange={v => update('clienteId', v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {ehDespesa && (
              <div className="space-y-3 rounded-md border border-[#d7ad68]/30 bg-[#fbf6ec] p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#0b3b31]">
                  <input
                    type="checkbox"
                    checked={form.recorrente}
                    onChange={e => update('recorrente', e.target.checked)}
                    className="size-4 accent-[#0b3b31]"
                  />
                  Despesa fixa (repete todo mes)
                </label>
                {form.recorrente && (
                  <div className="space-y-2">
                    <Label className="text-xs">Repetir ate (opcional)</Label>
                    <Input type="date" value={form.recorrenteAte} onChange={e => update('recorrenteAte', e.target.value)} />
                    <p className="text-xs text-muted-foreground">Deixe vazio para repetir indefinidamente, ate voce remover.</p>
                  </div>
                )}
              </div>
            )}

            {!form.recorrente && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select items={statusItems} value={form.pago} onValueChange={v => update('pago', v ?? 'false')}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Pendente</SelectItem>
                    <SelectItem value="true">Pago/Recebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
