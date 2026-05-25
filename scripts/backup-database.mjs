import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
]

function retainCount() {
  const value = Number(process.env.BACKUP_RETAIN_COUNT || '30')
  return Number.isFinite(value) && value > 0 ? value : 30
}

export async function createBackupSnapshot({ reason = 'manual' } = {}) {
  const data = {}
  const recordCounts = {}

  for (const [payloadKey, modelName] of MODEL_EXPORTS) {
    const records = await prisma[modelName].findMany()
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
      payload,
      recordCounts,
      sizeBytes: Buffer.byteLength(json, 'utf8'),
    },
  })

  const oldSnapshots = await prisma.backupSnapshot.findMany({
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    skip: retainCount(),
  })

  if (oldSnapshots.length > 0) {
    await prisma.backupSnapshot.deleteMany({
      where: { id: { in: oldSnapshots.map(item => item.id) } },
    })
  }

  return snapshot
}

export async function createBackupIfDue({ reason = 'automatic', minHours = 24 } = {}) {
  const last = await prisma.backupSnapshot.findFirst({
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  if (last) {
    const ageMs = Date.now() - last.createdAt.getTime()
    if (ageMs < minHours * 60 * 60 * 1000) return null
  }

  return createBackupSnapshot({ reason })
}

if (import.meta.url === `file:///${process.argv[1]?.replaceAll('\\', '/')}` || import.meta.url === `file://${process.argv[1]}`) {
  const reason = process.argv[2] || 'manual_cli'
  createBackupSnapshot({ reason })
    .then((snapshot) => {
      console.log(`[backup] Created ${snapshot.id} (${snapshot.sizeBytes} bytes).`)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
