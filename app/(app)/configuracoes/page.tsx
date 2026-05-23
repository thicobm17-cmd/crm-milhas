import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PerfilForm } from '@/components/configuracoes/PerfilForm'

export default async function ConfiguracoesPage() {
  const session = await auth()
  const gestor = await prisma.gestor.findUnique({
    where: { id: session!.user.id },
    select: { id: true, nome: true, email: true, telefone: true },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1">Dados do seu perfil de gestor</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Perfil</CardTitle></CardHeader>
        <CardContent>
          <PerfilForm gestor={gestor} />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Programas Suportados</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { nome: 'LATAM Pass', cor: '#e3373c' },
              { nome: 'Smiles (GOL)', cor: '#f97316' },
              { nome: 'TudoAzul', cor: '#2563eb' },
              { nome: 'Livelo', cor: '#8b5cf6' },
              { nome: 'Outro', cor: '#6b7280' },
            ].map(p => (
              <div key={p.nome} className="flex items-center gap-3 py-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.cor }} />
                <span className="text-sm">{p.nome}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
