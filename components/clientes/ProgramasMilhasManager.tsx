'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/utils'
import { Calculator, CheckCircle2, CreditCard, Eye, Landmark, Minus, Pencil, Plus, Trash2 } from 'lucide-react'

interface Programa {
  id: number
  nome: string
  cor: string
  companhia: string
}

interface Movimento {
  id: string
  tipo: string
  quantidade: number
  custoTotal: number
  descricao: string | null
  createdAt: string
}

interface Conta {
  id: string
  programaId: number
  numeroConta: string | null
  saldoAtual: number
  valorMilheiro: number | null
  clubeMensalMilhas: number | null
  custoMensal: number | null
  ultimaAtualizacaoSaldo: string | null
  ultimaVisualizacao: string | null
  programa: Programa
  movimentacoes: Movimento[]
}

interface Cartao {
  id: string
  nome: string
  pontosPorDolar: number
  salasVipTotal: number
  salasVipUsadas: number
}

interface Props {
  clienteId: string
  programas: Programa[]
  contas: Conta[]
  cartoes: Cartao[]
}

function brNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatDate(value: string | null) {
  if (!value) return 'Nunca'
  return new Date(value).toLocaleDateString('pt-BR')
}

function diasDesde(value: string | null) {
  if (!value) return 999
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)
}

function alertClass(value: string | null) {
  const dias = diasDesde(value)
  if (dias >= 20) return 'bg-red-100 text-red-800'
  if (dias >= 15) return 'bg-amber-100 text-amber-800'
  return 'bg-emerald-100 text-emerald-800'
}

function parseDecimal(value: string) {
  return Number(value.replace(',', '.')) || 0
}

export function ProgramasMilhasManager({ clienteId, programas, contas, cartoes }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [contaEdit, setContaEdit] = useState<Conta | null>(null)
  const [contaMov, setContaMov] = useState<Conta | null>(null)
  const [contaDelete, setContaDelete] = useState<Conta | null>(null)
  const [cartaoEdit, setCartaoEdit] = useState<Cartao | null>(null)
  const [cartaoDelete, setCartaoDelete] = useState<Cartao | null>(null)
  const [programaForm, setProgramaForm] = useState({
    programaId: '',
    numeroConta: '',
    saldoAtual: '',
    custoInicial: '',
    clubeMensalMilhas: '',
    custoMensal: '',
  })
  const [cartaoForm, setCartaoForm] = useState({
    nome: '',
    pontosPorDolar: '',
    salasVipTotal: '',
    salasVipUsadas: '',
  })
  const [movForm, setMovForm] = useState({ quantidade: '', custoTotal: '', descricao: '' })
  const [editForm, setEditForm] = useState({ saldoAtual: '', numeroConta: '', clubeMensalMilhas: '', custoMensal: '' })
  const [calc, setCalc] = useState({
    cartaoId: cartoes[0]?.id || '',
    contaId: contas[0]?.id || '',
    valorFatura: '',
    cotacaoDolar: '5.00',
    custoTotal: '',
  })
  const [cotacaoStatus, setCotacaoStatus] = useState('Carregando cotacao do dia...')

  const selectedCard = useMemo(() => cartoes.find(c => c.id === calc.cartaoId) || null, [cartoes, calc.cartaoId])
  const pontosCalculados = useMemo(() => {
    const fatura = parseDecimal(calc.valorFatura)
    const dolar = parseDecimal(calc.cotacaoDolar)
    if (!selectedCard || fatura <= 0 || dolar <= 0) return 0
    return Math.floor((fatura / dolar) * selectedCard.pontosPorDolar)
  }, [calc.valorFatura, calc.cotacaoDolar, selectedCard])

  useEffect(() => {
    let active = true
    fetch('/api/cotacao-dolar', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!active) return
        if (!response.ok || !data?.cotacao) {
          setCotacaoStatus('Nao foi possivel carregar a cotacao automaticamente. Ajuste manualmente.')
          return
        }
        const cotacao = Number(data.cotacao)
        if (!Number.isFinite(cotacao) || cotacao <= 0) {
          setCotacaoStatus('Cotacao automatica invalida. Ajuste manualmente.')
          return
        }
        setCalc(prev => ({ ...prev, cotacaoDolar: cotacao.toFixed(4) }))
        setCotacaoStatus(`Cotacao do dia carregada automaticamente: ${cotacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
      })
      .catch(() => {
        if (active) setCotacaoStatus('Nao foi possivel carregar a cotacao automaticamente. Ajuste manualmente.')
      })

    return () => {
      active = false
    }
  }, [])

  function updatePrograma(field: string, value: string) {
    setProgramaForm(prev => ({ ...prev, [field]: value }))
  }

  function updateCartao(field: string, value: string) {
    setCartaoForm(prev => ({ ...prev, [field]: value }))
  }

  async function refreshAfter(action: () => Promise<Response>) {
    setSaving(true)
    const res = await action()
    setSaving(false)
    if (res.ok) router.refresh()
    return res
  }

  async function adicionarPrograma(e: React.FormEvent) {
    e.preventDefault()
    if (!programaForm.programaId) return
    const res = await refreshAfter(() => fetch('/api/contas-programas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId, ...programaForm, programaId: parseInt(programaForm.programaId) }),
    }))
    if (res.ok) {
      setProgramaForm({ programaId: '', numeroConta: '', saldoAtual: '', custoInicial: '', clubeMensalMilhas: '', custoMensal: '' })
    }
  }

  async function adicionarCartao(e: React.FormEvent) {
    e.preventDefault()
    if (!cartaoForm.nome) return
    const res = await refreshAfter(() => fetch('/api/cartoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId, ...cartaoForm }),
    }))
    if (res.ok) setCartaoForm({ nome: '', pontosPorDolar: '', salasVipTotal: '', salasVipUsadas: '' })
  }

  function abrirEdicao(conta: Conta) {
    setContaEdit(conta)
    setEditForm({
      saldoAtual: String(conta.saldoAtual),
      numeroConta: conta.numeroConta || '',
      clubeMensalMilhas: conta.clubeMensalMilhas ? String(conta.clubeMensalMilhas) : '',
      custoMensal: conta.custoMensal ? String(conta.custoMensal) : '',
    })
  }

  async function salvarConta(e: React.FormEvent) {
    e.preventDefault()
    if (!contaEdit) return
    const res = await refreshAfter(() => fetch('/api/contas-programas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: contaEdit.id, ...editForm }),
    }))
    if (res.ok) setContaEdit(null)
  }

  async function adicionarMilhas(e: React.FormEvent) {
    e.preventDefault()
    if (!contaMov) return
    const res = await refreshAfter(() => fetch('/api/contas-programas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: contaMov.id, action: 'adicionar_milhas', tipo: 'MANUAL', ...movForm }),
    }))
    if (res.ok) {
      setMovForm({ quantidade: '', custoTotal: '', descricao: '' })
      setContaMov(null)
    }
  }

  async function adicionarCalculado() {
    if (!calc.contaId || pontosCalculados <= 0) return
    const conta = contas.find(c => c.id === calc.contaId)
    const res = await refreshAfter(() => fetch('/api/contas-programas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: calc.contaId,
        action: 'adicionar_milhas',
        tipo: 'FATURA_CARTAO',
        quantidade: pontosCalculados,
        custoTotal: calc.custoTotal || '0',
        descricao: `Fatura ${selectedCard?.nome || 'cartao'} -> ${conta?.programa.nome || 'programa'}`,
        cartaoId: calc.cartaoId,
        faturaValor: calc.valorFatura,
        dolarCotacao: calc.cotacaoDolar,
        pontosPorDolar: selectedCard?.pontosPorDolar || 0,
      }),
    }))
    if (res.ok) setCalc(prev => ({ ...prev, valorFatura: '', custoTotal: '' }))
  }

  async function marcarVisualizado(id: string) {
    await refreshAfter(() => fetch('/api/contas-programas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'marcar_visualizado' }),
    }))
  }

  async function excluirConta() {
    if (!contaDelete) return
    const res = await refreshAfter(() => fetch(`/api/contas-programas?id=${contaDelete.id}`, { method: 'DELETE' }))
    if (res.ok) setContaDelete(null)
  }

  async function salvarCartao(e: React.FormEvent) {
    e.preventDefault()
    if (!cartaoEdit) return
    const res = await refreshAfter(() => fetch('/api/cartoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cartaoEdit.id, ...cartaoForm }),
    }))
    if (res.ok) setCartaoEdit(null)
  }

  function abrirCartao(cartao: Cartao) {
    setCartaoEdit(cartao)
    setCartaoForm({
      nome: cartao.nome,
      pontosPorDolar: String(cartao.pontosPorDolar),
      salasVipTotal: String(cartao.salasVipTotal),
      salasVipUsadas: String(cartao.salasVipUsadas),
    })
  }

  async function usarSala(id: string, action: 'usar_sala' | 'estornar_sala') {
    await refreshAfter(() => fetch('/api/cartoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    }))
  }

  async function excluirCartao() {
    if (!cartaoDelete) return
    const res = await refreshAfter(() => fetch(`/api/cartoes?id=${cartaoDelete.id}`, { method: 'DELETE' }))
    if (res.ok) setCartaoDelete(null)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Landmark size={18} /> Programas, contas e custo medio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {contas.length === 0 ? (
              <p className="rounded-md border border-dashed border-[#d7ad68]/40 bg-white/55 p-4 text-sm text-muted-foreground">
                Nenhum programa cadastrado ainda. Adicione o programa, numero da conta e saldo inicial do cliente.
              </p>
            ) : contas.map((conta) => (
              <div key={conta.id} className="rounded-lg border border-[#d7ad68]/25 bg-white/75 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 size-3 rounded-full" style={{ backgroundColor: conta.programa.cor }} />
                    <div>
                      <p className="font-semibold text-[#11231f]">{conta.programa.nome}</p>
                      <p className="text-sm text-muted-foreground">Conta / CPF: <span className="font-medium text-[#11231f]">{conta.numeroConta || 'Nao informado'}</span></p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge className={alertClass(conta.ultimaVisualizacao)}>Visualizado: {formatDate(conta.ultimaVisualizacao)}</Badge>
                        {conta.clubeMensalMilhas ? <Badge className="bg-blue-100 text-blue-800">Clube: {brNumber(conta.clubeMensalMilhas)}/mes</Badge> : null}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-[#0b3b31]">{brNumber(conta.saldoAtual)}</p>
                    <p className="text-xs text-muted-foreground">milhas/pontos</p>
                    <p className="mt-2 text-sm font-medium text-[#8f7040]">
                      Milheiro medio: {conta.valorMilheiro !== null ? formatCurrency(conta.valorMilheiro) : 'sem custo'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2.5 md:grid-cols-3">
                  <div className="rounded-md bg-[#0b3b31] p-2.5 text-[#f8e7c4]">
                    <p className="text-xs text-[#d7ad68]">Ultima atualizacao</p>
                    <p className="mt-1 text-sm font-semibold">{formatDate(conta.ultimaAtualizacaoSaldo)}</p>
                  </div>
                  <div className="rounded-md bg-white p-2.5">
                    <p className="text-xs text-muted-foreground">Custo mensal do clube</p>
                    <p className="mt-1 text-sm font-semibold">{conta.custoMensal ? formatCurrency(conta.custoMensal) : 'Nao informado'}</p>
                  </div>
                  <div className="rounded-md bg-white p-2.5">
                    <p className="text-xs text-muted-foreground">Lancamentos registrados</p>
                    <p className="mt-1 text-sm font-semibold">{conta.movimentacoes.length}</p>
                  </div>
                </div>

                {conta.movimentacoes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase text-[#8f7040]">Ultimos lancamentos</p>
                    {conta.movimentacoes.slice(0, 3).map((mov) => (
                      <div key={mov.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[#fbf4e8] p-2 text-xs">
                        <span>{brNumber(mov.quantidade)} milhas - {mov.tipo}</span>
                        <span>{formatCurrency(mov.custoTotal)} - {new Date(mov.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" className="bg-[#0b3b31] text-[#f4d59a]" onClick={() => setContaMov(conta)}><Plus size={14} /> Adicionar milhas</Button>
                  <Button size="sm" variant="outline" onClick={() => marcarVisualizado(conta.id)}><Eye size={14} /> Marcar visto hoje</Button>
                  <Button size="sm" variant="outline" onClick={() => abrirEdicao(conta)}><Pencil size={14} /> Editar conta</Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setContaDelete(conta)}><Trash2 size={14} /> Remover</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="atlas-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator size={18} /> Calculadora de fatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="space-y-2">
                <Label>Cartao utilizado</Label>
                <Select value={calc.cartaoId} onValueChange={v => setCalc(prev => ({ ...prev, cartaoId: v ?? '' }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {cartoes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome} - {c.pontosPorDolar} pts/USD</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Programa que vai receber</Label>
                <Select value={calc.contaId} onValueChange={v => setCalc(prev => ({ ...prev, contaId: v ?? '' }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {contas.map(c => <SelectItem key={c.id} value={c.id}>{c.programa.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fatura (R$)</Label>
                  <Input type="number" step="0.01" value={calc.valorFatura} onChange={e => setCalc(prev => ({ ...prev, valorFatura: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Cotacao do dolar</Label>
                  <Input type="number" step="0.0001" value={calc.cotacaoDolar} onChange={e => setCalc(prev => ({ ...prev, cotacaoDolar: e.target.value }))} />
                  <p className="text-xs text-muted-foreground">{cotacaoStatus}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Custo para gerar esses pontos (opcional)</Label>
                <Input type="number" step="0.01" value={calc.custoTotal} onChange={e => setCalc(prev => ({ ...prev, custoTotal: e.target.value }))} placeholder="0,00" />
              </div>
              <div className="rounded-md bg-[#0b3b31] p-3 text-[#f8e7c4]">
                <p className="text-xs text-[#d7ad68]">Resultado exato pela fatura</p>
                <p className="mt-1 text-2xl font-semibold">{brNumber(pontosCalculados)} pontos</p>
                <p className="text-xs text-[#f8e7c4]/70">Formula: fatura / cotacao do dolar x pontos por dolar do cartao.</p>
              </div>
              <Button type="button" disabled={saving || pontosCalculados <= 0 || !calc.contaId} onClick={adicionarCalculado} className="w-full bg-[#0b3b31] text-[#f4d59a]">
                <Plus size={15} /> Adicionar ao programa
              </Button>
            </CardContent>
          </Card>

          <Card className="atlas-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard size={18} /> Cartoes do cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {cartoes.map((cartao) => {
                const restantes = Math.max(0, cartao.salasVipTotal - cartao.salasVipUsadas)
                return (
                  <div key={cartao.id} className="rounded-md border border-[#d7ad68]/25 bg-white/75 p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-[#11231f]">{cartao.nome}</p>
                        <p className="text-xs text-muted-foreground">{cartao.pontosPorDolar} pontos por dolar</p>
                      </div>
                      <Button size="icon-sm" variant="ghost" onClick={() => abrirCartao(cartao)}><Pencil size={13} /></Button>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-md bg-[#fbf4e8] p-2 text-sm">
                      <span>Salas VIP restantes</span>
                      <span className="font-semibold">{restantes} / {cartao.salasVipTotal}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button type="button" size="xs" variant="outline" onClick={() => usarSala(cartao.id, 'usar_sala')}><Minus size={12} /> Usou sala</Button>
                      <Button type="button" size="xs" variant="outline" onClick={() => usarSala(cartao.id, 'estornar_sala')}>Estornar</Button>
                      <Button type="button" size="xs" variant="ghost" className="text-red-600" onClick={() => setCartaoDelete(cartao)}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                )
              })}

              <form onSubmit={adicionarCartao} className="rounded-md border border-dashed border-[#d7ad68]/40 bg-white/50 p-3">
                <p className="mb-2 text-sm font-medium text-[#0b3b31]">Adicionar cartao</p>
                <div className="space-y-2">
                  <Input placeholder="Nome do cartao" value={cartaoForm.nome} onChange={e => updateCartao('nome', e.target.value)} />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Input type="number" step="0.01" placeholder="Pts/USD" value={cartaoForm.pontosPorDolar} onChange={e => updateCartao('pontosPorDolar', e.target.value)} />
                    <Input type="number" placeholder="VIP total" value={cartaoForm.salasVipTotal} onChange={e => updateCartao('salasVipTotal', e.target.value)} />
                    <Input type="number" placeholder="VIP usadas" value={cartaoForm.salasVipUsadas} onChange={e => updateCartao('salasVipUsadas', e.target.value)} />
                  </div>
                  <Button type="submit" disabled={saving || !cartaoForm.nome} className="w-full bg-[#0b3b31] text-[#f4d59a]"><Plus size={15} /> Salvar cartao</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="atlas-panel">
        <CardHeader>
          <CardTitle>Adicionar programa de fidelidade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={adicionarPrograma} className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Programa</Label>
              <Select value={programaForm.programaId} onValueChange={v => updatePrograma('programaId', v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {programas.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Numero da conta / CPF</Label>
              <Input value={programaForm.numeroConta} onChange={e => updatePrograma('numeroConta', e.target.value)} placeholder="Ex: 12345678 ou CPF" />
            </div>
            <div className="space-y-2">
              <Label>Saldo inicial</Label>
              <Input type="number" value={programaForm.saldoAtual} onChange={e => updatePrograma('saldoAtual', e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Custo do saldo inicial (R$)</Label>
              <Input type="number" step="0.01" value={programaForm.custoInicial} onChange={e => updatePrograma('custoInicial', e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Clube mensal (milhas)</Label>
              <Input type="number" value={programaForm.clubeMensalMilhas} onChange={e => updatePrograma('clubeMensalMilhas', e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label>Custo mensal do clube</Label>
              <Input type="number" step="0.01" value={programaForm.custoMensal} onChange={e => updatePrograma('custoMensal', e.target.value)} placeholder="Opcional" />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={saving || !programaForm.programaId} className="bg-[#0b3b31] text-[#f4d59a]">
                <Plus size={15} /> Adicionar programa
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={!!contaMov} onOpenChange={(open) => !open && setContaMov(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar milhas em {contaMov?.programa.nome}</DialogTitle></DialogHeader>
          <form onSubmit={adicionarMilhas} className="space-y-3">
            <div className="space-y-2">
              <Label>Quantidade de milhas/pontos</Label>
              <Input type="number" value={movForm.quantidade} onChange={e => setMovForm(prev => ({ ...prev, quantidade: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Quanto foi gasto para conseguir (R$)</Label>
              <Input type="number" step="0.01" value={movForm.custoTotal} onChange={e => setMovForm(prev => ({ ...prev, custoTotal: e.target.value }))} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Observacao</Label>
              <Textarea value={movForm.descricao} onChange={e => setMovForm(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Ex: compra bonificada, transferencia, clube..." />
            </div>
            <Button type="submit" disabled={saving} className="bg-[#0b3b31] text-[#f4d59a]"><CheckCircle2 size={15} /> Somar no programa</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!contaEdit} onOpenChange={(open) => !open && setContaEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar conta do programa</DialogTitle></DialogHeader>
          <form onSubmit={salvarConta} className="space-y-3">
            <div className="space-y-2">
              <Label>Numero da conta / CPF</Label>
              <Input value={editForm.numeroConta} onChange={e => setEditForm(prev => ({ ...prev, numeroConta: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Saldo atual</Label>
              <Input type="number" value={editForm.saldoAtual} onChange={e => setEditForm(prev => ({ ...prev, saldoAtual: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Clube mensal</Label>
                <Input type="number" value={editForm.clubeMensalMilhas} onChange={e => setEditForm(prev => ({ ...prev, clubeMensalMilhas: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Custo mensal</Label>
                <Input type="number" step="0.01" value={editForm.custoMensal} onChange={e => setEditForm(prev => ({ ...prev, custoMensal: e.target.value }))} />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="bg-[#0b3b31] text-[#f4d59a]">Salvar conta</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cartaoEdit} onOpenChange={(open) => !open && setCartaoEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar cartao</DialogTitle></DialogHeader>
          <form onSubmit={salvarCartao} className="space-y-3">
            <div className="space-y-2"><Label>Nome</Label><Input value={cartaoForm.nome} onChange={e => updateCartao('nome', e.target.value)} /></div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="space-y-2"><Label>Pts/USD</Label><Input type="number" step="0.01" value={cartaoForm.pontosPorDolar} onChange={e => updateCartao('pontosPorDolar', e.target.value)} /></div>
              <div className="space-y-2"><Label>VIP total</Label><Input type="number" value={cartaoForm.salasVipTotal} onChange={e => updateCartao('salasVipTotal', e.target.value)} /></div>
              <div className="space-y-2"><Label>VIP usadas</Label><Input type="number" value={cartaoForm.salasVipUsadas} onChange={e => updateCartao('salasVipUsadas', e.target.value)} /></div>
            </div>
            <Button type="submit" disabled={saving} className="bg-[#0b3b31] text-[#f4d59a]">Salvar cartao</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!contaDelete} onOpenChange={(open) => !open && setContaDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover programa</DialogTitle>
            <DialogDescription>Remove a conta {contaDelete?.programa.nome} e todo o historico de movimentacoes dela.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setContaDelete(null)}>Cancelar</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" disabled={saving} onClick={excluirConta}>Remover</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cartaoDelete} onOpenChange={(open) => !open && setCartaoDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover cartao</DialogTitle>
            <DialogDescription>Remove o cartao {cartaoDelete?.nome} do cliente.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCartaoDelete(null)}>Cancelar</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" disabled={saving} onClick={excluirCartao}>Remover</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
