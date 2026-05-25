import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function atualizarValorMilheiro(contaId: string) {
  const movimentos = await prisma.movimentacaoMilhas.findMany({
    where: { contaProgramaId: contaId, quantidade: { gt: 0 } },
    select: { quantidade: true, custoTotal: true },
  })
  const totalMilhas = movimentos.reduce((acc, mov) => acc + mov.quantidade, 0)
  const totalCusto = movimentos.reduce((acc, mov) => acc + mov.custoTotal.toNumber(), 0)
  const valorMilheiro = totalMilhas > 0 ? (totalCusto / totalMilhas) * 1000 : null

  await prisma.contaPrograma.update({
    where: { id: contaId },
    data: { valorMilheiro },
  })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { clienteId, programaId, numeroConta, saldoAtual, custoInicial, clubeMensalMilhas, custoMensal } = await request.json()
  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, gestorId: session.user.id } })
  if (!cliente) return NextResponse.json({ error: 'Cliente nao encontrado.' }, { status: 404 })

  const saldo = parseInt(saldoAtual) || 0
  const custo = parseFloat(custoInicial) || 0

  const conta = await prisma.contaPrograma.create({
    data: {
      clienteId,
      gestorId: session.user.id,
      programaId,
      numeroConta: numeroConta || null,
      saldoAtual: saldo,
      clubeMensalMilhas: clubeMensalMilhas ? parseInt(clubeMensalMilhas) || null : null,
      custoMensal: custoMensal ? parseFloat(custoMensal) || 0 : null,
      ultimaAtualizacaoSaldo: new Date(),
      ultimaVisualizacao: new Date(),
      movimentacoes: saldo > 0 || custo > 0 ? {
        create: {
          gestorId: session.user.id,
          tipo: 'SALDO_INICIAL',
          quantidade: saldo,
          custoTotal: custo,
          descricao: 'Saldo inicial cadastrado',
        },
      } : undefined,
    },
  })

  await atualizarValorMilheiro(conta.id)
  return NextResponse.json({ id: conta.id })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, action, saldoAtual, numeroConta, clubeMensalMilhas, custoMensal } = body
  if (!id) return NextResponse.json({ error: 'Conta nao informada.' }, { status: 400 })

  const existente = await prisma.contaPrograma.findFirst({ where: { id, gestorId: session.user.id } })
  if (!existente) return NextResponse.json({ error: 'Conta nao encontrada.' }, { status: 404 })

  if (action === 'marcar_visualizado') {
    const conta = await prisma.contaPrograma.update({
      where: { id },
      data: { ultimaVisualizacao: new Date() },
    })
    return NextResponse.json({ id: conta.id })
  }

  if (action === 'adicionar_milhas') {
    const quantidade = parseInt(body.quantidade) || 0
    const custoTotal = parseFloat(body.custoTotal) || 0
    if (quantidade <= 0) return NextResponse.json({ error: 'Informe uma quantidade de milhas maior que zero.' }, { status: 400 })

    await prisma.movimentacaoMilhas.create({
      data: {
        contaProgramaId: id,
        gestorId: session.user.id,
        cartaoId: body.cartaoId || null,
        tipo: body.tipo || 'MANUAL',
        quantidade,
        custoTotal,
        descricao: body.descricao || null,
        faturaValor: body.faturaValor ? parseFloat(body.faturaValor) || 0 : null,
        dolarCotacao: body.dolarCotacao ? parseFloat(body.dolarCotacao) || 0 : null,
        pontosPorDolar: body.pontosPorDolar ? parseFloat(body.pontosPorDolar) || 0 : null,
      },
    })

    const conta = await prisma.contaPrograma.update({
      where: { id },
      data: {
        saldoAtual: { increment: quantidade },
        ultimaAtualizacaoSaldo: new Date(),
        ultimaVisualizacao: new Date(),
      },
    })
    await atualizarValorMilheiro(id)
    return NextResponse.json({ id: conta.id })
  }

  const conta = await prisma.contaPrograma.update({
    where: { id },
    data: {
      ...(saldoAtual !== undefined ? { saldoAtual: parseInt(saldoAtual) || 0, ultimaAtualizacaoSaldo: new Date() } : {}),
      ...(numeroConta !== undefined ? { numeroConta: numeroConta || null } : {}),
      ...(clubeMensalMilhas !== undefined ? { clubeMensalMilhas: clubeMensalMilhas ? parseInt(clubeMensalMilhas) || null : null } : {}),
      ...(custoMensal !== undefined ? { custoMensal: custoMensal ? parseFloat(custoMensal) || 0 : null } : {}),
      ultimaVisualizacao: new Date(),
    },
  })
  await atualizarValorMilheiro(id)
  return NextResponse.json({ id: conta.id })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Conta nao informada.' }, { status: 400 })

  const existente = await prisma.contaPrograma.findFirst({ where: { id, gestorId: session.user.id } })
  if (!existente) return NextResponse.json({ error: 'Conta nao encontrada.' }, { status: 404 })

  await prisma.contaPrograma.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
