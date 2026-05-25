import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function getClienteDoGestor(clienteId: string, gestorId: string) {
  return prisma.cliente.findFirst({ where: { id: clienteId, gestorId } })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { clienteId, nome, pontosPorDolar, salasVipTotal, salasVipUsadas } = await request.json()
  if (!clienteId || !nome) return NextResponse.json({ error: 'Cliente e nome do cartao sao obrigatorios.' }, { status: 400 })

  const cliente = await getClienteDoGestor(clienteId, session.user.id)
  if (!cliente) return NextResponse.json({ error: 'Cliente nao encontrado.' }, { status: 404 })

  const cartao = await prisma.cartaoCredito.create({
    data: {
      clienteId,
      nome: String(nome).trim(),
      pontosPorDolar: parseFloat(pontosPorDolar) || 0,
      salasVipTotal: parseInt(salasVipTotal) || 0,
      salasVipUsadas: parseInt(salasVipUsadas) || 0,
    },
  })

  return NextResponse.json({ id: cartao.id })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, action } = body
  if (!id) return NextResponse.json({ error: 'Cartao nao informado.' }, { status: 400 })

  const existente = await prisma.cartaoCredito.findFirst({
    where: { id, cliente: { gestorId: session.user.id } },
  })
  if (!existente) return NextResponse.json({ error: 'Cartao nao encontrado.' }, { status: 404 })

  if (action === 'usar_sala') {
    const cartao = await prisma.cartaoCredito.update({
      where: { id },
      data: { salasVipUsadas: { increment: 1 } },
    })
    return NextResponse.json({ id: cartao.id })
  }

  if (action === 'estornar_sala') {
    const cartao = await prisma.cartaoCredito.update({
      where: { id },
      data: { salasVipUsadas: Math.max(0, existente.salasVipUsadas - 1) },
    })
    return NextResponse.json({ id: cartao.id })
  }

  const cartao = await prisma.cartaoCredito.update({
    where: { id },
    data: {
      ...(body.nome !== undefined ? { nome: String(body.nome).trim() } : {}),
      ...(body.pontosPorDolar !== undefined ? { pontosPorDolar: parseFloat(body.pontosPorDolar) || 0 } : {}),
      ...(body.salasVipTotal !== undefined ? { salasVipTotal: parseInt(body.salasVipTotal) || 0 } : {}),
      ...(body.salasVipUsadas !== undefined ? { salasVipUsadas: parseInt(body.salasVipUsadas) || 0 } : {}),
    },
  })

  return NextResponse.json({ id: cartao.id })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Cartao nao informado.' }, { status: 400 })

  const existente = await prisma.cartaoCredito.findFirst({
    where: { id, cliente: { gestorId: session.user.id } },
  })
  if (!existente) return NextResponse.json({ error: 'Cartao nao encontrado.' }, { status: 404 })

  await prisma.cartaoCredito.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
