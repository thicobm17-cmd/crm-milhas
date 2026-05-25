import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Props {
  params: Promise<{ id: string }>
}

async function requireCEO() {
  const session = await auth()
  if (!session) return { error: NextResponse.json({ error: 'Nao autorizado' }, { status: 401 }) }

  const gestor = await prisma.gestor.findUnique({
    where: { id: session.user.id },
    select: { cargo: true },
  })

  if (gestor?.cargo !== 'CEO') {
    return { error: NextResponse.json({ error: 'Apenas CEO pode gerenciar backups.' }, { status: 403 }) }
  }

  return { ok: true }
}

export async function GET(_request: NextRequest, { params }: Props) {
  const access = await requireCEO()
  if (access.error) return access.error

  const { id } = await params
  const snapshot = await prisma.backupSnapshot.findUnique({ where: { id } })
  if (!snapshot) return NextResponse.json({ error: 'Backup nao encontrado.' }, { status: 404 })

  const date = snapshot.createdAt.toISOString().slice(0, 10)
  return new NextResponse(JSON.stringify(snapshot.payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="atlas-backup-${date}-${snapshot.id}.json"`,
    },
  })
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  const access = await requireCEO()
  if (access.error) return access.error

  const { id } = await params
  await prisma.backupSnapshot.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
