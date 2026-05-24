import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Apenas CEO pode gerenciar acessos
async function requireCEO() {
  const session = await auth()
  if (!session) return { error: 'Nao autorizado', status: 401 as const }
  const gestor = await prisma.gestor.findUnique({ where: { id: session.user.id }, select: { cargo: true } })
  if (gestor?.cargo !== 'CEO') return { error: 'Apenas o CEO pode gerenciar acessos.', status: 403 as const }
  return { session }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireCEO()
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const { id, action, cargo } = await request.json()
  if (!id) return NextResponse.json({ error: 'Gestor nao informado.' }, { status: 400 })

  if (action === 'autorizar') {
    const gestor = await prisma.gestor.update({
      where: { id },
      data: { autorizado: true, cargo: cargo || 'GESTOR' },
    })
    return NextResponse.json({ id: gestor.id, autorizado: true })
  }

  if (action === 'definir_cargo') {
    if (!cargo) return NextResponse.json({ error: 'Cargo nao informado.' }, { status: 400 })
    const gestor = await prisma.gestor.update({ where: { id }, data: { cargo } })
    return NextResponse.json({ id: gestor.id, cargo: gestor.cargo })
  }

  return NextResponse.json({ error: 'Acao invalida.' }, { status: 400 })
}

export async function DELETE(request: NextRequest) {
  const guard = await requireCEO()
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Gestor nao informado.' }, { status: 400 })

  // Nao permite o CEO se auto-remover
  if (id === guard.session.user.id) {
    return NextResponse.json({ error: 'Voce nao pode remover a si mesmo.' }, { status: 400 })
  }

  await prisma.gestor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
