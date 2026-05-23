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

  const feeVal = parseFloat(feeCobrado)
  if (feeVal > 0) {
    await prisma.transacao.create({
      data: {
        gestorId: session.user.id,
        clienteId,
        emissaoId: emissao.id,
        tipo: 'fee_emissao',
        descricao: `Fee de emissão: ${origem.toUpperCase()} → ${destino.toUpperCase()}`,
        valor: feeVal,
      },
    })
  }

  return NextResponse.json({ id: emissao.id })
}
