import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calcMargin, toNumber } from '@/lib/agencia'

type ItemInput = {
  tipoItem?: string
  descricao?: string
  fornecedor?: string
  valorVenda?: string | number
  custoFornecedor?: string | number
  observacoes?: string
}

function parseDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeItems(items: ItemInput[] = []) {
  return items
    .filter((item) => item.descricao)
    .map((item) => {
      const valorVenda = toNumber(item.valorVenda)
      const custoFornecedor = toNumber(item.custoFornecedor)
      return {
        tipoItem: item.tipoItem || 'SERVICO',
        descricao: String(item.descricao),
        fornecedor: item.fornecedor || null,
        valorVenda,
        custoFornecedor,
        lucro: valorVenda - custoFornecedor,
        observacoes: item.observacoes || null,
      }
    })
}

async function recalculateCotacao(id: string) {
  const itens = await prisma.cotacaoItem.findMany({ where: { cotacaoId: id } })
  const valorTotalVenda = itens.reduce((acc, item) => acc + toNumber(item.valorVenda), 0)
  const custoItens = itens.reduce((acc, item) => acc + toNumber(item.custoFornecedor), 0)
  const cotacaoAtual = await prisma.cotacaoAgencia.findUnique({ where: { id } })
  const custoMilhas = toNumber(cotacaoAtual?.custoTotalMilhas)
  const custoTotal = custoItens + custoMilhas
  const lucroTotal = valorTotalVenda - custoTotal
  const margemPercentual = calcMargin(valorTotalVenda, custoTotal)

  return prisma.cotacaoAgencia.update({
    where: { id },
    data: { valorTotalVenda, custoTotal, lucroTotal, margemPercentual },
  })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  if (!body.destino) return NextResponse.json({ error: 'Informe o destino da cotação.' }, { status: 400 })

  const items = normalizeItems(body.itens)
  const custoTotalMilhas = body.quantidadeMilhas && body.custoMilheiro
    ? (toNumber(body.quantidadeMilhas) / 1000) * toNumber(body.custoMilheiro)
    : 0

  const cotacao = await prisma.cotacaoAgencia.create({
    data: {
      solicitacaoId: body.solicitacaoId || null,
      clienteId: body.clienteId || null,
      consultorId: session.user.id,
      origemLead: body.origemLead || 'Cadastro manual',
      destino: body.destino,
      dataViagem: parseDate(body.dataViagem),
      status: body.status || 'EM_COTACAO',
      fornecedorMilhas: body.fornecedorMilhas || null,
      programaMilhas: body.programaMilhas || null,
      quantidadeMilhas: body.quantidadeMilhas ? Number(body.quantidadeMilhas) : null,
      custoMilheiro: body.custoMilheiro ? toNumber(body.custoMilheiro) : null,
      custoTotalMilhas,
      itens: { create: items },
    },
  })

  const updated = await recalculateCotacao(cotacao.id)
  return NextResponse.json(updated)
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Cotação não informada.' }, { status: 400 })

  if (body.action === 'aprovar') {
    const cotacao = await prisma.cotacaoAgencia.findUnique({
      where: { id: body.id },
      include: { solicitacao: true, itens: true },
    })
    if (!cotacao) return NextResponse.json({ error: 'Cotação não encontrada.' }, { status: 404 })

    const result = await prisma.$transaction(async (tx) => {
      let clienteId = cotacao.clienteId

      if (!clienteId && cotacao.solicitacao) {
        const cliente = await tx.cliente.create({
          data: {
            gestorId: session.user.id,
            nome: cotacao.solicitacao.nome,
            email: cotacao.solicitacao.email,
            telefone: cotacao.solicitacao.telefone,
            produtoContratado: `Agência - ${cotacao.destino}`,
            metaEconomia: 0,
          },
        })
        clienteId = cliente.id
      }

      const venda = await tx.vendaAgencia.create({
        data: {
          cotacaoId: cotacao.id,
          clienteId,
          consultorId: session.user.id,
          valorVenda: cotacao.valorTotalVenda,
          custoTotal: cotacao.custoTotal,
          lucroTotal: cotacao.lucroTotal,
          status: 'PAGAMENTO',
          pagamentoStatus: body.pago ? 'PAGO' : 'A_RECEBER',
        },
      })

      if (toNumber(cotacao.valorTotalVenda) > 0) {
        await tx.transacao.create({
          data: {
            gestorId: session.user.id,
            clienteId,
            tipo: 'receita_agencia',
            descricao: `Venda agência: ${cotacao.destino}`,
            valor: cotacao.valorTotalVenda,
            pago: !!body.pago,
            dataPagamento: body.pago ? new Date() : null,
          },
        })
      }

      const viagem = await tx.viagemAgencia.create({
        data: {
          vendaId: venda.id,
          cotacaoId: cotacao.id,
          clienteId,
          consultorResponsavel: session.user.id,
          destino: cotacao.destino,
          dataIda: cotacao.dataViagem,
          status: 'PLANEJADA',
        },
      })

      await tx.cotacaoAgencia.update({
        where: { id: cotacao.id },
        data: { status: 'APROVADA', clienteId },
      })

      return { venda, viagem }
    })

    return NextResponse.json(result)
  }

  const cotacao = await prisma.cotacaoAgencia.update({
    where: { id: body.id },
    data: { status: body.status || 'EM_COTACAO' },
  })

  return NextResponse.json(cotacao)
}
