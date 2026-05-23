import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome, telefone } = await request.json()

  await prisma.gestor.update({
    where: { id: session.user.id },
    data: { nome, telefone: telefone || null },
  })

  return NextResponse.json({ ok: true })
}
