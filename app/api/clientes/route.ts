import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const MAX_PROFILE_IMAGE_LENGTH = 900_000

function validateFotoUrl(fotoUrl: unknown) {
  if (fotoUrl === undefined) return undefined
  if (!fotoUrl) return null
  if (typeof fotoUrl !== 'string') throw new Error('Imagem invalida.')
  if (!fotoUrl.startsWith('data:image/')) throw new Error('A foto precisa ser uma imagem valida.')
  if (fotoUrl.length > MAX_PROFILE_IMAGE_LENGTH) throw new Error('A imagem ficou grande demais. Use uma foto menor.')
  return fotoUrl
}

function parseDateOnly(value: unknown) {
  if (value === undefined) return undefined
  if (!value) return null
  if (typeof value !== 'string') return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`)
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const clientes = await prisma.cliente.findMany({
    where: { gestorId: session.user.id, ativo: true },
    select: { id: true, nome: true, cpf: true, dataNascimento: true },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(clientes)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { nome, email, telefone, cpf, dataNascimento, produtoContratado, valorProduto, observacoes, mesesAcesso, fotoUrl } = body

  if (!nome) return NextResponse.json({ error: 'Nome e obrigatorio.' }, { status: 400 })
  let fotoValidada: string | null | undefined
  try {
    fotoValidada = validateFotoUrl(fotoUrl)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Imagem invalida.' }, { status: 400 })
  }

  const valorInvestido = parseFloat(valorProduto) || 0
  // Plano anual por padrao (12 meses). Periodo de acesso = quando o plano vence.
  const meses = parseInt(mesesAcesso) || 12
  const hoje = new Date()
  const acessoFim = valorInvestido > 0 ? new Date(hoje) : null
  if (acessoFim) acessoFim.setMonth(acessoFim.getMonth() + meses)

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
      ...(fotoValidada !== undefined ? { fotoUrl: fotoValidada } : {}),
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

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, action } = body
  if (!id) return NextResponse.json({ error: 'Cliente nao informado.' }, { status: 400 })

  // Garante que o cliente pertence ao gestor (multi-tenant)
  const existente = await prisma.cliente.findFirst({ where: { id, gestorId: session.user.id } })
  if (!existente) return NextResponse.json({ error: 'Cliente nao encontrado.' }, { status: 404 })

  if (action === 'toggle_ativo') {
    const cliente = await prisma.cliente.update({
      where: { id },
      data: { ativo: !existente.ativo },
    })
    return NextResponse.json({ id: cliente.id, ativo: cliente.ativo })
  }

  // Edicao geral dos dados do cliente
  const { nome, email, telefone, cpf, dataNascimento, produtoContratado, valorProduto, acessoInicio, acessoFim, observacoes, fotoUrl } = body
  const valorInvestido = valorProduto !== undefined && valorProduto !== '' ? parseFloat(valorProduto) : undefined
  const acessoInicioAtualizado = parseDateOnly(acessoInicio)
  const acessoFimAtualizado = parseDateOnly(acessoFim)
  let fotoValidada: string | null | undefined
  try {
    fotoValidada = validateFotoUrl(fotoUrl)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Imagem invalida.' }, { status: 400 })
  }

  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      ...(nome !== undefined ? { nome: String(nome).trim() } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
      ...(telefone !== undefined ? { telefone: telefone || null } : {}),
      ...(cpf !== undefined ? { cpf: cpf || null } : {}),
      ...(dataNascimento !== undefined ? { dataNascimento: dataNascimento ? new Date(dataNascimento) : null } : {}),
      ...(produtoContratado !== undefined ? { produtoContratado: produtoContratado || null } : {}),
      ...(valorInvestido !== undefined && !Number.isNaN(valorInvestido) ? { metaEconomia: valorInvestido } : {}),
      ...(acessoInicioAtualizado !== undefined ? { acessoInicio: acessoInicioAtualizado } : {}),
      ...(acessoFimAtualizado !== undefined ? { acessoFim: acessoFimAtualizado } : {}),
      ...(observacoes !== undefined ? { observacoes: observacoes || null } : {}),
      ...(fotoValidada !== undefined ? { fotoUrl: fotoValidada } : {}),
    },
  })

  return NextResponse.json({ id: cliente.id })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Cliente nao informado.' }, { status: 400 })

  const existente = await prisma.cliente.findFirst({ where: { id, gestorId: session.user.id } })
  if (!existente) return NextResponse.json({ error: 'Cliente nao encontrado.' }, { status: 404 })

  // onDelete: Cascade no schema remove contas, emissoes, produtos, cartoes e renovacoes
  await prisma.cliente.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
