import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const clientes = await prisma.cliente.findMany({
    where: { gestorId: session.user.id, ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(clientes)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { nome, email, telefone, cpf, dataNascimento, produtoContratado, valorProduto, observacoes } = body

  if (!nome) return NextResponse.json({ error: 'Nome e obrigatorio.' }, { status: 400 })

  const valorInvestido = parseFloat(valorProduto) || 0
  const hoje = new Date()
  const acessoFim = valorInvestido > 0 ? new Date(hoje) : null
  if (acessoFim) acessoFim.setMonth(acessoFim.getMonth() + 1)

  const cliente = await prisma.cliente.create({
    data: {
      gestorId: session.user.id,
      nome: String(nome).trim(),
      email: email || null,
      telefone: telefone || null,
      cpf: cpf || null,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      feeMensal: 0,
      feePorEmissao: 0,
      produtoContratado: produtoContratado || null,
      metaEconomia: valorInvestido,
      acessoInicio: valorInvestido > 0 ? hoje : null,
      acessoFim,
      observacoes: observacoes || null,
    },
  })

  if (valorInvestido > 0) {
    await prisma.transacao.create({
      data: {
        gestorId: session.user.id,
        clienteId: cliente.id,
        tipo: 'receita',
        descricao: `Produto contratado: ${produtoContratado || 'Produto Atlas'}`,
        valor: valorInvestido,
        pago: false,
      },
    })
  }

  return NextResponse.json({ id: cliente.id })
}
