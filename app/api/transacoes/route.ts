import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { tipo, descricao, valor, clienteId, dataVencimento, pago } = await request.json()

  if (!descricao || !valor) return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })

  const transacao = await prisma.transacao.create({
    data: {
      gestorId: session.user.id,
      tipo,
      descricao,
      valor: parseFloat(valor),
      clienteId: clienteId || null,
      dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
      pago: pago === 'true',
    },
  })

  return NextResponse.json({ id: transacao.id })
}
