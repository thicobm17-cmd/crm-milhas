import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { financeLines } from '@/lib/atlas-spec'
import { toNum } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  const receitaTipos = ['receita', 'receita_emissao', 'fee_mensal', 'fee_emissao']
  const receitas = transacoes.filter(t => receitaTipos.includes(t.tipo) && t.pago).reduce((acc, t) => acc + toNum(t.valor), 0)
  const despesas = transacoes.filter(t => ['despesa', 'compra_milhas'].includes(t.tipo) && t.pago).reduce((acc, t) => acc + toNum(t.valor), 0)
  const pendentesReceber = transacoes.filter(t => receitaTipos.includes(t.tipo) && !t.pago).reduce((acc, t) => acc + toNum(t.valor), 0)
  const lucroLiquido = receitas - despesas
  const imposto = receitas * 0.15
  const values = [receitas, despesas, lucroLiquido, 50000]

  const tipoLabels: Record<string, string> = {
    receita: 'Produto contratado / receita',
    receita_emissao: 'Receita de emissao',
    fee_mensal: 'Produto contratado',
    fee_emissao: 'Receita de emissao',
    despesa: 'Despesa',
    compra_milhas: 'Compra de Milhas',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 5</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#11231f]">Financeiro da empresa</h1>
          <p className="mt-1 text-sm text-muted-foreground">Receitas recebidas, despesas fixas, a receber, imposto e panorama geral.</p>
        </div>
        <NovaTransacaoForm clientes={clientes} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {financeLines.map(({ label, color, icon: Icon }, index) => (
          <Card key={label} className="atlas-panel">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <Icon size={18} className="text-[#8f7040]" />
                <span className={`size-2 rounded-full ${color}`} />
              </div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{formatCurrency(values[index])}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <Card className="atlas-dark-panel">
          <CardHeader>
            <CardTitle className="text-[#f4d59a]">Controles do mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-3">
              <p className="text-sm text-[#e8d3ab]/75">A receber</p>
              <p className="text-xl font-semibold text-[#f4d59a]">{formatCurrency(pendentesReceber)}</p>
            </div>
            <div className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-3">
              <p className="text-sm text-[#e8d3ab]/75">Imposto de renda estimado (15%)</p>
              <p className="text-xl font-semibold text-[#f4d59a]">{formatCurrency(imposto)}</p>
              <Badge className="mt-2 bg-amber-100 text-amber-800">Pago / Nao pago</Badge>
            </div>
            <p className="text-sm text-[#e8d3ab]/70">Ao confirmar pagamento, selecione periodo de acesso do produto de 1 a 12 meses.</p>
          </CardContent>
        </Card>

        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle>Panorama geral - linhas do grafico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {financeLines.map(({ label, color }) => (
              <div key={label} className="flex items-center gap-3 rounded-md bg-white/65 p-3">
                <span className={`h-1.5 w-20 rounded-full ${color}`} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="atlas-panel">
        <CardHeader>
          <CardTitle>Transacoes registradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {transacoes.length > 0 ? transacoes.map((t) => {
            const isReceita = receitaTipos.includes(t.tipo)
            return (
              <div key={t.id} className="grid gap-3 rounded-md border border-[#d7ad68]/25 bg-white/65 p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-medium">{t.descricao}</p>
                  <p className="text-xs text-muted-foreground">{t.cliente?.nome || 'Empresa'} - {tipoLabels[t.tipo] || t.tipo}</p>
                </div>
                <Badge className={t.pago ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{t.pago ? 'Pago' : 'Pendente'}</Badge>
                <p className={isReceita ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>
                  {isReceita ? '+' : '-'}{formatCurrency(toNum(t.valor))}
                </p>
              </div>
            )
          }) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma transacao registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
