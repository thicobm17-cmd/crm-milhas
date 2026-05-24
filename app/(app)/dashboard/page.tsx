import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calcEconomia, getClientesComResumo, toNum } from '@/lib/queries'
import { dashboardPanels } from '@/lib/atlas-spec'
import { formatCurrency, formatMilhas } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { Bell, CheckCircle2, Clock3, Plane, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  const gestorId = session!.user.id

  const [clientes, emissoes, transacoes] = await Promise.all([
    getClientesComResumo(gestorId),
    prisma.emissao.findMany({
      where: { gestorId },
      include: { cliente: { select: { nome: true } }, programa: true },
      orderBy: { dataVoo: 'asc' },
      take: 6,
    }),
    prisma.transacao.findMany({
      where: { gestorId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  const totalEconomia = clientes.reduce((acc, c) => acc + c.economiaTotal, 0)
  const clientesAtivos = clientes.filter(c => c.ativo).length
  const clientesMeta = clientes.filter(c => c.metaEconomia > 0 && c.economiaTotal >= c.metaEconomia).length
  const tiposReceita = ['receita', 'receita_emissao', 'fee_mensal', 'fee_emissao']
  const faturamento = transacoes.filter(t => tiposReceita.includes(t.tipo) && t.pago).reduce((acc, t) => acc + toNum(t.valor), 0)
  const pendentes = emissoes.filter(e => e.status !== 'confirmada')
  const checkins = emissoes.filter(e => e.status === 'confirmada').slice(0, 3)
  const metricValues = [formatCurrency(totalEconomia), String(clientesAtivos), String(clientesMeta), formatCurrency(faturamento), String(pendentes.length), String(checkins.length)]

  return (
    <div className="space-y-6">
      <section className="atlas-dark-panel relative overflow-hidden rounded-lg p-6">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="atlas-kicker text-xs font-semibold text-[#d7ad68]">Atlas Beyond Destinations</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#f8e7c4]">Centro de comando</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#e8d3ab]/75">
              Visao executiva do funil, clientes, economia vitalicia, financeiro e operacao de viagens.
            </p>
          </div>
          <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-[#d7ad68]/60 bg-black">
            <Image src="/atlas-beyond-destinations.png" alt="Atlas Beyond Destinations" fill sizes="96px" className="object-cover" priority />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {dashboardPanels.map(({ label, icon: Icon }, index) => (
          <Card key={label} className="atlas-panel">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <Icon size={18} className="text-[#8f7040]" />
                <span className="text-xs text-muted-foreground">PDF</span>
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-2 text-xl font-semibold text-[#0b3b31]">{metricValues[index]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
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
            <Link href="/clientes"><Button size="sm" variant="outline">Clientes</Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendentes.length > 0 ? pendentes.map((e) => (
              <div key={e.id} className="rounded-md border border-[#d7ad68]/25 bg-white/65 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{e.origem}{' para '}{e.destino}</p>
                    <p className="text-xs text-muted-foreground">{e.cliente.nome} - {new Date(e.dataVoo).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">{e.status}</Badge>
                </div>
              </div>
            )) : (
              <div className="rounded-md border border-dashed border-[#d7ad68]/35 p-6 text-center text-sm text-muted-foreground">
                Nenhuma emissao pendente. Quando status estiver em cotacao, aparece aqui.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="atlas-panel lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell size={18} /> Painel de check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checkins.length > 0 ? checkins.map((e, index) => (
              <div key={e.id} className="grid gap-3 rounded-md border border-[#d7ad68]/25 bg-white/65 p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-medium">{e.origem}{' para '}{e.destino}</p>
                  <p className="text-xs text-muted-foreground">{e.cliente.nome} - {formatMilhas(e.milhasUtilizadas)}</p>
                </div>
                <Badge className={index === 0 ? 'bg-red-100 text-red-800' : index === 1 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}>
                  {index === 0 ? 'Hoje' : index === 1 ? 'Falta 1 dia' : 'Disponivel'}
                </Badge>
                <Button size="sm" variant="outline"><CheckCircle2 size={14} /> Realizado</Button>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Check-ins confirmados aparecerao por prioridade de data.</p>
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

      {emissoes.length > 0 && (
        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plane size={18} /> Ultimos produtos de viagem</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {emissoes.slice(0, 6).map((e) => (
              <div key={e.id} className="rounded-md border border-[#d7ad68]/25 bg-white/65 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{e.origem}{' para '}{e.destino}</p>
                  <Clock3 size={15} className="text-[#8f7040]" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{e.cliente.nome}</p>
                <p className="mt-3 text-sm font-semibold text-emerald-700">Economia {formatCurrency(calcEconomia(e.precoMercado, e.taxasPagas, e.feeCobrado))}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
