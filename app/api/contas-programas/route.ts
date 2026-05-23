import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { clienteId, programaId, numeroConta, saldoAtual } = await request.json()

  const conta = await prisma.contaPrograma.create({
    data: {
      clienteId,
      gestorId: session.user.id,
      programaId,
      numeroConta: numeroConta || null,
      saldoAtual: saldoAtual || 0,
      ultimaAtualizacaoSaldo: new Date(),
    },
  })

  return NextResponse.json({ id: conta.id })
}
