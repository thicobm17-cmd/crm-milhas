import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseSaoPauloDateTime } from '@/lib/date-time'

function getDeniedFollowUpDate() {
  const date = new Date()
  date.setDate(date.getDate() - 15)
  return date
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  await prisma.lead.updateMany({
    where: {
      statusFinal: 'FOLLOW_UP',
      followUpInicio: { lte: getDeniedFollowUpDate() },
    },
    data: { statusFinal: 'CLIENTE_NEGADO' },
  })

  const leads = await prisma.lead.findMany({
    where: { statusFinal: { not: 'CLIENTE' } },
    include: {
      respostas: { orderBy: { createdAt: 'asc' } },
      primeiroContatoGestor: { select: { id: true, nome: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(leads)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { nome, whatsapp, email, origem, indicadoPor, gastoMensal, respostas = [] } = body

  if (!nome || !whatsapp || !email) {
    return NextResponse.json({ error: 'Nome, WhatsApp e email sao obrigatorios.' }, { status: 400 })
  }

  const lead = await prisma.lead.create({
    data: {
      nome: String(nome).trim(),
      whatsapp: String(whatsapp).trim(),
      email: String(email).trim().toLowerCase(),
      origem: origem || null,
      indicadoPor: indicadoPor || null,
      gastoMensal: gastoMensal || null,
      respostas: {
        create: Array.isArray(respostas)
          ? respostas
              .filter((item) => item?.pergunta && item?.resposta)
              .map((item) => ({
                bloco: String(item.bloco || 'Questionário'),
                pergunta: String(item.pergunta),
                resposta: String(item.resposta),
              }))
          : [],
      },
    },
  })

  return NextResponse.json({ id: lead.id })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, action } = body

  if (!id) return NextResponse.json({ error: 'Lead nao informado.' }, { status: 400 })

  if (action === 'primeiro_contato') {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        primeiroContatoRealizado: true,
        primeiroContatoGestorId: body.gestorId || session.user.id,
        statusCall: 'AGUARDANDO_MARCACAO',
      },
    })
    return NextResponse.json(lead)
  }

  if (action === 'agendar_call') {
    const dataHora = parseSaoPauloDateTime(body.dataHora)
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        statusCall: dataHora ? 'MARCADA' : 'AGUARDANDO_MARCACAO',
        callMarcadaPara: dataHora,
      },
    })
    return NextResponse.json(lead)
  }

  if (action === 'follow_up') {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        statusFinal: 'FOLLOW_UP',
        followUpInicio: new Date(),
      },
    })
    return NextResponse.json(lead)
  }

  if (action === 'cliente_negado') {
    const lead = await prisma.lead.update({
      where: { id },
      data: { statusFinal: 'CLIENTE_NEGADO' },
    })
    return NextResponse.json(lead)
  }

  return NextResponse.json({ error: 'Acao invalida.' }, { status: 400 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Lead nao informado.' }, { status: 400 })

  await prisma.lead.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
