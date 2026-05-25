import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { atlasPrograms } from '@/lib/atlas-spec'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PerfilForm } from '@/components/configuracoes/PerfilForm'
import { GestoresFila } from '@/components/configuracoes/GestoresFila'
import { CatalogoProdutos } from '@/components/configuracoes/CatalogoProdutos'
import { BackupPanel } from '@/components/configuracoes/BackupPanel'
import { ShieldCheck, Tag, UserCog } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const session = await auth()
  const meId = session!.user.id

  const [gestor, todos, backupsRaw] = await Promise.all([
    prisma.gestor.findUnique({
      where: { id: meId },
      select: { id: true, nome: true, email: true, telefone: true, cargo: true },
    }),
    prisma.gestor.findMany({
      select: { id: true, nome: true, email: true, cargo: true, autorizado: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.backupSnapshot.findMany({
      select: { id: true, reason: true, status: true, recordCounts: true, sizeBytes: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const souCEO = gestor?.cargo === 'CEO'
  const pendentes = todos.filter(g => !g.autorizado)
  const equipe = todos.filter(g => g.autorizado)
  const backups = backupsRaw.map((backup) => ({
    ...backup,
    createdAt: backup.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 10</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#11231f]">Configuracoes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perfil, cargos, fila de acesso e parametros do ecossistema Atlas.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCog size={18} /> Meu perfil
              {gestor?.cargo && <Badge className="bg-[#0b3b31] text-[#f4d59a]">{gestor.cargo === 'CEO' ? 'CEO' : 'Gestor de Milhas'}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerfilForm gestor={gestor ? { id: gestor.id, nome: gestor.nome, email: gestor.email, telefone: gestor.telefone } : null} />
          </CardContent>
        </Card>

        <Card className="atlas-dark-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#f4d59a]"><ShieldCheck size={18} /> Governanca de acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <GestoresFila pendentes={pendentes} equipe={equipe} meId={meId} souCEO={souCEO} />
          </CardContent>
        </Card>
      </div>

      <Card className="atlas-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tag size={18} /> Produtos e precos</CardTitle>
          <p className="text-sm text-muted-foreground">Defina os precos dos seus produtos. Ao lancar um produto no cliente, o valor entra como receita no Financeiro.</p>
        </CardHeader>
        <CardContent>
          <CatalogoProdutos />
        </CardContent>
      </Card>

      <Card className="atlas-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck size={18} /> Backups automaticos</CardTitle>
          <p className="text-sm text-muted-foreground">Snapshots completos do banco para baixar e guardar fora do Railway.</p>
        </CardHeader>
        <CardContent>
          <BackupPanel backups={backups} souCEO={souCEO} />
        </CardContent>
      </Card>

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
