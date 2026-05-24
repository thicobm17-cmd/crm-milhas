import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Define ou atualiza a meta de faturamento de um mes/ano para o gestor logado
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { mes, ano, valor } = await request.json()
  const mesNum = parseInt(mes)
  const anoNum = parseInt(ano)
  const valorNum = parseFloat(valor)

  if (!mesNum || !anoNum || Number.isNaN(valorNum)) {
    return NextResponse.json({ error: 'Mes, ano e valor sao obrigatorios.' }, { status: 400 })
  }

  const meta = await prisma.metaMensal.upsert({
    where: { gestorId_mes_ano: { gestorId: session.user.id, mes: mesNum, ano: anoNum } },
    create: { gestorId: session.user.id, mes: mesNum, ano: anoNum, valor: valorNum },
    update: { valor: valorNum },
  })

  return NextResponse.json({ id: meta.id, valor: valorNum })
}
