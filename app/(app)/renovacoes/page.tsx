import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Clock3, FileSearch, RefreshCw } from 'lucide-react'

const renewals = [
  { client: 'Familia Europa 2026', plan: 'Gestao de Viagens Completa', expires: 'Vence em 8 dias', economy: 18400, status: 'A renovar' },
  { client: 'Empresario Premium', plan: 'Consultoria + Acompanhamento', expires: 'Vencido ha 2 dias', economy: 5200, status: 'Vencido' },
  { client: 'Casal Lua de Mel', plan: 'Gestao de Viagens Completa', expires: 'Vence em 21 dias', economy: 12750, status: 'Monitorar' },
]

export default function RenovacoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 11</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#11231f]">Renovacoes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Clientes com plano perto de vencer, historico do periodo e opcao de renovacao.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="atlas-panel">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">A renovar</p>
            <p className="mt-2 text-3xl font-semibold text-[#0b3b31]">2</p>
          </CardContent>
        </Card>
        <Card className="atlas-panel">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Vencidos</p>
            <p className="mt-2 text-3xl font-semibold text-red-700">1</p>
          </CardContent>
        </Card>
        <Card className="atlas-panel">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Economia em contratos</p>
            <p className="mt-2 text-3xl font-semibold text-[#0b3b31]">{formatCurrency(36350)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="atlas-panel">
        <CardHeader>
          <CardTitle>Fila de renovacoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {renewals.map((renewal) => (
            <div key={renewal.client} className="grid gap-4 rounded-md border border-[#d7ad68]/25 bg-white/65 p-4 lg:grid-cols-[1fr_0.8fr_0.7fr_auto] lg:items-center">
              <div>
                <p className="font-medium text-[#11231f]">{renewal.client}</p>
                <p className="text-sm text-muted-foreground">{renewal.plan}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock3 size={16} className="text-[#8f7040]" />
                {renewal.expires}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Economia no periodo</p>
                <p className="font-semibold text-emerald-700">{formatCurrency(renewal.economy)}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={renewal.status === 'Vencido' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>{renewal.status}</Badge>
                <Button size="icon-sm" variant="outline" title="Ver historico"><FileSearch size={15} /></Button>
                <Button size="icon-sm" className="bg-[#0b3b31] text-[#f4d59a]" title="Renovar"><RefreshCw size={15} /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
