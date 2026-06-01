'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Minus, Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/utils'

type Movimento = {
  id: string
  tipo: string
  quantidade: number
  custoTotal: number
  descricao: string | null
  createdAt: string
}

type Estoque = {
  id: string
  programa: string
  logoUrl: string | null
  saldoAtual: number
  custoTotal: number
  custoMedioMilheiro: number
  clubeMensalMilhas: number
  clubeCustoMensal: number
  fornecedorNome: string | null
  fornecedorContato: string | null
  fornecedorEmail: string | null
  observacoes: string | null
  movimentacoes: Movimento[]
}

export function EstoqueMilhasConsole({ programas }: { programas: Estoque[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState('')
  const [fornecedorForms, setFornecedorForms] = useState<Record<string, Partial<Estoque>>>({})
  const [movForms, setMovForms] = useState<Record<string, { tipo: string; quantidade: string; custoTotal: string; descricao: string }>>({})

  const saldoTotal = programas.reduce((acc, item) => acc + item.saldoAtual, 0)
  const custoTotal = programas.reduce((acc, item) => acc + Number(item.custoTotal || 0), 0)
  const custoMedio = saldoTotal > 0 ? (custoTotal / saldoTotal) * 1000 : 0

  function fornecedorValue(programa: Estoque, field: keyof Estoque) {
    return String(fornecedorForms[programa.id]?.[field] ?? programa[field] ?? '')
  }

  function updateFornecedor(id: string, field: keyof Estoque, value: string) {
    setFornecedorForms((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  function movValue(id: string) {
    return movForms[id] || { tipo: 'ENTRADA', quantidade: '', custoTotal: '', descricao: '' }
  }

  function updateMov(id: string, field: string, value: string) {
    setMovForms((prev) => ({ ...prev, [id]: { ...movValue(id), [field]: value } }))
  }

  async function salvarFornecedor(programa: Estoque) {
    setLoading(`fornecedor-${programa.id}`)
    const form = fornecedorForms[programa.id] || {}
    await fetch('/api/estoque-milhas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: programa.id,
        action: 'fornecedor',
        fornecedorNome: form.fornecedorNome ?? programa.fornecedorNome,
        fornecedorContato: form.fornecedorContato ?? programa.fornecedorContato,
        fornecedorEmail: form.fornecedorEmail ?? programa.fornecedorEmail,
        observacoes: form.observacoes ?? programa.observacoes,
        clubeMensalMilhas: form.clubeMensalMilhas ?? programa.clubeMensalMilhas,
        clubeCustoMensal: form.clubeCustoMensal ?? programa.clubeCustoMensal,
      }),
    })
    setLoading('')
    router.refresh()
  }

  async function movimentar(programa: Estoque) {
    setLoading(`mov-${programa.id}`)
    await fetch('/api/estoque-milhas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: programa.id, ...movValue(programa.id) }),
    })
    setLoading('')
    setMovForms((prev) => ({ ...prev, [programa.id]: { tipo: 'ENTRADA', quantidade: '', custoTotal: '', descricao: '' } }))
    router.refresh()
  }

  async function aplicarClube(programa: Estoque) {
    setLoading(`clube-${programa.id}`)
    await fetch('/api/estoque-milhas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: programa.id, action: 'aplicar_clube' }),
    })
    setLoading('')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="atlas-panel"><CardContent className="p-3"><p className="text-sm text-muted-foreground">Milhas totais</p><p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{saldoTotal.toLocaleString('pt-BR')}</p></CardContent></Card>
        <Card className="atlas-panel"><CardContent className="p-3"><p className="text-sm text-muted-foreground">Custo total</p><p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{formatCurrency(custoTotal)}</p></CardContent></Card>
        <Card className="atlas-panel"><CardContent className="p-3"><p className="text-sm text-muted-foreground">Custo médio/milheiro</p><p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{formatCurrency(custoMedio)}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {programas.map((programa) => {
          const mov = movValue(programa.id)
          return (
            <Card key={programa.id} className="atlas-panel">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-24 overflow-hidden rounded-md border border-[#d7ad68]/30 bg-white">
                    {programa.logoUrl && <Image src={programa.logoUrl} alt={programa.programa} fill sizes="96px" className="object-cover" />}
                  </div>
                  <div>
                    <CardTitle>{programa.programa}</CardTitle>
                    <p className="text-sm text-muted-foreground">{programa.saldoAtual.toLocaleString('pt-BR')} milhas - {formatCurrency(Number(programa.custoMedioMilheiro || 0))}/milheiro</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Fornecedor</Label><Input value={fornecedorValue(programa, 'fornecedorNome')} onChange={e => updateFornecedor(programa.id, 'fornecedorNome', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Contato</Label><Input value={fornecedorValue(programa, 'fornecedorContato')} onChange={e => updateFornecedor(programa.id, 'fornecedorContato', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={fornecedorValue(programa, 'fornecedorEmail')} onChange={e => updateFornecedor(programa.id, 'fornecedorEmail', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Clube mensal</Label><Input type="number" value={fornecedorValue(programa, 'clubeMensalMilhas')} onChange={e => updateFornecedor(programa.id, 'clubeMensalMilhas', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Custo mensal do clube</Label><Input type="number" step="0.01" value={fornecedorValue(programa, 'clubeCustoMensal')} onChange={e => updateFornecedor(programa.id, 'clubeCustoMensal', e.target.value)} /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Observações</Label><Textarea value={fornecedorValue(programa, 'observacoes')} onChange={e => updateFornecedor(programa.id, 'observacoes', e.target.value)} /></div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => salvarFornecedor(programa)} disabled={loading === `fornecedor-${programa.id}`}>
                    {loading === `fornecedor-${programa.id}` ? <Loader2 className="animate-spin" /> : <Save size={15} />} Salvar configuração
                  </Button>
                  <Button type="button" className="bg-[#0b3b31] text-[#f4d59a]" onClick={() => aplicarClube(programa)} disabled={loading === `clube-${programa.id}`}>
                    {loading === `clube-${programa.id}` ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={15} />} Aplicar plano mensal
                  </Button>
                </div>

                <div className="rounded-md border border-[#d7ad68]/25 bg-white/65 p-3">
                  <p className="mb-3 font-medium text-[#0b3b31]">Movimentar estoque</p>
                  <div className="grid gap-2 sm:grid-cols-4">
                    <Select value={mov.tipo} onValueChange={v => updateMov(programa.id, 'tipo', v ?? 'ENTRADA')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTRADA">Entrada</SelectItem>
                        <SelectItem value="SAIDA">Saída</SelectItem>
                        <SelectItem value="AJUSTE">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Quantidade" value={mov.quantidade} onChange={e => updateMov(programa.id, 'quantidade', e.target.value)} />
                    <Input type="number" step="0.01" placeholder="Custo total" value={mov.custoTotal} onChange={e => updateMov(programa.id, 'custoTotal', e.target.value)} />
                    <Button type="button" onClick={() => movimentar(programa)} disabled={loading === `mov-${programa.id}`}>
                      {mov.tipo === 'SAIDA' ? <Minus size={15} /> : <Plus size={15} />} Registrar
                    </Button>
                  </div>
                  <Input className="mt-2" placeholder="Descrição" value={mov.descricao} onChange={e => updateMov(programa.id, 'descricao', e.target.value)} />
                </div>

                <div className="space-y-2">
                  {programa.movimentacoes.map((movimento) => (
                    <div key={movimento.id} className="flex items-center justify-between rounded-md bg-white/65 p-2 text-sm">
                      <span>{movimento.tipo} - {movimento.quantidade.toLocaleString('pt-BR')}</span>
                      <span className="font-medium">{formatCurrency(Number(movimento.custoTotal || 0))}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
