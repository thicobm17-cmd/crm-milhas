import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createBackupSnapshot } from '@/lib/backup'

async function requireCEO() {
  const session = await auth()
  if (!session) return { error: NextResponse.json({ error: 'Nao autorizado' }, { status: 401 }) }

  const gestor = await prisma.gestor.findUnique({
    where: { id: session.user.id },
    select: { id: true, cargo: true },
  })

  if (gestor?.cargo !== 'CEO') {
    return { error: NextResponse.json({ error: 'Apenas CEO pode gerenciar backups.' }, { status: 403 }) }
  }

  return { gestorId: gestor.id }
}

export async function GET() {
  const access = await requireCEO()
  if (access.error) return access.error

  const backups = await prisma.backupSnapshot.findMany({
    select: {
      id: true,
      reason: true,
      status: true,
      recordCounts: true,
      sizeBytes: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  return NextResponse.json(backups)
}

export async function POST() {
  const access = await requireCEO()
  if (access.error) return access.error

  const snapshot = await createBackupSnapshot({
    reason: 'manual',
    createdById: access.gestorId,
  })

  return NextResponse.json({ id: snapshot.id })
}
