import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { financeLines } from '@/lib/atlas-spec'
import { toNum, parsePeriodo, intervaloPeriodo, getMetaPeriodo, nomesMeses } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NovaTransacaoForm } from '@/components/financeiro/NovaTransacaoForm'
import { TransacaoActions } from '@/components/financeiro/TransacaoActions'
import { MetaForm } from '@/components/financeiro/MetaForm'
import { PeriodoFilter } from '@/components/shared/PeriodoFilter'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ mes?: string; ano?: string }>
}

const receitaTipos = ['receita', 'receita_emissao', 'fee_mensal', 'fee_emissao']
const despesaTipos = ['despesa', 'compra_milhas', 'imposto']

const tipoLabels: Record<string, string> = {
  receita: 'Produto contratado / receita',
  receita_emissao: 'Receita de emissao',
  fee_mensal: 'Produto contratado',
  fee_emissao: 'Receita de emissao',
  despesa: 'Despesa',
  compra_milhas: 'Compra de Milhas',
  imposto: 'Imposto de renda',
}

function isoDate(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null
}

export default async function FinanceiroPage({ searchParams }: Props) {
  const session = await auth()
  const gestorId = session!.user.id
  const periodo = parsePeriodo(await searchParams)
  const intervalo = intervaloPeriodo(periodo)
  const labelPeriodo = periodo.mes === 0 ? `Ano ${periodo.ano}` : `${nomesMeses[periodo.mes - 1]}/${periodo.ano}`

  const [pontuais, recorrentes, meta, clientes] = await Promise.all([
    // Transacoes pontuais (nao fixas) do periodo
    prisma.transacao.findMany({
      where: {
        gestorId,
        recorrente: false,
        OR: [
          { dataPagamento: { gte: intervalo.gte, lt: intervalo.lt } },
          { pago: false, createdAt: { gte: intervalo.gte, lt: intervalo.lt } },
        ],
      },
      include: { cliente: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    // Despesas/receitas fixas ativas no periodo (comecaram antes do fim do mes e nao terminaram antes do inicio)
    prisma.transacao.findMany({
      where: {
        gestorId,
        recorrente: true,
        createdAt: { lt: intervalo.lt },
        OR: [{ recorrenteAte: null }, { recorrenteAte: { gte: intervalo.gte } }],
      },
      include: { cliente: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    getMetaPeriodo(gestorId, periodo),
    prisma.cliente.findMany({ where: { gestorId, ativo: true }, select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
  ])

  // Receitas: pontuais pagas + recorrentes de receita (sempre contam no mes ativo)
  const receitasPontuais = pontuais.filter(t => receitaTipos.includes(t.tipo) && t.pago).reduce((a, t) => a + toNum(t.valor), 0)
  const receitasFixas = recorrentes.filter(t => receitaTipos.includes(t.tipo)).reduce((a, t) => a + toNum(t.valor), 0)
  const receitas = receitasPontuais + receitasFixas

  // Despesas: pontuais pagas + todas as fixas ativas (custo mensal comprometido)
  const despesasPontuais = pontuais.filter(t => despesaTipos.includes(t.tipo) && t.pago).reduce((a, t) => a + toNum(t.valor), 0)
  const despesasFixas = recorrentes.filter(t => despesaTipos.includes(t.tipo)).reduce((a, t) => a + toNum(t.valor), 0)
  const despesas = despesasPontuais + despesasFixas

  const pendentesReceber = pontuais.filter(t => receitaTipos.includes(t.tipo) && !t.pago).reduce((a, t) => a + toNum(t.valor), 0)
  const lucroLiquido = receitas - despesas
  const imposto = receitas * 0.15
  const values = [receitas, despesas, lucroLiquido, meta]
  const progressoMeta = meta > 0 ? Math.min((receitas / meta) * 100, 100) : 0

  // Lista: fixas primeiro, depois pontuais
  const lista = [...recorrentes, ...pontuais]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 5</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#11231f]">Financeiro da empresa</h1>
          <p className="mt-1 text-sm text-muted-foreground">Receitas, despesas (incl. fixas mensais), a receber, imposto e meta - {labelPeriodo}.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <PeriodoFilter mes={periodo.mes} ano={periodo.ano} />
          <NovaTransacaoForm clientes={clientes} />
        </div>
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
            <CardTitle className="text-[#f4d59a]">Controles de {labelPeriodo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-3">
              <MetaForm mes={periodo.mes} ano={periodo.ano} valorAtual={meta} label={labelPeriodo} />
              {meta > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-[#e8d3ab]/75">
                    <span>{formatCurrency(receitas)} recebidos</span>
                    <span>{progressoMeta.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#0b3b31]">
                    <div className="h-full bg-[#d7ad68]" style={{ width: `${progressoMeta}%` }} />
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-3">
              <p className="text-sm text-[#e8d3ab]/75">Despesas fixas no mes</p>
              <p className="text-xl font-semibold text-[#f4d59a]">{formatCurrency(despesasFixas)}</p>
            </div>
            <div className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-3">
              <p className="text-sm text-[#e8d3ab]/75">A receber</p>
              <p className="text-xl font-semibold text-[#f4d59a]">{formatCurrency(pendentesReceber)}</p>
            </div>
            <div className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-3">
              <p className="text-sm text-[#e8d3ab]/75">Imposto de renda estimado (15%)</p>
              <p className="text-xl font-semibold text-[#f4d59a]">{formatCurrency(imposto)}</p>
              <p className="mt-1 text-xs text-[#e8d3ab]/60">Registre como despesa tipo &quot;Imposto de renda&quot; ao pagar.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle>Transacoes de {labelPeriodo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lista.length > 0 ? lista.map((t) => {
              const isReceita = receitaTipos.includes(t.tipo)
              return (
                <div key={t.id} className="grid gap-3 rounded-md border border-[#d7ad68]/25 bg-white/65 p-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                  <div>
                    <p className="font-medium">
                      {t.descricao}
                      {t.recorrente && <Badge className="ml-2 bg-blue-100 text-blue-800">Fixa mensal</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.cliente?.nome || 'Empresa'} - {tipoLabels[t.tipo] || t.tipo}
                      {' - '}
                      {t.recorrente
                        ? `desde ${t.createdAt.toLocaleDateString('pt-BR')}`
                        : (t.pago && t.dataPagamento
                            ? `pago em ${t.dataPagamento.toLocaleDateString('pt-BR')}`
                            : `criada em ${t.createdAt.toLocaleDateString('pt-BR')}`)}
                    </p>
                  </div>
                  {t.recorrente ? (
                    <Badge className="bg-blue-100 text-blue-800">Mensal</Badge>
                  ) : (
                    <Badge className={t.pago ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{t.pago ? 'Pago' : 'Pendente'}</Badge>
                  )}
                  <p className={isReceita ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>
                    {isReceita ? '+' : '-'}{formatCurrency(toNum(t.valor))}
                  </p>
                  <TransacaoActions transacao={{
                    id: t.id,
                    tipo: t.tipo,
                    descricao: t.descricao,
                    valor: toNum(t.valor),
                    pago: t.pago,
                    recorrente: t.recorrente,
                    recorrenteAte: isoDate(t.recorrenteAte),
                    dataVencimento: isoDate(t.dataVencimento),
                    temCliente: !!t.clienteId,
                  }} />
                </div>
              )
            }) : (
              <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma transacao em {labelPeriodo}.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
