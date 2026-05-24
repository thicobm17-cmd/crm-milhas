import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const {
    clienteId, programaId, origem, destino, dataVoo, passageiros,
    milhasUtilizadas, precoMercado, taxasPagas, feeCobrado, classe, observacoes, status,
  } = body

  if (!clienteId || !origem || !destino || !dataVoo) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })
  }

  const emissao = await prisma.emissao.create({
    data: {
      gestorId: session.user.id,
      clienteId,
      programaId: programaId ? parseInt(programaId) : null,
      origem: origem.toUpperCase(),
      destino: destino.toUpperCase(),
      dataVoo: new Date(dataVoo),
      passageiros: parseInt(passageiros) || 1,
      milhasUtilizadas: parseInt(milhasUtilizadas) || 0,
      precoMercado: parseFloat(precoMercado) || 0,
      taxasPagas: parseFloat(taxasPagas) || 0,
      feeCobrado: parseFloat(feeCobrado) || 0,
      classe,
      observacoes: observacoes || null,
      status,
    },
  })

  const valorAtlas = parseFloat(feeCobrado)
  if (valorAtlas > 0) {
    await prisma.transacao.create({
      data: {
        gestorId: session.user.id,
        clienteId,
        emissaoId: emissao.id,
        tipo: 'receita_emissao',
        descricao: `Receita Atlas da emissao: ${origem.toUpperCase()} -> ${destino.toUpperCase()}`,
        valor: valorAtlas,
      },
    })
  }

  return NextResponse.json({ id: emissao.id })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, status } = body
  if (!id || !status) return NextResponse.json({ error: 'Dados faltando.' }, { status: 400 })

  const existente = await prisma.emissao.findFirst({ where: { id, gestorId: session.user.id } })
  if (!existente) return NextResponse.json({ error: 'Emissao nao encontrada.' }, { status: 404 })

  const emissao = await prisma.emissao.update({ where: { id }, data: { status } })
  return NextResponse.json({ id: emissao.id, status: emissao.status })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Emissao nao informada.' }, { status: 400 })

  const existente = await prisma.emissao.findFirst({ where: { id, gestorId: session.user.id } })
  if (!existente) return NextResponse.json({ error: 'Emissao nao encontrada.' }, { status: 404 })

  // Remove transacoes vinculadas antes (evita FK)
  await prisma.transacao.deleteMany({ where: { emissaoId: id } })
  await prisma.emissao.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
