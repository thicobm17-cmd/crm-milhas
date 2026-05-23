import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { NovaTransacaoForm } from '@/components/financeiro/NovaTransacaoForm'

export default async function FinanceiroPage() {
  const session = await auth()
  const gestorId = session!.user.id

  const [transacoes, clientes] = await Promise.all([
    prisma.transacao.findMany({
      where: { gestorId },
      include: { cliente: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.cliente.findMany({
      where: { gestorId, ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  const receitas = transacoes.filter(t => ['receita', 'fee_mensal', 'fee_emissao'].includes(t.tipo) && t.pago).reduce((acc, t) => acc + toNum(t.valor), 0)
  const despesas = transacoes.filter(t => ['despesa', 'compra_milhas'].includes(t.tipo) && t.pago).reduce((acc, t) => acc + toNum(t.valor), 0)
  const pendentesReceber = transacoes.filter(t => ['receita', 'fee_mensal', 'fee_emissao'].includes(t.tipo) && !t.pago).reduce((acc, t) => acc + toNum(t.valor), 0)
  const pendentesPagar = transacoes.filter(t => ['despesa', 'compra_milhas'].includes(t.tipo) && !t.pago).reduce((acc, t) => acc + toNum(t.valor), 0)
  const lucroLiquido = receitas - despesas

  const tipoLabels: Record<string, string> = {
    receita: 'Receita', fee_mensal: 'Fee Mensal', fee_emissao: 'Fee Emissão',
    despesa: 'Despesa', compra_milhas: 'Compra de Milhas',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-500 mt-1">Receitas, despesas e fluxo de caixa</p>
        </div>
        <NovaTransacaoForm clientes={clientes} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-green-500" /><p className="text-xs text-slate-500">Receitas Recebidas</p></div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(receitas)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-red-500" /><p className="text-xs text-slate-500">Despesas Pagas</p></div>
            <p className="text-xl font-bold text-red-500">{formatCurrency(despesas)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-blue-500" /><p className="text-xs text-slate-500">Lucro Líquido</p></div>
            <p className={`text-xl font-bold ${lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(lucroLiquido)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-orange-500" /><p className="text-xs text-slate-500">A Receber</p></div>
            <p className="text-xl font-bold text-orange-500">{formatCurrency(pendentesReceber)}</p>
            {pendentesPagar > 0 && <p className="text-xs text-slate-400 mt-1">A pagar: {formatCurrency(pendentesPagar)}</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Todas as Transações</CardTitle></CardHeader>
        <CardContent className="p-0">
          {transacoes.length > 0 ? (
            <div className="divide-y">
              {transacoes.map(t => {
                const isReceita = ['receita', 'fee_mensal', 'fee_emissao'].includes(t.tipo)
                return (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isReceita ? 'bg-green-400' : 'bg-red-400'}`} />
                      <div>
                        <p className="font-medium text-sm">{t.descricao}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">{tipoLabels[t.tipo]}</Badge>
                          {t.cliente?.nome && <span className="text-xs text-slate-400">{t.cliente.nome}</span>}
                        </div>
                        {t.dataVencimento && <p className="text-xs text-slate-400">Vencimento: {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}</p>}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className={`font-semibold ${isReceita ? 'text-green-600' : 'text-red-500'}`}>
                          {isReceita ? '+' : '-'}{formatCurrency(toNum(t.valor))}
                        </p>
                        <Badge variant={t.pago ? 'default' : 'secondary'} className="text-xs">{t.pago ? 'Pago' : 'Pendente'}</Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400"><p>Nenhuma transação registrada.</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
