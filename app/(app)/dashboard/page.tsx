import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getClientesComResumo, toNum, parsePeriodo, intervaloPeriodo, nomesMeses, getSerieFinanceiraAno } from '@/lib/queries'
import { dashboardPanels } from '@/lib/atlas-spec'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { FinanceLineChart } from '@/components/dashboard/FinanceLineChart'
import { CheckinButton } from '@/components/dashboard/CheckinButton'
import { PeriodoFilter } from '@/components/shared/PeriodoFilter'
import { Bell, Clock3, Plane, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ mes?: string; ano?: string }>
}

// Calcula cor/label do check-in conforme proximidade da data (PDF Atlas)
function checkinAlerta(data: Date | null) {
  if (!data) return { label: 'Sem data', cor: 'bg-stone-100 text-stone-700' }
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(data)
  alvo.setHours(0, 0, 0, 0)
  const dias = Math.round((alvo.getTime() - hoje.getTime()) / 86400000)
  if (dias <= 0) return { label: 'Embarque hoje', cor: 'bg-red-100 text-red-800' }
  if (dias === 1) return { label: 'Falta 1 dia', cor: 'bg-amber-100 text-amber-800' }
  if (dias <= 2) return { label: 'Check-in disponivel', cor: 'bg-emerald-100 text-emerald-800' }
  return { label: `Em ${dias} dias`, cor: 'bg-stone-100 text-stone-700' }
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth()
  const gestorId = session!.user.id
  const periodo = parsePeriodo(await searchParams)
  const intervalo = intervaloPeriodo(periodo)
  const labelPeriodo = periodo.mes === 0 ? `Ano ${periodo.ano}` : `${nomesMeses[periodo.mes - 1]}/${periodo.ano}`

  const [clientes, emissoesPendentes, transacoes, checkinProdutos, serieFinanceira] = await Promise.all([
    getClientesComResumo(gestorId),
    prisma.emissao.findMany({
      where: { gestorId, status: { not: 'confirmada' } },
      include: { cliente: { select: { nome: true } } },
      orderBy: { dataVoo: 'asc' },
      take: 8,
    }),
    prisma.transacao.findMany({
      where: { gestorId, pago: true, dataPagamento: { gte: intervalo.gte, lt: intervalo.lt } },
    }),
    prisma.produtoCliente.findMany({
      where: {
        tipo: 'PASSAGEM',
        status: 'EMITIDO',
        checkinRealizado: false,
        cliente: { gestorId },
      },
      include: { cliente: { select: { nome: true } } },
      orderBy: { dataInicio: 'asc' },
      take: 6,
    }),
    getSerieFinanceiraAno(gestorId, periodo.ano),
  ])

  const totalEconomia = clientes.reduce((acc, c) => acc + c.economiaTotal, 0)
  const clientesAtivos = clientes.filter(c => c.ativo).length
  const clientesMeta = clientes.filter(c => c.metaEconomia > 0 && c.economiaTotal >= c.metaEconomia).length
  const tiposReceita = ['receita', 'receita_emissao', 'fee_mensal', 'fee_emissao']
  const faturamento = transacoes.filter(t => tiposReceita.includes(t.tipo)).reduce((acc, t) => acc + toNum(t.valor), 0)
  const metricValues = [
    formatCurrency(totalEconomia),
    String(clientesAtivos),
    String(clientesMeta),
    formatCurrency(faturamento),
    String(emissoesPendentes.length),
    String(checkinProdutos.length),
  ]

  return (
    <div className="space-y-4">
      <section className="atlas-dark-panel relative overflow-hidden rounded-lg p-4">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="atlas-kicker text-xs font-semibold text-[#d7ad68]">Atlas Beyond Destinations</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#f8e7c4]">Centro de comando</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#e8d3ab]/75">
              Visao executiva do funil, clientes, economia vitalicia, financeiro e operacao de viagens.
            </p>
          </div>
          <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-[#d7ad68]/60 bg-black">
            <Image src="/atlas-beyond-destinations.png" alt="Atlas Beyond Destinations" fill sizes="96px" className="object-cover" priority />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Faturamento e indicadores filtrados por <strong>{labelPeriodo}</strong>. Economia e metas sao vitalicias.</p>
        <PeriodoFilter mes={periodo.mes} ano={periodo.ano} />
      </div>

      <div className="grid gap-3 md:grid-cols-3 2xl:grid-cols-6">
        {dashboardPanels.map(({ label, icon: Icon }, index) => (
          <Card key={label} className="atlas-panel">
            <CardContent className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <Icon size={18} className="text-[#8f7040]" />
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-2 text-xl font-semibold text-[#0b3b31]">{metricValues[index]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="atlas-panel">
        <CardHeader>
          <CardTitle>Faturamento x Despesa x Meta - {periodo.ano}</CardTitle>
          <p className="text-sm text-muted-foreground">Receita recebida (verde), despesas (vermelho) e meta de faturamento (linha preta tracejada) mes a mes.</p>
        </CardHeader>
        <CardContent>
          <FinanceLineChart dados={serieFinanceira} ano={periodo.ano} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle>Ranking Top Clientes por economia</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardCharts clientes={clientes.map(c => ({ nome: c.nome, economia_total: c.economiaTotal, meta_economia: c.metaEconomia }))} />
          </CardContent>
        </Card>

        <Card className="atlas-panel">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Emissoes pendentes</CardTitle>
            <Link href="/emissoes"><Button size="sm" variant="outline">Emissoes</Button></Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {emissoesPendentes.length > 0 ? emissoesPendentes.map((e) => (
                <div key={e.id} className="rounded-md border border-[#d7ad68]/25 bg-white/65 p-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{e.origem}{' para '}{e.destino}</p>
                    <p className="text-xs text-muted-foreground">{e.cliente.nome} - {new Date(e.dataVoo).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">{e.status}</Badge>
                </div>
              </div>
            )) : (
              <div className="rounded-md border border-dashed border-[#d7ad68]/35 p-4 text-center text-sm text-muted-foreground">
                Nenhuma emissao pendente.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="atlas-panel lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell size={18} /> Painel de check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {checkinProdutos.length > 0 ? checkinProdutos.map((p) => {
              const alerta = checkinAlerta(p.dataInicio)
              return (
                <div key={p.id} className="grid gap-3 rounded-md border border-[#d7ad68]/25 bg-white/65 p-2.5 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <p className="font-medium">{p.origem || '-'}{' para '}{p.destino || '-'}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.cliente.nome}{p.dataInicio ? ` - ${new Date(p.dataInicio).toLocaleDateString('pt-BR')}` : ''}
                    </p>
                  </div>
                  <Badge className={alerta.cor}>{alerta.label}</Badge>
                  <CheckinButton id={p.id} />
                </div>
              )
            }) : (
              <p className="text-sm text-muted-foreground">Passagens emitidas aparecerao aqui por prioridade de data para o check-in.</p>
            )}
          </CardContent>
        </Card>

        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp size={18} /> Decisoes tecnicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Economia total: <strong>acumulada eternamente</strong></p>
            <p>Call: <strong>multiplos colaboradores</strong></p>
            <p>Responsavel: <strong>por produto/emissao</strong></p>
            <p>Notificacoes: <strong>todos da empresa</strong></p>
            <p>Arquitetura futura: <strong>SaaS multiempresa</strong></p>
          </CardContent>
        </Card>
      </div>

      {checkinProdutos.length === 0 && (
        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plane size={18} /> Operacao de viagens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cadastre produtos (passagem, hotel, passeio, seguro) na ficha de cada cliente. Ao marcar como <Clock3 size={13} className="inline" /> <strong>Emitido</strong>, as passagens entram no painel de check-in.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
