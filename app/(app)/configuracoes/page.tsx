import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { atlasPrograms } from '@/lib/atlas-spec'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PerfilForm } from '@/components/configuracoes/PerfilForm'
import { ShieldCheck, UserCog, UserPlus } from 'lucide-react'

export default async function ConfiguracoesPage() {
  const session = await auth()
  const gestor = await prisma.gestor.findUnique({
    where: { id: session!.user.id },
    select: { id: true, nome: true, email: true, telefone: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 10</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#11231f]">Configuracoes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perfil do CEO, cargos, fila de acesso e parametros do ecossistema Atlas.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCog size={18} /> Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <PerfilForm gestor={gestor} />
          </CardContent>
        </Card>

        <Card className="atlas-dark-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#f4d59a]"><ShieldCheck size={18} /> Governanca de acesso</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-4">
              <p className="font-medium text-[#f8e7c4]">CEO</p>
              <p className="mt-1 text-sm text-[#e8d3ab]/70">Autoriza cadastros e define cargos.</p>
            </div>
            <div className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-4">
              <p className="font-medium text-[#f8e7c4]">Gestor de Milhas</p>
              <p className="mt-1 text-sm text-[#e8d3ab]/70">Opera clientes, produtos e viagens.</p>
            </div>
            <div className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-4 md:col-span-2">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-[#d7ad68]" />
                <p className="font-medium text-[#f8e7c4]">Fila de solicitacoes</p>
              </div>
              <p className="mt-1 text-sm text-[#e8d3ab]/70">Novas contas entram para aprovacao do CEO antes da operacao multiempresa.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="atlas-panel">
        <CardHeader>
          <CardTitle>Catalogo Atlas de programas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {atlasPrograms.map((program) => (
            <Badge key={program} variant="outline" className="border-[#d7ad68]/45 bg-white/55 text-[#0b3b31]">{program}</Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
