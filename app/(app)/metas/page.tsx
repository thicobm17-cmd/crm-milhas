import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getClientesComResumo, getMetaPeriodo, periodoAtual, nomesMeses } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MetaForm } from '@/components/financeiro/MetaForm'
import { CalendarDays, Target, Trophy } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MetasPage() {
  const session = await auth()
  const periodo = periodoAtual()
  const labelMes = `${nomesMeses[periodo.mes - 1]}/${periodo.ano}`
  const [todosClientes, metaMes] = await Promise.all([
    getClientesComResumo(session!.user.id),
    getMetaPeriodo(session!.user.id, periodo),
  ])
  const clientes = todosClientes.filter(c => c.metaEconomia > 0)

  const totalMeta = clientes.reduce((acc, c) => acc + c.metaEconomia, 0)
  const totalEconomia = clientes.reduce((acc, c) => acc + c.economiaTotal, 0)
  const clientesAcima100 = clientes.filter(c => c.economiaTotal >= c.metaEconomia).length

  return (
    <div className="space-y-4">
      <div>
        <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 8</p>
        <h1 className="mt-1.5 text-2xl font-semibold text-[#11231f]">Metas</h1>
        <p className="mt-1 text-sm text-muted-foreground">A meta da empresa e de <strong>faturamento</strong>. Para cada cliente, o compromisso e economizar pelo menos o valor que ele investiu.</p>
      </div>

      <Card className="atlas-dark-panel">
        <CardHeader>
          <CardTitle className="text-[#f4d59a]">Meta de faturamento do mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-sm text-[#e8d3ab]/75">A meta de faturamento de {labelMes} alimenta o painel, o grafico e a barra de progresso do Financeiro.</p>
            <div className="w-full md:max-w-xs">
              <MetaForm mes={periodo.mes} ano={periodo.ano} valorAtual={metaMes} label={labelMes} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-[#11231f]">Compromisso de economia por cliente</h2>
        <p className="text-sm text-muted-foreground">Quanto ja economizamos para cada cliente versus o valor que ele investiu na assessoria.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="atlas-panel">
          <CardContent className="p-3">
            <Target size={18} className="mb-2 text-[#8f7040]" />
            <p className="text-sm text-muted-foreground">Total investido pelos clientes</p>
            <p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{formatCurrency(totalMeta)}</p>
          </CardContent>
        </Card>
        <Card className="atlas-panel">
          <CardContent className="p-3">
            <Trophy size={18} className="mb-2 text-[#8f7040]" />
            <p className="text-sm text-muted-foreground">Economia ja entregue</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatCurrency(totalEconomia)}</p>
          </CardContent>
        </Card>
        <Card className="atlas-panel">
          <CardContent className="p-3">
            <CalendarDays size={18} className="mb-2 text-[#8f7040]" />
            <p className="text-sm text-muted-foreground">Clientes que recuperaram o investido</p>
            <p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{clientesAcima100} / {clientes.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="atlas-panel">
        <CardHeader>
          <CardTitle>Economia entregue por cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {clientes.length > 0 ? clientes.map(c => {
            const progresso = Math.min((c.economiaTotal / c.metaEconomia) * 100, 100)
            const atingiu = c.economiaTotal >= c.metaEconomia

            return (
              <div key={c.id} className="space-y-2 rounded-md border border-[#d7ad68]/25 bg-white/65 p-3">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/clientes/${c.id}`} className="font-medium text-[#0b3b31] hover:underline">{c.nome}</Link>
                  {atingiu && <Badge className="bg-emerald-100 text-emerald-800">Investimento recuperado</Badge>}
                </div>
                <Progress value={progresso} className="h-2.5" />
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>Economizou {formatCurrency(c.economiaTotal)}</span>
                  <span>Investiu {formatCurrency(c.metaEconomia)}</span>
                  <span>{progresso.toFixed(0)}%</span>
                </div>
              </div>
            )
          }) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum cliente com meta definida ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
