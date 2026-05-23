import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getClientesComResumo, toNum, calcEconomia } from '@/lib/queries'
import { formatCurrency, formatMilhas } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { TrendingUp, Users, Plane, DollarSign, Target } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  const gestorId = session!.user.id

  const [clientes, emissoes, transacoes] = await Promise.all([
    getClientesComResumo(gestorId),
    prisma.emissao.findMany({
      where: { gestorId, status: 'confirmada' },
      include: { cliente: { select: { nome: true } }, programa: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.transacao.findMany({
      where: { gestorId, pago: false },
      orderBy: { dataVencimento: 'asc' },
      take: 5,
    }),
  ])

  const totalEconomia = clientes.reduce((acc, c) => acc + c.economiaTotal, 0)
  const totalMeta = clientes.reduce((acc, c) => acc + c.metaEconomia, 0)
  const totalEmissoes = clientes.reduce((acc, c) => acc + c.totalEmissoes, 0)
  const totalMilhas = clientes.reduce((acc, c) => acc + c.totalMilhasUsadas, 0)
  const clientesAtivos = clientes.filter(c => c.ativo).length
  const progressoMeta = totalMeta > 0 ? Math.min((totalEconomia / totalMeta) * 100, 100) : 0
  const receitaMensal = clientes.reduce((acc, c) => acc + c.feeMensal, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Visão geral da sua gestão de milhas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Economia Total Gerada</CardTitle>
            <TrendingUp className="text-green-500" size={20} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEconomia)}</p>
            <p className="text-xs text-slate-500 mt-1">para todos os clientes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Clientes Ativos</CardTitle>
            <Users className="text-blue-500" size={20} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{clientesAtivos}</p>
            <p className="text-xs text-slate-500 mt-1">de {clientes.length} cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Emissões Realizadas</CardTitle>
            <Plane className="text-indigo-500" size={20} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalEmissoes}</p>
            <p className="text-xs text-slate-500 mt-1">{formatMilhas(totalMilhas)} utilizadas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Receita Mensal</CardTitle>
            <DollarSign className="text-purple-500" size={20} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(receitaMensal)}</p>
            <p className="text-xs text-slate-500 mt-1">em fees de assessoria</p>
          </CardContent>
        </Card>
      </div>

      {totalMeta > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2">
            <Target size={18} className="text-blue-600" />
            <CardTitle className="text-base">Meta de Economia — Carteira Total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{formatCurrency(totalEconomia)} economizados</span>
              <span className="font-medium">Meta: {formatCurrency(totalMeta)}</span>
            </div>
            <Progress value={progressoMeta} className="h-3" />
            <p className="text-xs text-slate-500">{progressoMeta.toFixed(1)}% da meta atingida</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DashboardCharts clientes={clientes.map(c => ({ nome: c.nome, economia_total: c.economiaTotal, meta_economia: c.metaEconomia }))} />
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimas Emissões</CardTitle>
            <Link href="/emissoes" className="text-xs text-blue-600 hover:underline">Ver todas</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {emissoes.length > 0 ? emissoes.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{e.origem} → {e.destino}</p>
                  <p className="text-xs text-slate-500">{e.cliente.nome}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">
                    +{formatCurrency(calcEconomia(e.precoMercado, e.taxasPagas, e.feeCobrado))}
                  </p>
                  {e.programa && (
                    <Badge variant="outline" className="text-xs" style={{ borderColor: e.programa.cor }}>
                      {e.programa.nome}
                    </Badge>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-400 text-center py-4">Nenhuma emissão ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      {transacoes.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Pendências Financeiras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transacoes.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{t.descricao}</p>
                    {t.dataVencimento && (
                      <p className="text-xs text-slate-500">Vence: {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={['receita', 'fee_mensal', 'fee_emissao'].includes(t.tipo) ? 'default' : 'destructive'}>
                      {['receita', 'fee_mensal', 'fee_emissao'].includes(t.tipo) ? 'A receber' : 'A pagar'}
                    </Badge>
                    <span className="font-semibold text-sm">{formatCurrency(toNum(t.valor))}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
