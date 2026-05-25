'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Check, Pencil, RotateCcw, Trash2 } from 'lucide-react'

const tipoItems: Record<string, string> = {
  receita: 'Produto contratado / receita',
  receita_emissao: 'Receita de emissao',
  compra_milhas: 'Compra de Milhas',
  despesa: 'Despesa',
  imposto: 'Imposto de renda',
}

const mesesItems: Record<string, string> = {
  '0': 'Nao alterar acesso',
  '12': 'Renovar +12 meses (anual)',
  '6': 'Renovar +6 meses',
  '3': 'Renovar +3 meses',
  '24': 'Renovar +24 meses',
}

interface Transacao {
  id: string
  tipo: string
  descricao: string
  valor: number
  pago: boolean
  recorrente: boolean
  recorrenteAte: string | null
  dataVencimento: string | null
  temCliente: boolean
}

export function TransacaoActions({ transacao }: { transacao: Transacao }) {
  const router = useRouter()
  const [pagarOpen, setPagarOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [meses, setMeses] = useState('0')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    tipo: transacao.tipo,
    descricao: transacao.descricao,
    valor: String(transacao.valor),
    dataVencimento: transacao.dataVencimento ?? '',
    recorrente: transacao.recorrente,
    recorrenteAte: transacao.recorrenteAte ?? '',
  })

  function update(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const ehDespesa = form.tipo === 'despesa' || form.tipo === 'imposto' || form.tipo === 'compra_milhas'

  async function confirmarPagamento() {
    setLoading(true)
    await fetch('/api/transacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: transacao.id, action: 'marcar_pago', mesesAcesso: meses }),
    })
    setLoading(false)
    setPagarOpen(false)
    router.refresh()
  }

  async function marcarPendente() {
    setLoading(true)
    await fetch('/api/transacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: transacao.id, action: 'marcar_pendente' }),
    })
    setLoading(false)
    router.refresh()
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/transacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: transacao.id, action: 'editar', ...form }),
    })
    setLoading(false)
    setEditOpen(false)
    router.refresh()
  }

  async function excluir() {
    setLoading(true)
    await fetch(`/api/transacoes?id=${transacao.id}`, { method: 'DELETE' })
    setLoading(false)
    setDelOpen(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      {!transacao.recorrente && (
        transacao.pago ? (
          <Button variant="ghost" size="icon-sm" title="Marcar como pendente" onClick={marcarPendente} disabled={loading}>
            <RotateCcw size={14} />
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" title="Marcar como pago" className="text-emerald-700" onClick={() => setPagarOpen(true)}>
            <Check size={15} />
          </Button>
        )
      )}
      <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => setEditOpen(true)}>
        <Pencil size={13} />
      </Button>
      <Button variant="ghost" size="icon-sm" title="Excluir" className="text-red-600" onClick={() => setDelOpen(true)}>
        <Trash2 size={14} />
      </Button>

      {/* Editar transacao */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar transacao</DialogTitle></DialogHeader>
          <form onSubmit={salvarEdicao} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select items={tipoItems} value={form.tipo} onValueChange={v => update('tipo', v ?? form.tipo)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Input value={form.descricao} onChange={e => update('descricao', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => update('valor', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input type="date" value={form.dataVencimento} onChange={e => update('dataVencimento', e.target.value)} />
              </div>
            </div>
            {ehDespesa && (
              <div className="space-y-3 rounded-md border border-[#d7ad68]/30 bg-[#fbf6ec] p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#0b3b31]">
                  <input type="checkbox" checked={form.recorrente} onChange={e => update('recorrente', e.target.checked)} className="size-4 accent-[#0b3b31]" />
                  Despesa fixa (repete todo mes)
                </label>
                {form.recorrente && (
                  <div className="space-y-2">
                    <Label className="text-xs">Repetir ate (opcional)</Label>
                    <Input type="date" value={form.recorrenteAte} onChange={e => update('recorrenteAte', e.target.value)} />
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading} className="bg-[#0b3b31] text-[#f4d59a]">{loading ? 'Salvando...' : 'Salvar'}</Button>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Marcar pago */}
      <Dialog open={pagarOpen} onOpenChange={setPagarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pagamento</DialogTitle>
            <DialogDescription>
              {transacao.temCliente
                ? 'Plano anual: ao confirmar, define quando o acesso do cliente vence. Nao ha cobranca mensal.'
                : 'Confirmar o recebimento desta transacao.'}
            </DialogDescription>
          </DialogHeader>
          {transacao.temCliente && (
            <div className="space-y-2">
              <Label>Renovar acesso? (a duracao ja foi definida no cadastro)</Label>
              <Select items={mesesItems} value={meses} onValueChange={v => setMeses(v ?? '0')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nao alterar acesso</SelectItem>
                  <SelectItem value="12">Renovar +12 meses (anual)</SelectItem>
                  <SelectItem value="6">Renovar +6 meses</SelectItem>
                  <SelectItem value="3">Renovar +3 meses</SelectItem>
                  <SelectItem value="24">Renovar +24 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={confirmarPagamento} disabled={loading}>
              {loading ? 'Confirmando...' : 'Confirmar pagamento'}
            </Button>
            <Button variant="outline" onClick={() => setPagarOpen(false)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excluir */}
      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir transacao</DialogTitle>
            <DialogDescription>Esta acao nao pode ser desfeita.</DialogDescription>
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
