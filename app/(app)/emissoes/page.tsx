import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calcEconomia } from '@/lib/queries'
import { formatCurrency, formatMilhas } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { EmissaoActions } from '@/components/emissoes/EmissaoActions'

export const dynamic = 'force-dynamic'

export default async function EmissoesPage() {
  const session = await auth()
  const emissoes = await prisma.emissao.findMany({
    where: { gestorId: session!.user.id },
    include: { cliente: { select: { nome: true } }, programa: true },
    orderBy: { dataVoo: 'desc' },
  })

  const confirmadas = emissoes.filter(e => e.status === 'confirmada')
  const totalEconomia = confirmadas.reduce((acc, e) => acc + calcEconomia(e.precoMercado, e.taxasPagas, e.feeCobrado), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emissões</h1>
          <p className="text-slate-500 mt-1">{emissoes.length} emissões registradas</p>
        </div>
        <Link href="/emissoes/nova">
          <Button className="flex items-center gap-2"><Plus size={16} />Nova emissão</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 text-center">
            <TrendingUp className="text-green-500 mx-auto mb-2" size={22} />
            <p className="text-xs text-slate-500">Economia Total</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalEconomia)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 text-center">
            <p className="text-xs text-slate-500 mb-1">Emissões Confirmadas</p>
            <p className="text-xl font-bold">{confirmadas.length}</p>
            <p className="text-xs text-slate-400">de {emissoes.length} total</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Histórico de Emissões</CardTitle></CardHeader>
        <CardContent className="p-0">
          {emissoes.length > 0 ? (
            <div className="divide-y">
              {emissoes.map(e => {
                const eco = calcEconomia(e.precoMercado, e.taxasPagas, e.feeCobrado)
                return (
                  <div key={e.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: e.programa?.cor ?? '#6b7280' }} />
                      <div>
                        <p className="font-semibold">{e.origem} para {e.destino}</p>
                        <p className="text-sm text-slate-600">{e.cliente.nome}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(e.dataVoo).toLocaleDateString('pt-BR')} - {e.classe} - {e.passageiros} pax - {e.programa?.nome}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right space-y-1">
                        <p className="font-bold text-green-600">+{formatCurrency(eco)}</p>
                        <p className="text-xs text-slate-500">{formatMilhas(e.milhasUtilizadas)}</p>
                      </div>
                      <EmissaoActions id={e.id} status={e.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <p>Nenhuma emissão registrada.</p>
              <Link href="/emissoes/nova" className="mt-3 inline-block">
                <Button size="sm" variant="outline">Registrar primeira emissão</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
