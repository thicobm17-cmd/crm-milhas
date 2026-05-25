'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface PontoMensal {
  mes: string
  faturamento: number
  despesa: number
  meta: number
}

interface Props {
  dados: PontoMensal[]
  ano: number
}

export function FinanceLineChart({ dados, ano }: Props) {
  const temDados = dados.some(d => d.faturamento > 0 || d.despesa > 0 || d.meta > 0)

  if (!temDados) {
    return (
      <div className="flex h-[300px] items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">
          Sem movimento financeiro em {ano}. Registre receitas, despesas e metas para ver o grafico.
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={dados} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7dcc4" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number, name: string) => [formatCurrency(Number(value)), name]} contentStyle={{ fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="despesa" name="Despesa" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="meta" name="Meta de faturamento" stroke="#111111" strokeWidth={2} strokeDasharray="6 4" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
