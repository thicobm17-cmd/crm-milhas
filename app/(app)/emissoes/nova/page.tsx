'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface ClienteSimples { id: string; nome: string; cpf: string | null; dataNascimento: string | null }
interface Programa { id: number; nome: string; cor: string; companhia: string }

function NovaEmissaoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [clientes, setClientes] = useState<ClienteSimples[]>([])
  const [programas, setProgramas] = useState<Programa[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    clienteId: searchParams.get('cliente') ?? '',
    programaId: '',
    origem: '',
    destino: '',
    dataVoo: '',
    passageiros: '1',
    milhasUtilizadas: '',
    precoMercado: '',
    taxasPagas: '',
    feeCobrado: '',
    classe: 'Econômica',
    observacoes: '',
    status: 'confirmada',
  })

  const economia = (parseFloat(form.precoMercado) || 0) -
    (parseFloat(form.taxasPagas) || 0) -
    (parseFloat(form.feeCobrado) || 0)

  const clienteSelecionado = clientes.find(c => c.id === form.clienteId)

  useEffect(() => {
    async function load() {
      const [c, p] = await Promise.all([
        fetch('/api/clientes').then(r => r.json()),
        fetch('/api/programas').then(r => r.json()),
      ])
      setClientes(c)
      setProgramas(p)
    }
    load()
  }, [])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clienteId || !form.origem || !form.destino || !form.dataVoo) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/emissoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erro ao registrar.'); setLoading(false); return }
    router.push(`/clientes/${form.clienteId}`)
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/emissoes"><Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" /> Emissões</Button></Link>
        <h1 className="text-2xl font-bold text-slate-900">Nova Emissão</h1>
      </div>

      {economia > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
          <TrendingUp className="text-green-600" size={20} />
          <div>
            <p className="text-sm font-semibold text-green-700">Economia para o cliente</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(economia)}</p>
          </div>
        </div>
      )}

      <Card className="atlas-panel">
        <CardHeader><CardTitle className="text-base">Dados da emissão</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Cliente *</Label>
                <Select value={form.clienteId} onValueChange={v => update('clienteId', v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente..." /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                {clienteSelecionado && (clienteSelecionado.cpf || clienteSelecionado.dataNascimento) && (
                  <p className="rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                    {clienteSelecionado.cpf && <>CPF: <span className="font-medium">{clienteSelecionado.cpf}</span></>}
                    {clienteSelecionado.cpf && clienteSelecionado.dataNascimento && ' - '}
                    {clienteSelecionado.dataNascimento && <>Nascimento: <span className="font-medium">{new Date(clienteSelecionado.dataNascimento).toLocaleDateString('pt-BR')}</span></>}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Origem * (IATA)</Label>
                <Input placeholder="GRU" maxLength={3} value={form.origem} onChange={e => update('origem', e.target.value)} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Destino * (IATA)</Label>
                <Input placeholder="LHR" maxLength={3} value={form.destino} onChange={e => update('destino', e.target.value)} className="uppercase" />
              </div>

              <div className="space-y-2">
                <Label>Data do voo *</Label>
                <Input type="date" value={form.dataVoo} onChange={e => update('dataVoo', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Passageiros</Label>
                <Input type="number" min="1" value={form.passageiros} onChange={e => update('passageiros', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Programa de fidelidade</Label>
                <Select value={form.programaId} onValueChange={v => update('programaId', v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {programas.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Classe</Label>
                <Select value={form.classe} onValueChange={v => update('classe', v ?? 'Econômica')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Econômica">Econômica</SelectItem>
                    <SelectItem value="Executiva">Executiva</SelectItem>
                    <SelectItem value="Primeira Classe">Primeira Classe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Milhas utilizadas</Label>
                <Input type="number" placeholder="50000" value={form.milhasUtilizadas} onChange={e => update('milhasUtilizadas', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => update('status', v ?? 'confirmada')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-3 font-medium text-slate-700">Valores (base para calcular economia)</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Preço de mercado (R$) *</Label>
                  <Input type="number" step="0.01" placeholder="5000,00" value={form.precoMercado} onChange={e => update('precoMercado', e.target.value)} />
                  <p className="text-xs text-slate-400">Quanto custaria sem milhas</p>
                </div>
                <div className="space-y-2">
                  <Label>Taxas + tarifas pagas (R$)</Label>
                  <Input type="number" step="0.01" placeholder="350,00" value={form.taxasPagas} onChange={e => update('taxasPagas', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Preco Atlas / valor cobrado (R$)</Label>
                  <Input type="number" step="0.01" placeholder="200,00" value={form.feeCobrado} onChange={e => update('feeCobrado', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Detalhes adicionais, conexões, bagagem..." value={form.observacoes} onChange={e => update('observacoes', e.target.value)} rows={2} />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Registrar emissão'}</Button>
              <Link href="/emissoes"><Button type="button" variant="outline">Cancelar</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NovaEmissaoPage() {
  return <Suspense><NovaEmissaoForm /></Suspense>
}
