import { AgenciaConsole } from '@/components/agencia/AgenciaConsole'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { automacoesAgenciaPadrao, toNumber } from '@/lib/agencia'

export const dynamic = 'force-dynamic'

export default async function AgenciaPage() {
  const session = await auth()
  const gestorId = session!.user.id

  await prisma.automacaoAgencia.createMany({
    data: automacoesAgenciaPadrao.map(([evento, titulo, mensagem]) => ({ evento, titulo, mensagem })),
    skipDuplicates: true,
  })

  const [solicitacoesRaw, cotacoesRaw, viagensRaw] = await Promise.all([
    prisma.solicitacaoOrcamento.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
    prisma.cotacaoAgencia.findMany({
      include: {
        solicitacao: { select: { nome: true, telefone: true } },
        itens: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
    prisma.viagemAgencia.findMany({
      orderBy: [{ dataIda: 'asc' }, { createdAt: 'desc' }],
      take: 60,
    }),
  ])

  const solicitacoes = solicitacoesRaw.map((item) => ({
    id: item.id,
    nome: item.nome,
    telefone: item.telefone,
    email: item.email,
    destinoDesejado: item.destinoDesejado,
    dataViagem: item.dataViagem?.toISOString() || null,
    quantidadePassageiros: item.quantidadePassageiros,
    origemLead: item.origemLead,
    status: item.status,
    observacoes: item.observacoes,
  }))

  const cotacoes = cotacoesRaw.map((item) => ({
    id: item.id,
    destino: item.destino,
    origemLead: item.origemLead,
    status: item.status,
    dataViagem: item.dataViagem?.toISOString() || null,
    valorTotalVenda: toNumber(item.valorTotalVenda),
    custoTotal: toNumber(item.custoTotal),
    lucroTotal: toNumber(item.lucroTotal),
    margemPercentual: toNumber(item.margemPercentual),
    programaMilhas: item.programaMilhas,
    quantidadeMilhas: item.quantidadeMilhas,
    solicitacao: item.solicitacao,
    itens: item.itens.map((it) => ({
      id: it.id,
      tipoItem: it.tipoItem,
      descricao: it.descricao,
      fornecedor: it.fornecedor,
      valorVenda: toNumber(it.valorVenda),
      custoFornecedor: toNumber(it.custoFornecedor),
    })),
  }))

  const viagens = viagensRaw.map((item) => ({
    id: item.id,
    destino: item.destino,
    status: item.status,
    dataIda: item.dataIda?.toISOString() || null,
    dataVolta: item.dataVolta?.toISOString() || null,
  }))

  return (
    <div className="space-y-4">
      <div>
        <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Operação agência</p>
        <h1 className="mt-1.5 text-2xl font-semibold text-[#11231f]">Agência de viagens</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solicitação, cotação, aprovação, venda, operação da viagem, pós-venda e recompra. Consultor ativo: {session?.user?.name || gestorId}.
        </p>
      </div>
      <AgenciaConsole solicitacoes={solicitacoes} cotacoes={cotacoes} viagens={viagens} />
    </div>
  )
}
