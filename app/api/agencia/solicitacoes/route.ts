import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

function parseDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  if (!body.nome || !body.telefone) {
    return NextResponse.json({ error: 'Informe nome e telefone.' }, { status: 400 })
  }

  const solicitacao = await prisma.solicitacaoOrcamento.create({
    data: {
      consultorId: session.user.id,
      nome: String(body.nome).trim(),
      telefone: String(body.telefone).trim(),
      email: body.email ? String(body.email).trim().toLowerCase() : null,
      destinoDesejado: body.destinoDesejado || null,
      dataViagem: parseDate(body.dataViagem),
      quantidadePassageiros: Math.max(1, Number(body.quantidadePassageiros) || 1),
      observacoes: body.observacoes || null,
      origemLead: body.origemLead || 'Cadastro manual',
      status: body.status || 'NOVA',
    },
  })

  return NextResponse.json(solicitacao)
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Solicitação não informada.' }, { status: 400 })

  if (body.action === 'converter_cotacao') {
    const solicitacao = await prisma.solicitacaoOrcamento.findUnique({ where: { id: body.id } })
    if (!solicitacao) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 })

    const cotacao = await prisma.cotacaoAgencia.create({
      data: {
        solicitacaoId: solicitacao.id,
        clienteId: solicitacao.clienteId,
        consultorId: session.user.id,
        origemLead: solicitacao.origemLead,
        destino: solicitacao.destinoDesejado || 'Destino a definir',
        dataViagem: solicitacao.dataViagem,
        status: 'AGUARDANDO',
      },
    })

    await prisma.solicitacaoOrcamento.update({
      where: { id: solicitacao.id },
      data: { status: 'CONVERTIDA_EM_COTACAO' },
    })

    return NextResponse.json(cotacao)
  }

  const solicitacao = await prisma.solicitacaoOrcamento.update({
    where: { id: body.id },
    data: { status: body.status || 'EM_ANALISE' },
  })

  return NextResponse.json(solicitacao)
}
