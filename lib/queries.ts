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
      produtos: {
        where: { status: 'EMITIDO' },
        select: { precoReferencia: true, precoAtlas: true },
      },
    },
    orderBy: { nome: 'asc' },
  })

  return clientes.map(c => {
    const economiaEmissoes = c.emissoes.reduce(
      (acc, e) => acc + calcEconomia(e.precoMercado, e.taxasPagas, e.feeCobrado), 0
    )
    // Produtos Atlas (hotel, passeio, seguro, passagem): economia = referencia - atlas
    const economiaProdutos = c.produtos.reduce(
      (acc, p) => acc + (toNum(p.precoReferencia) - toNum(p.precoAtlas)), 0
    )
    return {
      ...c,
      feeMensal: toNum(c.feeMensal),
      feePorEmissao: toNum(c.feePorEmissao),
      metaEconomia: toNum(c.metaEconomia),
      economiaTotal: economiaEmissoes + economiaProdutos,
      totalEmissoes: c.emissoes.length + c.produtos.length,
      totalMilhasUsadas: c.emissoes.reduce((acc, e) => acc + e.milhasUtilizadas, 0),
    }
  })
}

export async function getProgramas() {
  return prisma.programa.findMany({ orderBy: { id: 'asc' } })
}

// ── Filtros de periodo (mes/ano) ──────────────────────────────────────────
export interface Periodo {
  mes: number // 1-12, ou 0 para "ano inteiro"
  ano: number
}

export function periodoAtual(): Periodo {
  const agora = new Date()
  return { mes: agora.getMonth() + 1, ano: agora.getFullYear() }
}

export function parsePeriodo(searchParams: { mes?: string; ano?: string }): Periodo {
  const agora = new Date()
  const ano = parseInt(searchParams.ano ?? '') || agora.getFullYear()
  const mesRaw = searchParams.mes !== undefined ? parseInt(searchParams.mes) : agora.getMonth() + 1
  const mes = Number.isNaN(mesRaw) ? agora.getMonth() + 1 : mesRaw // 0 = ano inteiro
  return { mes, ano }
}

// Intervalo [inicio, fim) para o periodo. mes=0 cobre o ano inteiro.
export function intervaloPeriodo({ mes, ano }: Periodo): { gte: Date; lt: Date } {
  if (mes === 0) {
    return { gte: new Date(ano, 0, 1), lt: new Date(ano + 1, 0, 1) }
  }
  return { gte: new Date(ano, mes - 1, 1), lt: new Date(ano, mes, 1) }
}

export const nomesMeses = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// Soma a meta cadastrada no periodo. mes=0 soma todas do ano.
export async function getMetaPeriodo(gestorId: string, { mes, ano }: Periodo): Promise<number> {
  const where = mes === 0 ? { gestorId, ano } : { gestorId, ano, mes }
  const metas = await prisma.metaMensal.findMany({ where })
  return metas.reduce((acc, m) => acc + toNum(m.valor), 0)
}

const RECEITA_TIPOS = ['receita', 'receita_emissao', 'fee_mensal', 'fee_emissao']
const DESPESA_TIPOS = ['despesa', 'compra_milhas', 'imposto']

export interface PontoMensal {
  mes: string
  faturamento: number
  despesa: number
  meta: number
}

const mesesCurto = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Serie financeira de 12 meses do ano: faturamento (receitas pagas),
// despesa (pagas + fixas ativas) e meta de faturamento por mes.
export async function getSerieFinanceiraAno(gestorId: string, ano: number): Promise<PontoMensal[]> {
  const inicio = new Date(ano, 0, 1)
  const fim = new Date(ano + 1, 0, 1)

  const [pagas, recorrentes, metas] = await Promise.all([
    prisma.transacao.findMany({
      where: { gestorId, recorrente: false, pago: true, dataPagamento: { gte: inicio, lt: fim } },
      select: { tipo: true, valor: true, dataPagamento: true },
    }),
    prisma.transacao.findMany({
      where: { gestorId, recorrente: true, createdAt: { lt: fim }, OR: [{ recorrenteAte: null }, { recorrenteAte: { gte: inicio } }] },
      select: { tipo: true, valor: true, createdAt: true, recorrenteAte: true },
    }),
    prisma.metaMensal.findMany({ where: { gestorId, ano } }),
  ])

  const metaPorMes = new Map<number, number>()
  metas.forEach(m => metaPorMes.set(m.mes, toNum(m.valor)))

  return Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1
    const mInicio = new Date(ano, i, 1)
    const mFim = new Date(ano, i + 1, 1)

    let faturamento = 0
    let despesa = 0

    for (const t of pagas) {
      if (!t.dataPagamento || t.dataPagamento < mInicio || t.dataPagamento >= mFim) continue
      if (RECEITA_TIPOS.includes(t.tipo)) faturamento += toNum(t.valor)
      else if (DESPESA_TIPOS.includes(t.tipo)) despesa += toNum(t.valor)
    }

    // Recorrentes ativas neste mes (comecaram antes do fim e nao terminaram antes do inicio)
    for (const t of recorrentes) {
      const ativa = t.createdAt < mFim && (!t.recorrenteAte || t.recorrenteAte >= mInicio)
      if (!ativa) continue
      if (RECEITA_TIPOS.includes(t.tipo)) faturamento += toNum(t.valor)
      else if (DESPESA_TIPOS.includes(t.tipo)) despesa += toNum(t.valor)
    }

    return { mes: mesesCurto[i], faturamento, despesa, meta: metaPorMes.get(mes) ?? 0 }
  })
}
