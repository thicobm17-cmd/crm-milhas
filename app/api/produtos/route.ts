import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Produtos do cliente: PASSAGEM, HOTEL, PASSEIO, SEGURO (conforme PDF Atlas)
// economia = precoReferencia - precoAtlas (soma vitalicia na economia do cliente)
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const {
    clienteId, tipo, nome, status, local, origem, destino,
    dataInicio, dataFim, dataFlexivel, classe, precoReferencia, precoAtlas,
    responsavelId, observacoes,
  } = body

  if (!clienteId || !tipo) {
    return NextResponse.json({ error: 'Cliente e tipo sao obrigatorios.' }, { status: 400 })
  }

  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, gestorId: session.user.id } })
  if (!cliente) return NextResponse.json({ error: 'Cliente nao encontrado.' }, { status: 404 })

  const produto = await prisma.produtoCliente.create({
    data: {
      clienteId,
      tipo,
      nome: nome || null,
      status: status || 'EM_COTACAO',
      local: local || null,
      origem: origem || null,
      destino: destino || null,
      dataInicio: dataInicio ? new Date(dataInicio) : null,
      dataFim: dataFim ? new Date(dataFim) : null,
      dataFlexivel: dataFlexivel || null,
      classe: classe || null,
      precoReferencia: parseFloat(precoReferencia) || 0,
      precoAtlas: parseFloat(precoAtlas) || 0,
      responsavelId: responsavelId || session.user.id,
      observacoes: observacoes || null,
    },
  })

  return NextResponse.json({ id: produto.id })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, action, status } = body
  if (!id) return NextResponse.json({ error: 'Produto nao informado.' }, { status: 400 })

  const produto = await prisma.produtoCliente.findFirst({
    where: { id, cliente: { gestorId: session.user.id } },
  })
  if (!produto) return NextResponse.json({ error: 'Produto nao encontrado.' }, { status: 404 })

  if (action === 'status') {
    const atualizado = await prisma.produtoCliente.update({ where: { id }, data: { status } })
    return NextResponse.json({ id: atualizado.id, status: atualizado.status })
  }

  if (action === 'checkin') {
    const atualizado = await prisma.produtoCliente.update({
      where: { id },
      data: { checkinRealizado: !produto.checkinRealizado },
    })
    return NextResponse.json({ id: atualizado.id, checkinRealizado: atualizado.checkinRealizado })
  }

  return NextResponse.json({ error: 'Acao invalida.' }, { status: 400 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Produto nao informado.' }, { status: 400 })

  const produto = await prisma.produtoCliente.findFirst({
    where: { id, cliente: { gestorId: session.user.id } },
  })
  if (!produto) return NextResponse.json({ error: 'Produto nao encontrado.' }, { status: 404 })

  await prisma.produtoCliente.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
