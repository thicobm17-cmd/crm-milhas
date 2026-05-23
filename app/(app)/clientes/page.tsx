import { auth } from '@/lib/auth'
import { getClientesComResumo } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, Plane } from 'lucide-react'
import Link from 'next/link'

export default async function ClientesPage() {
  const session = await auth()
  const clientes = await getClientesComResumo(session!.user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1">{clientes.length} clientes cadastrados</p>
        </div>
        <Link href="/clientes/novo">
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Novo cliente
          </Button>
        </Link>
      </div>

      {clientes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clientes.map(c => {
            const progresso = c.metaEconomia > 0
              ? Math.min((c.economiaTotal / c.metaEconomia) * 100, 100)
              : 0

            return (
              <Link key={c.id} href={`/clientes/${c.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{c.nome}</h3>
                        {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                      </div>
                      <Badge variant={c.ativo ? 'default' : 'secondary'}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <TrendingUp size={14} className="text-green-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-500">Economia</p>
                        <p className="font-bold text-green-600 text-sm">{formatCurrency(c.economiaTotal)}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <Plane size={14} className="text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-500">Emissões</p>
                        <p className="font-bold text-blue-600 text-sm">{c.totalEmissoes}</p>
                      </div>
                    </div>

                    {c.metaEconomia > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Meta de economia</span>
                          <span>{progresso.toFixed(0)}%</span>
                        </div>
                        <Progress value={progresso} className="h-2" />
                        <p className="text-xs text-slate-400">Meta: {formatCurrency(c.metaEconomia)}</p>
                      </div>
                    )}

                    {c.feeMensal > 0 && (
                      <p className="text-xs text-slate-500 border-t pt-2">
                        Fee mensal: <span className="font-medium text-slate-700">{formatCurrency(c.feeMensal)}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <p className="text-slate-400 mb-4">Nenhum cliente cadastrado ainda.</p>
            <Link href="/clientes/novo">
              <Button>Adicionar primeiro cliente</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
