import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

const MODEL_EXPORTS = [
  ['gestores', 'gestor'],
  ['empresas', 'empresa'],
  ['programas', 'programa'],
  ['clientes', 'cliente'],
  ['contasProgramas', 'contaPrograma'],
  ['cartoesCredito', 'cartaoCredito'],
  ['leads', 'lead'],
  ['leadRespostas', 'leadResposta'],
  ['callsVendas', 'callVenda'],
  ['callParticipantes', 'callParticipante'],
  ['emissoes', 'emissao'],
  ['produtosClientes', 'produtoCliente'],
  ['transacoes', 'transacao'],
  ['metasMensais', 'metaMensal'],
  ['renovacoes', 'renovacao'],
  ['produtosCatalogo', 'produtoCatalogo'],
  ['notificacoes', 'notificacao'],
] as const

type PrismaModelDelegate = {
  findMany: (args?: { orderBy?: { createdAt?: 'asc' } }) => Promise<unknown[]>
}

function getPrismaModel(modelName: string) {
  return (prisma as unknown as Record<string, PrismaModelDelegate>)[modelName]
}

export async function createBackupSnapshot(options: { reason?: string; createdById?: string | null; retainCount?: number } = {}) {
  const reason = options.reason || 'manual'
  const retainCount = options.retainCount ?? 30
  const data: Record<string, unknown[]> = {}
  const recordCounts: Record<string, number> = {}

  for (const [payloadKey, modelName] of MODEL_EXPORTS) {
    const model = getPrismaModel(modelName)
    const records = await model.findMany()
    data[payloadKey] = records
    recordCounts[payloadKey] = records.length
  }

  const payload = {
    metadata: {
      app: 'Atlas Beyond Destinations CRM',
      version: 1,
      generatedAt: new Date().toISOString(),
      reason,
    },
    data,
  }

  const json = JSON.stringify(payload)
  const snapshot = await prisma.backupSnapshot.create({
    data: {
      reason,
      createdById: options.createdById || null,
      payload: payload as Prisma.InputJsonValue,
      recordCounts: recordCounts as Prisma.InputJsonValue,
      sizeBytes: Buffer.byteLength(json, 'utf8'),
    },
  })

  if (retainCount > 0) {
    const oldSnapshots = await prisma.backupSnapshot.findMany({
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      skip: retainCount,
    })

    if (oldSnapshots.length > 0) {
      await prisma.backupSnapshot.deleteMany({
        where: { id: { in: oldSnapshots.map(item => item.id) } },
      })
    }
  }

  return snapshot
}

export async function createBackupIfDue(options: { reason?: string; minHours?: number; retainCount?: number } = {}) {
  const minHours = options.minHours ?? 24
  const last = await prisma.backupSnapshot.findFirst({
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  if (last) {
    const ageMs = Date.now() - last.createdAt.getTime()
    if (ageMs < minHours * 60 * 60 * 1000) return null
  }

  return createBackupSnapshot({
    reason: options.reason || 'automatic',
    retainCount: options.retainCount,
  })
}
