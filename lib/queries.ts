import { prisma } from '@/lib/db'
import type { Decimal } from '@prisma/client/runtime/library'

export function toNum(d: Decimal | number | string): number {
  if (typeof d === 'number') return d
  if (typeof d === 'string') return parseFloat(d)
  return d.toNumber()
}

export function calcEconomia(
  precoMercado: Decimal | number,
  taxasPagas: Decimal | number,
  feeCobrado: Decimal | number
): number {
  return toNum(precoMercado) - toNum(taxasPagas) - toNum(feeCobrado)
}

export async function getClientesComResumo(gestorId: string) {
  const clientes = await prisma.cliente.findMany({
    where: { gestorId },
    include: {
      emissoes: {
        where: { status: 'confirmada' },
        select: { precoMercado: true, taxasPagas: true, feeCobrado: true, milhasUtilizadas: true },
      },
    },
    orderBy: { nome: 'asc' },
  })

  return clientes.map(c => ({
    ...c,
    feeMensal: toNum(c.feeMensal),
    feePorEmissao: toNum(c.feePorEmissao),
    metaEconomia: toNum(c.metaEconomia),
    economiaTotal: c.emissoes.reduce(
      (acc, e) => acc + calcEconomia(e.precoMercado, e.taxasPagas, e.feeCobrado), 0
    ),
    totalEmissoes: c.emissoes.length,
    totalMilhasUsadas: c.emissoes.reduce((acc, e) => acc + e.milhasUtilizadas, 0),
  }))
}

export async function getProgramas() {
  return prisma.programa.findMany({ orderBy: { id: 'asc' } })
}
