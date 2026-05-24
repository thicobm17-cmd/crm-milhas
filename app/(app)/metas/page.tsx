import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getClientesComResumo } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CalendarDays, Target, Trophy } from 'lucide-react'

export default async function MetasPage() {
  const session = await auth()
  const todosClientes = await getClientesComResumo(session!.user.id)
  const clientes = todosClientes.filter(c => c.metaEconomia > 0)

  const totalMeta = clientes.reduce((acc, c) => acc + c.metaEconomia, 0)
  const totalEconomia = clientes.reduce((acc, c) => acc + c.economiaTotal, 0)
  const progressoGeral = totalMeta > 0 ? Math.min((totalEconomia / totalMeta) * 100, 100) : 0
  const clientesAcima100 = clientes.filter(c => c.economiaTotal >= c.metaEconomia).length

  return (
    <div className="space-y-6">
      <div>
        <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 8</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#11231f]">Metas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Meta mensal da empresa e meta individual do cliente: economizar no minimo o valor investido.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="atlas-panel">
          <CardContent className="p-5">
            <Target size={18} className="mb-3 text-[#8f7040]" />
            <p className="text-sm text-muted-foreground">Meta total da carteira</p>
            <p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{formatCurrency(totalMeta)}</p>
          </CardContent>
        </Card>
        <Card className="atlas-panel">
          <CardContent className="p-5">
            <Trophy size={18} className="mb-3 text-[#8f7040]" />
            <p className="text-sm text-muted-foreground">Economia realizada</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatCurrency(totalEconomia)}</p>
          </CardContent>
        </Card>
        <Card className="atlas-panel">
          <CardContent className="p-5">
            <CalendarDays size={18} className="mb-3 text-[#8f7040]" />
            <p className="text-sm text-muted-foreground">Clientes acima da meta</p>
            <p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{clientesAcima100} / {clientes.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="atlas-dark-panel">
        <CardHeader>
          <CardTitle className="text-[#f4d59a]">Meta do mes para o financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[#e8d3ab]/75">A meta mensal alimenta automaticamente a linha preta do grafico do Financeiro.</p>
            <Badge className="bg-[#d7ad68] text-[#081613]">Meta atual demonstrativa: {formatCurrency(50000)}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="atlas-panel">
        <CardHeader>
          <CardTitle>Progresso por cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {clientes.length > 0 ? clientes.map(c => {
            const progresso = Math.min((c.economiaTotal / c.metaEconomia) * 100, 100)
            const atingiu = c.economiaTotal >= c.metaEconomia

            return (
              <div key={c.id} className="space-y-2 rounded-md border border-[#d7ad68]/25 bg-white/65 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/clientes/${c.id}`} className="font-medium text-[#0b3b31] hover:underline">{c.nome}</Link>
                  {atingiu && <Badge className="bg-emerald-100 text-emerald-800">Meta atingida</Badge>}
                </div>
                <Progress value={progresso} className="h-2.5" />
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>Economizou {formatCurrency(c.economiaTotal)}</span>
                  <span>Meta {formatCurrency(c.metaEconomia)}</span>
                  <span>{progresso.toFixed(0)}%</span>
                </div>
              </div>
            )
          }) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum cliente com meta definida ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
