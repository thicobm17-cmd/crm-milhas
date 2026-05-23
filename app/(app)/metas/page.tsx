import { auth } from '@/lib/auth'
import { getClientesComResumo } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, TrendingUp, CheckCircle } from 'lucide-react'
import Link from 'next/link'

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
        <h1 className="text-2xl font-bold text-slate-900">Metas de Economia</h1>
        <p className="text-slate-500 mt-1">Acompanhe o progresso de cada cliente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><Target size={16} className="text-blue-500" /><p className="text-xs text-slate-500">Meta Total da Carteira</p></div>
            <p className="text-xl font-bold">{formatCurrency(totalMeta)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-green-500" /><p className="text-xs text-slate-500">Economia Realizada</p></div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalEconomia)}</p>
            <p className="text-xs text-slate-400 mt-1">{progressoGeral.toFixed(1)}% da meta geral</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><CheckCircle size={16} className="text-purple-500" /><p className="text-xs text-slate-500">Metas Atingidas</p></div>
            <p className="text-xl font-bold">{clientesAcima100}</p>
            <p className="text-xs text-slate-400">de {clientes.length} clientes com meta</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <p className="font-medium mb-3">Progresso Geral da Carteira</p>
          <Progress value={progressoGeral} className="h-4" />
          <div className="flex justify-between text-sm mt-2">
            <span className="text-slate-500">{formatCurrency(totalEconomia)}</span>
            <span className="font-medium">{formatCurrency(totalMeta)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Progresso por Cliente</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {clientes.length > 0 ? clientes.map(c => {
            const progresso = Math.min((c.economiaTotal / c.metaEconomia) * 100, 100)
            const restante = Math.max(c.metaEconomia - c.economiaTotal, 0)
            const atingiu = c.economiaTotal >= c.metaEconomia

            return (
              <div key={c.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link href={`/clientes/${c.id}`} className="font-medium hover:underline text-blue-700">{c.nome}</Link>
                    {atingiu && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Meta atingida!</Badge>}
                  </div>
                  <span className="text-sm font-semibold">{progresso.toFixed(0)}%</span>
                </div>
                <Progress value={progresso} className="h-2.5" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Economizou: <strong className="text-green-600">{formatCurrency(c.economiaTotal)}</strong></span>
                  <span>{atingiu ? `Excedeu em ${formatCurrency(c.economiaTotal - c.metaEconomia)}` : `Faltam ${formatCurrency(restante)}`}</span>
                  <span>Meta: {formatCurrency(c.metaEconomia)}</span>
                </div>
              </div>
            )
          }) : (
            <p className="text-slate-400 text-center py-8">Nenhum cliente com meta definida. Edite os clientes para adicionar metas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
