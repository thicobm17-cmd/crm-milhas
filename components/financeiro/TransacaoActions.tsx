'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Check, RotateCcw, Trash2 } from 'lucide-react'

interface Props {
  id: string
  pago: boolean
  temCliente: boolean
}

export function TransacaoActions({ id, pago, temCliente }: Props) {
  const router = useRouter()
  const [pagarOpen, setPagarOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [meses, setMeses] = useState('12')
  const [loading, setLoading] = useState(false)

  async function confirmarPagamento() {
    setLoading(true)
    await fetch('/api/transacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'marcar_pago', mesesAcesso: meses }),
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
      body: JSON.stringify({ id, action: 'marcar_pendente' }),
    })
    setLoading(false)
    router.refresh()
  }

  async function excluir() {
    setLoading(true)
    await fetch(`/api/transacoes?id=${id}`, { method: 'DELETE' })
    setLoading(false)
    setDelOpen(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      {pago ? (
        <Button variant="ghost" size="icon-sm" title="Marcar como pendente" onClick={marcarPendente} disabled={loading}>
          <RotateCcw size={14} />
        </Button>
      ) : (
        <Button variant="ghost" size="icon-sm" title="Marcar como pago" className="text-emerald-700" onClick={() => setPagarOpen(true)}>
          <Check size={15} />
        </Button>
      )}
      <Button variant="ghost" size="icon-sm" title="Excluir" className="text-red-600" onClick={() => setDelOpen(true)}>
        <Trash2 size={14} />
      </Button>

      <Dialog open={pagarOpen} onOpenChange={setPagarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pagamento</DialogTitle>
            <DialogDescription>
              {temCliente
                ? 'Plano anual: ao confirmar, define quando o acesso do cliente vence. Nao ha cobranca mensal.'
                : 'Confirmar o recebimento desta transacao.'}
            </DialogDescription>
          </DialogHeader>
          {temCliente && (
            <div className="space-y-2">
              <Label>Duracao do plano (vencimento do acesso)</Label>
              <Select value={meses} onValueChange={v => setMeses(v ?? '12')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 meses (anual)</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="24">24 meses</SelectItem>
                  <SelectItem value="0">Nao alterar acesso</SelectItem>
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
