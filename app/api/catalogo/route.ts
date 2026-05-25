import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { atlasProducts } from '@/lib/atlas-products'

// Catalogo de produtos/servicos da empresa (Gestao Completa, Consultorias, etc.)
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  let produtos = await prisma.produtoCatalogo.findMany({
    where: { gestorId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  // Primeira vez: semeia os 4 produtos padrao do PDF com preco a definir (0)
  if (produtos.length === 0) {
    await prisma.produtoCatalogo.createMany({
      data: atlasProducts.map((nome) => ({ gestorId: session.user.id, nome, preco: 0 })),
    })
    produtos = await prisma.produtoCatalogo.findMany({
      where: { gestorId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })
  }

  return NextResponse.json(produtos.map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco), ativo: p.ativo })))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { nome, preco } = await request.json()
  if (!nome || !String(nome).trim()) return NextResponse.json({ error: 'Nome do produto e obrigatorio.' }, { status: 400 })

  const produto = await prisma.produtoCatalogo.create({
    data: { gestorId: session.user.id, nome: String(nome).trim(), preco: parseFloat(preco) || 0 },
  })

  return NextResponse.json({ id: produto.id })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { id, nome, preco, ativo } = await request.json()
  if (!id) return NextResponse.json({ error: 'Produto nao informado.' }, { status: 400 })

  const existente = await prisma.produtoCatalogo.findFirst({ where: { id, gestorId: session.user.id } })
  if (!existente) return NextResponse.json({ error: 'Produto nao encontrado.' }, { status: 404 })

  const produto = await prisma.produtoCatalogo.update({
    where: { id },
    data: {
      ...(nome !== undefined ? { nome: String(nome).trim() } : {}),
      ...(preco !== undefined ? { preco: parseFloat(preco) || 0 } : {}),
      ...(ativo !== undefined ? { ativo: !!ativo } : {}),
    },
  })

  return NextResponse.json({ id: produto.id, preco: Number(produto.preco) })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Produto nao informado.' }, { status: 400 })

  const existente = await prisma.produtoCatalogo.findFirst({ where: { id, gestorId: session.user.id } })
  if (!existente) return NextResponse.json({ error: 'Produto nao encontrado.' }, { status: 404 })

  await prisma.produtoCatalogo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
