import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getClientesComResumo } from '@/lib/queries'
import { atlasPrograms, clientProductTypes } from '@/lib/atlas-spec'
import { formatCurrency } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Plus, Sparkles } from 'lucide-react'

export default async function ClientesPage() {
  const session = await auth()
  const clientes = await getClientesComResumo(session!.user.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 6</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#11231f]">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Carteira de clientes, metas de economia, programas, cartoes e produtos contratados.</p>
        </div>
        <Link href="/clientes/novo">
          <Button className="h-9 bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]">
            <Plus size={16} />
            Novo cliente
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="atlas-dark-panel">
          <CardHeader>
            <CardTitle className="text-[#f4d59a]">Programas de milhas suportados</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {atlasPrograms.map((program) => (
              <Badge key={program} variant="outline" className="border-[#d7ad68]/40 text-[#f8e7c4]">{program}</Badge>
            ))}
          </CardContent>
        </Card>

        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle>Controle de produtos contratados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            {clientProductTypes.map(({ title, icon: Icon }) => (
              <div key={title} className="rounded-md border border-[#d7ad68]/25 bg-white/65 p-3">
                <Icon className="mb-2 text-[#8f7040]" size={18} />
                <p className="font-medium text-[#0b3b31]">{title}</p>
                <p className="text-xs text-muted-foreground">Economia soma no cliente</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {clientes.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clientes.map(c => {
            const progresso = c.metaEconomia > 0 ? Math.min((c.economiaTotal / c.metaEconomia) * 100, 100) : 0
            const initials = c.nome.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase()

            return (
              <Link key={c.id} href={`/clientes/${c.id}`}>
                <Card className="atlas-panel h-full transition-transform hover:-translate-y-0.5">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-12 border border-[#d7ad68]/35">
                          <AvatarFallback className="bg-[#0b3b31] text-[#f4d59a]">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-[#11231f]">{c.nome}</h3>
                          <p className="text-xs text-muted-foreground">{c.telefone || c.email || 'Contato pendente'}</p>
                        </div>
                      </div>
                      <Badge className={c.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-[#0b3b31] p-3 text-[#f8e7c4]">
                        <p className="text-xs text-[#d7ad68]">Economia vitalicia</p>
                        <p className="mt-1 font-semibold">{formatCurrency(c.economiaTotal)}</p>
                      </div>
                      <div className="rounded-md bg-white/65 p-3">
                        <p className="text-xs text-muted-foreground">Produtos emitidos</p>
                        <p className="mt-1 font-semibold text-[#0b3b31]">{c.totalEmissoes}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Meta: economizar valor investido</span>
                        <span className="font-semibold">{progresso.toFixed(0)}%</span>
                      </div>
                      <Progress value={progresso} className="h-2" />
                      <p className="text-xs text-muted-foreground">Meta registrada: {formatCurrency(c.metaEconomia)}</p>
                    </div>

                    {progresso >= 100 && (
                      <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-2 text-xs text-emerald-800">
                        <Sparkles size={14} />
                        Cliente ja bateu a meta da assessoria
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="atlas-panel">
          <CardContent className="py-16 text-center">
            <p className="mb-4 text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
            <Link href="/clientes/novo">
              <Button className="bg-[#0b3b31] text-[#f4d59a]">Adicionar primeiro cliente</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
