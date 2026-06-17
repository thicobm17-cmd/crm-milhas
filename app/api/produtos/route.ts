import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Produtos do cliente: PASSAGEM, HOTEL, PASSEIO, SEGURO (conforme PDF Atlas)
// economia = precoReferencia - precoAtlas (soma vitalicia na economia do cliente)
function parseMoney(value: unknown) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const normalized = String(value).trim()
  if (!normalized) return 0
  if (normalized.includes(',')) {
    return Number(normalized.replace(/\./g, '').replace(',', '.')) || 0
  }
  return Number(normalized) || 0
}

export async function POST(request: NextRequest) {
  try {
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

    const responsavel = responsavelId
      ? await prisma.gestor.findUnique({ where: { id: responsavelId }, select: { id: true } })
      : null

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
        precoReferencia: parseMoney(precoReferencia),
        precoAtlas: parseMoney(precoAtlas),
        responsavelId: responsavel?.id || session.user.id,
        observacoes: observacoes || null,
      },
    })

    return NextResponse.json({ id: produto.id })
  } catch (error) {
    console.error('Erro ao salvar produto do cliente:', error)
    return NextResponse.json({ error: 'Erro ao salvar produto. Tente novamente.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const body = await request.json()
    const { id, action, status } = body
    if (!id) return NextResponse.json({ error: 'Produto nao informado.' }, { status: 400 })

    const produto = await prisma.produtoCliente.findFirst({
      where: { id, cliente: { gestorId: session.user.id } },
    })
    if (!produto) return NextResponse.json({ error: 'Produto nao encontrado.' }, { status: 404 })

    if (action === 'update') {
      const {
        tipo, nome, local, origem, destino, dataInicio, dataFim,
        dataFlexivel, classe, precoReferencia, precoAtlas, responsavelId, observacoes,
      } = body

      const responsavel = responsavelId
        ? await prisma.gestor.findUnique({ where: { id: responsavelId }, select: { id: true } })
        : null

      const atualizado = await prisma.produtoCliente.update({
        where: { id },
        data: {
          tipo: tipo || produto.tipo,
          nome: nome || null,
          local: local || null,
          origem: origem || null,
          destino: destino || null,
          dataInicio: dataInicio ? new Date(dataInicio) : null,
          dataFim: dataFim ? new Date(dataFim) : null,
          dataFlexivel: dataFlexivel || null,
          classe: classe || null,
          precoReferencia: parseMoney(precoReferencia),
          precoAtlas: parseMoney(precoAtlas),
          responsavelId: responsavel?.id || session.user.id,
          observacoes: observacoes || null,
        },
      })

      return NextResponse.json({ id: atualizado.id })
    }

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
  } catch (error) {
    console.error('Erro ao atualizar produto do cliente:', error)
    return NextResponse.json({ error: 'Erro ao atualizar produto. Tente novamente.' }, { status: 500 })
  }
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
