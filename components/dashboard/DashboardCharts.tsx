'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899']

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
    <Card className="border-0 shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-base">Top Clientes — Economia Gerada</CardTitle>
      </CardHeader>
      <CardContent>
        {top5.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top5} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-slate-400 text-sm">Nenhum dado ainda. Comece registrando emissões!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
