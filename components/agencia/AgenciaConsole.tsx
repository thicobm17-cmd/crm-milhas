'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileText, Loader2, Plane, Plus, Send, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { canaisVenda, cotacaoItemTipos, formatAgencyStatus } from '@/lib/agencia'
import { formatCurrency } from '@/lib/utils'

type Solicitacao = {
  id: string
  nome: string
  telefone: string
  email: string | null
  destinoDesejado: string | null
  dataViagem: string | null
  quantidadePassageiros: number
  origemLead: string
  status: string
  observacoes: string | null
}

type Cotacao = {
  id: string
  destino: string
  origemLead: string
  status: string
  dataViagem: string | null
  valorTotalVenda: number
  custoTotal: number
  lucroTotal: number
  margemPercentual: number
  programaMilhas: string | null
  quantidadeMilhas: number | null
  itens: Array<{ id: string; tipoItem: string; descricao: string; valorVenda: number; custoFornecedor: number; fornecedor: string | null }>
  solicitacao?: { nome: string; telefone: string } | null
}

type Viagem = {
  id: string
  destino: string
  status: string
  dataIda: string | null
  dataVolta: string | null
}

interface Props {
  solicitacoes: Solicitacao[]
  cotacoes: Cotacao[]
  viagens: Viagem[]
}

function money(value: number) {
  return formatCurrency(Number(value || 0))
}

export function AgenciaConsole({ solicitacoes, cotacoes, viagens }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState('')
  const [solForm, setSolForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    destinoDesejado: '',
    dataViagem: '',
    quantidadePassageiros: '1',
    origemLead: 'WhatsApp',
    observacoes: '',
  })
  const [cotForm, setCotForm] = useState({
    solicitacaoId: '',
    destino: '',
    dataViagem: '',
    origemLead: 'WhatsApp',
    tipoItem: 'AEREO',
    descricao: '',
    fornecedor: '',
    valorVenda: '',
    custoFornecedor: '',
    programaMilhas: '',
    quantidadeMilhas: '',
    custoMilheiro: '',
  })

  function updateSol(field: string, value: string) {
    setSolForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateCot(field: string, value: string) {
    setCotForm((prev) => ({ ...prev, [field]: value }))
  }

  async function submitSolicitacao(event: React.FormEvent) {
    event.preventDefault()
    setLoading('solicitacao')
    await fetch('/api/agencia/solicitacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(solForm),
    })
    setLoading('')
    setSolForm({ nome: '', telefone: '', email: '', destinoDesejado: '', dataViagem: '', quantidadePassageiros: '1', origemLead: 'WhatsApp', observacoes: '' })
    router.refresh()
  }

  async function converterSolicitacao(id: string) {
    setLoading(id)
    await fetch('/api/agencia/solicitacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'converter_cotacao' }),
    })
    setLoading('')
    router.refresh()
  }

  async function submitCotacao(event: React.FormEvent) {
    event.preventDefault()
    setLoading('cotacao')
    const solicitacao = solicitacoes.find((item) => item.id === cotForm.solicitacaoId)
    await fetch('/api/agencia/cotacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solicitacaoId: cotForm.solicitacaoId || null,
        destino: cotForm.destino || solicitacao?.destinoDesejado || 'Destino a definir',
        dataViagem: cotForm.dataViagem || solicitacao?.dataViagem,
        origemLead: cotForm.origemLead || solicitacao?.origemLead,
        programaMilhas: cotForm.programaMilhas || null,
        quantidadeMilhas: cotForm.quantidadeMilhas || null,
        custoMilheiro: cotForm.custoMilheiro || null,
        itens: [{
          tipoItem: cotForm.tipoItem,
          descricao: cotForm.descricao,
          fornecedor: cotForm.fornecedor,
          valorVenda: cotForm.valorVenda,
          custoFornecedor: cotForm.custoFornecedor,
        }],
      }),
    })
    setLoading('')
    setCotForm({ solicitacaoId: '', destino: '', dataViagem: '', origemLead: 'WhatsApp', tipoItem: 'AEREO', descricao: '', fornecedor: '', valorVenda: '', custoFornecedor: '', programaMilhas: '', quantidadeMilhas: '', custoMilheiro: '' })
    router.refresh()
  }

  async function aprovarCotacao(id: string) {
    setLoading(id)
    await fetch('/api/agencia/cotacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'aprovar' }),
    })
    setLoading('')
    router.refresh()
  }

  return (
    <Tabs defaultValue="pipeline" className="space-y-4">
      <TabsList className="max-w-full flex-wrap justify-start overflow-x-auto">
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
        <TabsTrigger value="cotacoes">Cotações</TabsTrigger>
        <TabsTrigger value="operacao">Operação</TabsTrigger>
        <TabsTrigger value="propostas">Propostas</TabsTrigger>
      </TabsList>

      <TabsContent value="pipeline" className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="atlas-panel"><CardContent className="p-3"><p className="text-sm text-muted-foreground">Solicitações recebidas</p><p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{solicitacoes.length}</p></CardContent></Card>
          <Card className="atlas-panel"><CardContent className="p-3"><p className="text-sm text-muted-foreground">Cotações enviadas</p><p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{cotacoes.filter(c => c.status === 'AGUARDANDO_CLIENTE').length}</p></CardContent></Card>
          <Card className="atlas-panel"><CardContent className="p-3"><p className="text-sm text-muted-foreground">Vendas aprovadas</p><p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{cotacoes.filter(c => c.status === 'APROVADA').length}</p></CardContent></Card>
          <Card className="atlas-panel"><CardContent className="p-3"><p className="text-sm text-muted-foreground">Viagens em andamento</p><p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{viagens.filter(v => v.status === 'EM_ANDAMENTO').length}</p></CardContent></Card>
        </div>
        <div className="grid gap-3 xl:grid-cols-3">
          {['Solicitação de Orçamento', 'Cotação', 'Operação da Viagem'].map((title, index) => (
            <Card key={title} className={index === 1 ? 'atlas-dark-panel' : 'atlas-panel'}>
              <CardHeader><CardTitle className={index === 1 ? 'text-[#f4d59a]' : ''}>{title}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(index === 0 ? solicitacoes.slice(0, 5) : index === 1 ? cotacoes.slice(0, 5) : viagens.slice(0, 5)).map((item) => (
                  <div key={item.id} className="rounded-md border border-[#d7ad68]/25 bg-white/70 p-2 text-[#11231f]">
                    <p className="font-medium">{'nome' in item ? item.nome : item.destino}</p>
                    <p className="text-xs text-muted-foreground">{formatAgencyStatus(item.status)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="solicitacoes" className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="atlas-panel">
          <CardHeader><CardTitle>Nova solicitação de orçamento</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submitSolicitacao} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>Nome</Label><Input value={solForm.nome} onChange={e => updateSol('nome', e.target.value)} required /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={solForm.telefone} onChange={e => updateSol('telefone', e.target.value)} required /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={solForm.email} onChange={e => updateSol('email', e.target.value)} /></div>
                <div className="space-y-2"><Label>Origem</Label><Select value={solForm.origemLead} onValueChange={v => updateSol('origemLead', v ?? 'WhatsApp')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{canaisVenda.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Destino desejado</Label><Input value={solForm.destinoDesejado} onChange={e => updateSol('destinoDesejado', e.target.value)} /></div>
                <div className="space-y-2"><Label>Data da viagem</Label><Input type="date" value={solForm.dataViagem} onChange={e => updateSol('dataViagem', e.target.value)} /></div>
                <div className="space-y-2"><Label>Passageiros</Label><Input type="number" min="1" value={solForm.quantidadePassageiros} onChange={e => updateSol('quantidadePassageiros', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Observações</Label><Textarea value={solForm.observacoes} onChange={e => updateSol('observacoes', e.target.value)} /></div>
              <Button disabled={loading === 'solicitacao'} className="w-full bg-[#0b3b31] text-[#f4d59a]">{loading === 'solicitacao' ? <Loader2 className="animate-spin" /> : <Plus size={16} />} Criar solicitação</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="atlas-panel">
          <CardHeader><CardTitle>Solicitações abertas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {solicitacoes.map((item) => (
              <div key={item.id} className="rounded-md border border-[#d7ad68]/25 bg-white/70 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="font-semibold">{item.nome}</p><p className="text-sm text-muted-foreground">{item.telefone} - {item.destinoDesejado || 'Destino a definir'}</p></div>
                  <Badge className="w-fit bg-blue-100 text-blue-800">{formatAgencyStatus(item.status)}</Badge>
                </div>
                <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => converterSolicitacao(item.id)} disabled={loading === item.id}>
                  {loading === item.id ? <Loader2 className="animate-spin" /> : <Send size={14} />} Converter em cotação
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cotacoes" className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="atlas-panel">
          <CardHeader><CardTitle>Nova cotação</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submitCotacao} className="space-y-3">
              <div className="space-y-2"><Label>Solicitação vinculada</Label><Select value={cotForm.solicitacaoId} onValueChange={v => updateCot('solicitacaoId', v ?? '')}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{solicitacoes.map(s => <SelectItem key={s.id} value={s.id}>{s.nome} - {s.destinoDesejado || 'Destino'}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>Destino</Label><Input value={cotForm.destino} onChange={e => updateCot('destino', e.target.value)} /></div>
                <div className="space-y-2"><Label>Data da viagem</Label><Input type="date" value={cotForm.dataViagem} onChange={e => updateCot('dataViagem', e.target.value)} /></div>
                <div className="space-y-2"><Label>Tipo do item</Label><Select value={cotForm.tipoItem} onValueChange={v => updateCot('tipoItem', v ?? 'AEREO')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{cotacaoItemTipos.map(t => <SelectItem key={t} value={t}>{formatAgencyStatus(t)}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Fornecedor</Label><Input value={cotForm.fornecedor} onChange={e => updateCot('fornecedor', e.target.value)} /></div>
                <div className="space-y-2 sm:col-span-2"><Label>Descrição</Label><Input value={cotForm.descricao} onChange={e => updateCot('descricao', e.target.value)} required /></div>
                <div className="space-y-2"><Label>Valor venda</Label><Input type="number" step="0.01" value={cotForm.valorVenda} onChange={e => updateCot('valorVenda', e.target.value)} /></div>
                <div className="space-y-2"><Label>Custo fornecedor</Label><Input type="number" step="0.01" value={cotForm.custoFornecedor} onChange={e => updateCot('custoFornecedor', e.target.value)} /></div>
                <div className="space-y-2"><Label>Programa milhas (opcional)</Label><Input value={cotForm.programaMilhas} onChange={e => updateCot('programaMilhas', e.target.value)} /></div>
                <div className="space-y-2"><Label>Milhas usadas</Label><Input type="number" value={cotForm.quantidadeMilhas} onChange={e => updateCot('quantidadeMilhas', e.target.value)} /></div>
                <div className="space-y-2"><Label>Custo milheiro</Label><Input type="number" step="0.01" value={cotForm.custoMilheiro} onChange={e => updateCot('custoMilheiro', e.target.value)} /></div>
              </div>
              <Button disabled={loading === 'cotacao'} className="w-full bg-[#0b3b31] text-[#f4d59a]">{loading === 'cotacao' ? <Loader2 className="animate-spin" /> : <FileText size={16} />} Criar cotação</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="atlas-panel">
          <CardHeader><CardTitle>Cotações</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cotacoes.map((cotacao) => (
              <div key={cotacao.id} className="rounded-md border border-[#d7ad68]/25 bg-white/70 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{cotacao.destino}</p>
                    <p className="text-sm text-muted-foreground">{cotacao.solicitacao?.nome || cotacao.origemLead} - {cotacao.itens.length} item(ns)</p>
                  </div>
                  <Badge className="w-fit bg-amber-100 text-amber-800">{formatAgencyStatus(cotacao.status)}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <p>Venda: <span className="font-semibold">{money(cotacao.valorTotalVenda)}</span></p>
                  <p>Custo: <span className="font-semibold">{money(cotacao.custoTotal)}</span></p>
                  <p>Lucro: <span className="font-semibold text-emerald-700">{money(cotacao.lucroTotal)}</span></p>
                </div>
                {cotacao.programaMilhas && <p className="mt-2 text-xs text-muted-foreground">Milhas como custo: {cotacao.quantidadeMilhas || 0} em {cotacao.programaMilhas}</p>}
                <Button type="button" size="sm" className="mt-3 bg-[#0b3b31] text-[#f4d59a]" onClick={() => aprovarCotacao(cotacao.id)} disabled={loading === cotacao.id || cotacao.status === 'APROVADA'}>
                  {loading === cotacao.id ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={14} />} Aprovar e iniciar operação
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="operacao" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {viagens.map((viagem) => (
          <Card key={viagem.id} className="atlas-panel">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plane size={18} /> {viagem.destino}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge className="bg-emerald-100 text-emerald-800">{formatAgencyStatus(viagem.status)}</Badge>
              <p className="text-muted-foreground">Ida: {viagem.dataIda ? new Date(viagem.dataIda).toLocaleDateString('pt-BR') : 'a definir'}</p>
              <p className="text-muted-foreground">Volta: {viagem.dataVolta ? new Date(viagem.dataVolta).toLocaleDateString('pt-BR') : 'a definir'}</p>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="propostas">
        <Card className="atlas-dark-panel">
          <CardHeader><CardTitle className="text-[#f4d59a]">Gerador de propostas</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm text-[#f8e7c4]/80 md:grid-cols-3">
            {['Capa com logo da agência', 'Destino, fotos e itinerário', 'Inclusos, não inclusos, pagamento e termos'].map((item) => (
              <div key={item} className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/65 p-3">
                <TrendingUp size={18} className="mb-2 text-[#d7ad68]" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
