import { EstoqueMilhasConsole } from '@/components/estoque-milhas/EstoqueMilhasConsole'
import { programasEstoqueMilhas, toNumber } from '@/lib/agencia'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function EstoqueMilhasPage() {
  await prisma.estoqueMilhasPrograma.createMany({
    data: programasEstoqueMilhas.map((programa) => ({
      programa: programa.programa,
      logoUrl: programa.logoUrl,
    })),
    skipDuplicates: true,
  })

  const programasRaw = await prisma.estoqueMilhasPrograma.findMany({
    include: { movimentacoes: { orderBy: { createdAt: 'desc' }, take: 8 } },
    orderBy: { programa: 'asc' },
  })

  const programas = programasRaw.map((programa) => ({
    id: programa.id,
    programa: programa.programa,
    logoUrl: programa.logoUrl,
    saldoAtual: programa.saldoAtual,
    custoTotal: toNumber(programa.custoTotal),
    custoMedioMilheiro: toNumber(programa.custoMedioMilheiro),
    clubeMensalMilhas: programa.clubeMensalMilhas,
    clubeCustoMensal: toNumber(programa.clubeCustoMensal),
    fornecedorNome: programa.fornecedorNome,
    fornecedorContato: programa.fornecedorContato,
    fornecedorEmail: programa.fornecedorEmail,
    observacoes: programa.observacoes,
    movimentacoes: programa.movimentacoes.map((mov) => ({
      id: mov.id,
      tipo: mov.tipo,
      quantidade: mov.quantidade,
      custoTotal: toNumber(mov.custoTotal),
      descricao: mov.descricao,
      createdAt: mov.createdAt.toISOString(),
    })),
  }))

  return (
    <div className="space-y-4">
      <div>
        <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Milhas como insumo da agência</p>
        <h1 className="mt-1.5 text-2xl font-semibold text-[#11231f]">Estoque de milhas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle saldo, custo médio, fornecedores e planos mensais por programa.
        </p>
      </div>
      <EstoqueMilhasConsole programas={programas} />
    </div>
  )
}
