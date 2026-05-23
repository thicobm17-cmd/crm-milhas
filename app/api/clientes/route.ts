import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const clientes = await prisma.cliente.findMany({
    where: { gestorId: session.user.id, ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(clientes)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { nome, email, telefone, cpf, dataNascimento, feeMensal, feePorEmissao, metaEconomia, observacoes } = body

  if (!nome) return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })

  const cliente = await prisma.cliente.create({
    data: {
      gestorId: session.user.id,
      nome,
      email: email || null,
      telefone: telefone || null,
      cpf: cpf || null,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      feeMensal: parseFloat(feeMensal) || 0,
      feePorEmissao: parseFloat(feePorEmissao) || 0,
      metaEconomia: parseFloat(metaEconomia) || 0,
      observacoes: observacoes || null,
    },
  })

  return NextResponse.json({ id: cliente.id })
}
