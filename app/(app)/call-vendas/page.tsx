import { CallVendasForm } from '@/components/call/CallVendasForm'
import { Card, CardContent } from '@/components/ui/card'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const callSteps = [
  'Selecionar origem: Link do Funil ou Indicacao',
  'Puxar respostas do lead ou preencher questionario manual',
  'Usar apresentacao correta do Canva para o produto',
  'Definir desfecho: cliente fechado ou follow up de 15 dias',
]

export default async function CallVendasPage() {
  const [leadsRaw, gestores] = await Promise.all([
    prisma.lead.findMany({
      where: {
        statusFinal: { not: 'CLIENTE' },
      },
      include: {
        respostas: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: [
        { callMarcadaPara: 'asc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.gestor.findMany({
      where: { autorizado: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  const leads = leadsRaw.map((lead) => ({
    id: lead.id,
    nome: lead.nome,
    whatsapp: lead.whatsapp,
    email: lead.email,
    gastoMensal: lead.gastoMensal,
    callMarcadaPara: lead.callMarcadaPara?.toISOString() || null,
    respostas: lead.respostas.map((answer) => ({
      id: answer.id,
      bloco: answer.bloco,
      pergunta: answer.pergunta,
      resposta: answer.resposta,
    })),
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 2</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#11231f]">Call de vendas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Roteiro operacional da call: origem, respostas, produto escolhido, pagamento e conversao automatica.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {callSteps.map((step, index) => (
          <Card key={step} className="atlas-panel transition hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <div className="mb-3 flex size-8 items-center justify-center rounded-full bg-[#0b3b31] text-sm font-semibold text-[#f4d59a]">{index + 1}</div>
              <p className="text-sm font-medium">{step}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <CallVendasForm leads={leads} gestores={gestores} />
    </div>
  )
}
