import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseSaoPauloDateTime } from '@/lib/date-time'

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function buildAnswers(respostas: unknown) {
  if (!Array.isArray(respostas)) return []
  return respostas
    .filter((item) => item?.pergunta && item?.resposta)
    .map((item) => ({
      bloco: String(item.bloco || 'Call de vendas'),
      pergunta: String(item.pergunta),
      resposta: String(item.resposta),
    }))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const {
    origemCliente,
    leadId,
    manualLead,
    respostas,
    dataHora,
    produto,
    valor,
    periodoMeses,
    fechou,
    pago,
    observacoes,
    participanteIds = [],
  } = body

  const valorProduto = parseFloat(valor) || 0
  const meses = Math.max(1, Math.min(parseInt(periodoMeses, 10) || 1, 12))
  const clienteFechou = fechou === true || fechou === 'true'
  const pagamentoFeito = pago === true || pago === 'true'
  const dataHoraCall = parseSaoPauloDateTime(dataHora)
  const callAnswers = buildAnswers(respostas)

  if (!produto && clienteFechou) {
    return NextResponse.json({ error: 'Informe o produto contratado.' }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    let lead = leadId
      ? await tx.lead.findUnique({ where: { id: leadId }, include: { respostas: true } })
      : null

    if (!lead) {
      if (!manualLead?.nome || !manualLead?.whatsapp || !manualLead?.email) {
        throw new Error('Informe nome, WhatsApp e email do cliente indicado.')
      }

      lead = await tx.lead.create({
        data: {
          nome: String(manualLead.nome).trim(),
          whatsapp: String(manualLead.whatsapp).trim(),
          email: String(manualLead.email).trim().toLowerCase(),
          origem: 'Indicação',
          indicadoPor: manualLead.indicadoPor || null,
          gastoMensal: manualLead.gastoMensal || null,
          statusCall: dataHoraCall ? 'MARCADA' : 'AGUARDANDO_MARCACAO',
          primeiroContatoRealizado: true,
          primeiroContatoGestorId: session.user.id,
          callMarcadaPara: dataHoraCall,
          respostas: { create: callAnswers },
        },
        include: { respostas: true },
      })
    } else if (callAnswers.length > 0) {
      const existingLeadId = lead.id
      await tx.leadResposta.createMany({
        data: callAnswers.map((answer) => ({
          leadId: existingLeadId,
          bloco: answer.bloco,
          pergunta: answer.pergunta,
          resposta: answer.resposta,
        })),
      })
    }

    const call = await tx.callVenda.create({
      data: {
        leadId: lead.id,
        criadoPorId: session.user.id,
        origemCliente: origemCliente || (leadId ? 'FUNIL' : 'INDICACAO'),
        dataHora: dataHoraCall || lead.callMarcadaPara,
        produto: produto || null,
        valor: valorProduto || null,
        fechou: clienteFechou,
        observacoes: observacoes || null,
        participantes: {
          create: Array.isArray(participanteIds)
            ? participanteIds
                .filter(Boolean)
                .map((gestorId: string) => ({ gestorId }))
            : [],
        },
      },
    })

    if (!clienteFechou) {
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          statusFinal: 'FOLLOW_UP',
          followUpInicio: new Date(),
          statusCall: dataHoraCall ? 'MARCADA' : 'AGUARDANDO_MARCACAO',
          callMarcadaPara: dataHoraCall || lead.callMarcadaPara,
        },
      })
      return { callId: call.id, clienteId: null }
    }

    const inicioContrato = new Date()
    const fimContrato = addMonths(inicioContrato, meses)
    const cliente = await tx.cliente.create({
      data: {
        gestorId: session.user.id,
        nome: lead.nome,
        email: lead.email,
        telefone: lead.whatsapp,
        feeMensal: 0,
        feePorEmissao: 0,
        produtoContratado: produto,
        metaEconomia: valorProduto,
        acessoInicio: inicioContrato,
        acessoFim: fimContrato,
        observacoes: observacoes || `Convertido pela call de vendas (${origemCliente || 'FUNIL'}).`,
      },
    })

    if (valorProduto > 0) {
      await tx.transacao.create({
        data: {
          gestorId: session.user.id,
          clienteId: cliente.id,
          tipo: 'receita',
          descricao: `Produto contratado: ${produto}`,
          valor: valorProduto,
          pago: pagamentoFeito,
          dataPagamento: pagamentoFeito ? new Date() : null,
        },
      })

      await tx.renovacao.create({
        data: {
          clienteId: cliente.id,
          produto,
          inicioContrato,
          fimContrato,
          status: 'ATIVA',
        },
      })
    }

    await tx.lead.update({
      where: { id: lead.id },
      data: {
        statusFinal: 'CLIENTE',
        clienteId: cliente.id,
      },
    })

    return { callId: call.id, clienteId: cliente.id }
  })

  return NextResponse.json(result)
}
