import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { programasEstoqueMilhas, toNumber } from '@/lib/agencia'

async function ensurePrograms() {
  await prisma.estoqueMilhasPrograma.createMany({
    data: programasEstoqueMilhas.map((programa) => ({
      programa: programa.programa,
      logoUrl: programa.logoUrl,
    })),
    skipDuplicates: true,
  })
}

async function recalculate(estoqueId: string) {
  const movimentos = await prisma.movimentacaoEstoqueMilhas.findMany({ where: { estoqueId } })
  const saldoAtual = movimentos.reduce((acc, mov) => {
    const qtd = mov.tipo === 'SAIDA' ? -mov.quantidade : mov.quantidade
    return acc + qtd
  }, 0)
  const custoTotal = movimentos.reduce((acc, mov) => {
    const custo = toNumber(mov.custoTotal)
    return acc + (mov.tipo === 'SAIDA' ? -custo : custo)
  }, 0)
  const custoMedioMilheiro = saldoAtual > 0 ? (custoTotal / saldoAtual) * 1000 : 0

  return prisma.estoqueMilhasPrograma.update({
    where: { id: estoqueId },
    data: { saldoAtual, custoTotal, custoMedioMilheiro },
  })
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  await ensurePrograms()
  const programas = await prisma.estoqueMilhasPrograma.findMany({
    include: { movimentacoes: { orderBy: { createdAt: 'desc' }, take: 8 } },
    orderBy: { programa: 'asc' },
  })
  return NextResponse.json(programas)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  await ensurePrograms()
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Programa não informado.' }, { status: 400 })

  if (body.action === 'fornecedor') {
    const estoque = await prisma.estoqueMilhasPrograma.update({
      where: { id: body.id },
      data: {
        fornecedorNome: body.fornecedorNome || null,
        fornecedorContato: body.fornecedorContato || null,
        fornecedorEmail: body.fornecedorEmail || null,
        observacoes: body.observacoes || null,
        clubeMensalMilhas: Number(body.clubeMensalMilhas) || 0,
        clubeCustoMensal: toNumber(body.clubeCustoMensal),
      },
    })
    return NextResponse.json(estoque)
  }

  if (body.action === 'aplicar_clube') {
    const estoque = await prisma.estoqueMilhasPrograma.findUnique({ where: { id: body.id } })
    if (!estoque) return NextResponse.json({ error: 'Programa não encontrado.' }, { status: 404 })

    if (estoque.clubeMensalMilhas <= 0) {
      return NextResponse.json({ error: 'Configure a quantidade mensal do clube.' }, { status: 400 })
    }

    await prisma.movimentacaoEstoqueMilhas.create({
      data: {
        estoqueId: body.id,
        tipo: 'CLUBE',
        quantidade: estoque.clubeMensalMilhas,
        custoTotal: estoque.clubeCustoMensal,
        descricao: 'Entrada automática do plano mensal',
      },
    })

    const updated = await recalculate(body.id)
    return NextResponse.json(updated)
  }

  const quantidade = Math.abs(Number(body.quantidade) || 0)
  if (quantidade <= 0) return NextResponse.json({ error: 'Informe a quantidade de milhas.' }, { status: 400 })

  await prisma.movimentacaoEstoqueMilhas.create({
    data: {
      estoqueId: body.id,
      tipo: body.tipo || 'ENTRADA',
      quantidade,
      custoTotal: toNumber(body.custoTotal),
      descricao: body.descricao || null,
    },
  })

  const updated = await recalculate(body.id)
  return NextResponse.json(updated)
}
