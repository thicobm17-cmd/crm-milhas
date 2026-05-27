'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ClienteResumo {
  nome: string
  economia_total: number
  meta_economia: number
}

interface Props {
  clientes: ClienteResumo[]
}

const COLORS = ['#0b3b31', '#d7ad68', '#2f6f62', '#8f7040', '#672b2b']

export function DashboardCharts({ clientes }: Props) {
  const top5 = [...clientes]
    .sort((a, b) => Number(b.economia_total) - Number(a.economia_total))
    .slice(0, 5)
    .map(c => ({
      nome: c.nome.split(' ')[0],
      economia: Number(c.economia_total),
      meta: Number(c.meta_economia),
    }))

  const formatTooltipValue = (value: number) => formatCurrency(value)

  return (
    <>
      {top5.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={top5} margin={{ top: 5, right: 10, left: 2, bottom: 0 }}>
            <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [formatTooltipValue(Number(value)), 'Economia']}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="economia" radius={[4, 4, 0, 0]}>
              {top5.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[220px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Nenhum dado ainda. Comece registrando produtos de viagem.</p>
        </div>
      )}
    </>
  )
}
