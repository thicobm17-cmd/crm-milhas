import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { tipo, descricao, valor, clienteId, dataVencimento, pago, recorrente, recorrenteAte } = await request.json()

  if (!descricao || !valor) return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })

  const ehRecorrente = recorrente === 'true' || recorrente === true
  const estaPago = pago === 'true' || pago === true

  const transacao = await prisma.transacao.create({
    data: {
      gestorId: session.user.id,
      tipo,
      descricao,
      valor: parseFloat(valor),
      clienteId: clienteId || null,
      dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
      pago: estaPago,
      dataPagamento: estaPago ? new Date() : null,
      recorrente: ehRecorrente,
      recorrenteAte: ehRecorrente && recorrenteAte ? new Date(recorrenteAte) : null,
    },
  })

  return NextResponse.json({ id: transacao.id })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, action } = body
  if (!id) return NextResponse.json({ error: 'Transacao nao informada.' }, { status: 400 })

  const existente = await prisma.transacao.findFirst({ where: { id, gestorId: session.user.id } })
  if (!existente) return NextResponse.json({ error: 'Transacao nao encontrada.' }, { status: 404 })

  if (action === 'marcar_pago') {
    // Ao confirmar pagamento, opcionalmente soma periodo de acesso ao produto do cliente (1 a 12 meses)
    const meses = parseInt(body.mesesAcesso) || 0
    const transacao = await prisma.transacao.update({
      where: { id },
      data: { pago: true, dataPagamento: new Date() },
    })

    if (meses > 0 && existente.clienteId) {
      const cliente = await prisma.cliente.findUnique({ where: { id: existente.clienteId } })
      const base = cliente?.acessoFim && cliente.acessoFim > new Date() ? new Date(cliente.acessoFim) : new Date()
      const acessoFim = new Date(base)
      acessoFim.setMonth(acessoFim.getMonth() + meses)
      await prisma.cliente.update({
        where: { id: existente.clienteId },
        data: {
          acessoInicio: cliente?.acessoInicio ?? new Date(),
          acessoFim,
        },
      })
    }

    return NextResponse.json({ id: transacao.id, pago: true })
  }

  if (action === 'marcar_pendente') {
    const transacao = await prisma.transacao.update({
      where: { id },
      data: { pago: false, dataPagamento: null },
    })
    return NextResponse.json({ id: transacao.id, pago: false })
  }

  if (action === 'editar') {
    const { tipo, descricao, valor, dataVencimento, recorrente, recorrenteAte } = body
    const ehRecorrente = recorrente === 'true' || recorrente === true
    const transacao = await prisma.transacao.update({
      where: { id },
      data: {
        ...(tipo !== undefined ? { tipo } : {}),
        ...(descricao !== undefined ? { descricao: String(descricao) } : {}),
        ...(valor !== undefined && valor !== '' ? { valor: parseFloat(valor) || 0 } : {}),
        ...(dataVencimento !== undefined ? { dataVencimento: dataVencimento ? new Date(dataVencimento) : null } : {}),
        ...(recorrente !== undefined ? { recorrente: ehRecorrente } : {}),
        ...(recorrente !== undefined ? { recorrenteAte: ehRecorrente && recorrenteAte ? new Date(recorrenteAte) : null } : {}),
      },
    })
    return NextResponse.json({ id: transacao.id })
  }

  return NextResponse.json({ error: 'Acao invalida.' }, { status: 400 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Transacao nao informada.' }, { status: 400 })

  const existente = await prisma.transacao.findFirst({ where: { id, gestorId: session.user.id } })
  if (!existente) return NextResponse.json({ error: 'Transacao nao encontrada.' }, { status: 404 })

  await prisma.transacao.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
