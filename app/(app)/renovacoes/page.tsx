import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getClientesComResumo } from '@/lib/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Clock3, FileSearch } from 'lucide-react'

export const dynamic = 'force-dynamic'

function statusRenovacao(acessoFim: Date | null) {
  if (!acessoFim) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fim = new Date(acessoFim)
  fim.setHours(0, 0, 0, 0)
  const dias = Math.round((fim.getTime() - hoje.getTime()) / 86400000)
  if (dias < 0) return { label: `Vencido ha ${Math.abs(dias)} dias`, status: 'Vencido', cor: 'bg-red-100 text-red-800', ordem: 0 }
  if (dias <= 30) return { label: dias === 0 ? 'Vence hoje' : `Vence em ${dias} dias`, status: 'A renovar', cor: 'bg-amber-100 text-amber-800', ordem: 1 }
  return { label: `Vence em ${dias} dias`, status: 'Monitorar', cor: 'bg-stone-100 text-stone-700', ordem: 2 }
}

export default async function RenovacoesPage() {
  const session = await auth()
  const clientes = await getClientesComResumo(session!.user.id)

  const renovacoes = clientes
    .filter(c => c.acessoFim)
    .map(c => ({ cliente: c, info: statusRenovacao(c.acessoFim) }))
    .filter((r): r is { cliente: typeof r.cliente; info: NonNullable<ReturnType<typeof statusRenovacao>> } => r.info !== null)
    .sort((a, b) => a.info.ordem - b.info.ordem || (a.cliente.acessoFim!.getTime() - b.cliente.acessoFim!.getTime()))

  const aRenovar = renovacoes.filter(r => r.info.status === 'A renovar').length
  const vencidos = renovacoes.filter(r => r.info.status === 'Vencido').length
  const economiaContratos = renovacoes.reduce((acc, r) => acc + r.cliente.economiaTotal, 0)

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
            <p className="text-sm text-muted-foreground">A renovar (proximos 30 dias)</p>
            <p className="mt-2 text-3xl font-semibold text-[#0b3b31]">{aRenovar}</p>
          </CardContent>
        </Card>
        <Card className="atlas-panel">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Vencidos</p>
            <p className="mt-2 text-3xl font-semibold text-red-700">{vencidos}</p>
          </CardContent>
        </Card>
        <Card className="atlas-panel">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Economia gerada (carteira)</p>
            <p className="mt-2 text-3xl font-semibold text-[#0b3b31]">{formatCurrency(economiaContratos)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="atlas-panel">
        <CardHeader>
          <CardTitle>Fila de renovacoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {renovacoes.length > 0 ? renovacoes.map(({ cliente, info }) => (
            <div key={cliente.id} className="grid gap-4 rounded-md border border-[#d7ad68]/25 bg-white/65 p-4 lg:grid-cols-[1fr_0.8fr_0.7fr_auto] lg:items-center">
              <div>
                <p className="font-medium text-[#11231f]">{cliente.nome}</p>
                <p className="text-sm text-muted-foreground">{cliente.produtoContratado || 'Produto Atlas'}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock3 size={16} className="text-[#8f7040]" />
                {info.label}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Economia gerada</p>
                <p className="font-semibold text-emerald-700">{formatCurrency(cliente.economiaTotal)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={info.cor}>{info.status}</Badge>
                <Link href={`/clientes/${cliente.id}`}>
                  <Button size="icon-sm" variant="outline" title="Ver historico"><FileSearch size={15} /></Button>
                </Link>
              </div>
            </div>
          )) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum cliente com periodo de acesso definido. Defina o acesso ao confirmar o pagamento no Financeiro.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
