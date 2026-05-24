import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { clienteId, programaId, numeroConta, saldoAtual } = await request.json()

  const conta = await prisma.contaPrograma.create({
    data: {
      clienteId,
      gestorId: session.user.id,
      programaId,
      numeroConta: numeroConta || null,
      saldoAtual: saldoAtual || 0,
      ultimaAtualizacaoSaldo: new Date(),
      ultimaVisualizacao: new Date(),
    },
  })

  return NextResponse.json({ id: conta.id })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, action, saldoAtual, numeroConta } = body
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

  const conta = await prisma.contaPrograma.update({
    where: { id },
    data: {
      ...(saldoAtual !== undefined ? { saldoAtual: parseInt(saldoAtual) || 0, ultimaAtualizacaoSaldo: new Date() } : {}),
      ...(numeroConta !== undefined ? { numeroConta: numeroConta || null } : {}),
      ultimaVisualizacao: new Date(),
    },
  })
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
