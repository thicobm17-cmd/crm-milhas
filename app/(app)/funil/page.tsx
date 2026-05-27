import { headers } from 'next/headers'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FunilBoard } from '@/components/funil/FunilBoard'
import { leadColumns, qualificationRules, questionnaireBlocks } from '@/lib/atlas-spec'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function followUpLimitDate() {
  const date = new Date()
  date.setDate(date.getDate() - 15)
  return date
}

export default async function FunilPage() {
  await prisma.lead.updateMany({
    where: {
      statusFinal: 'FOLLOW_UP',
      followUpInicio: { lte: followUpLimitDate() },
    },
    data: { statusFinal: 'CLIENTE_NEGADO' },
  })

  const [leadsRaw, gestores] = await Promise.all([
    prisma.lead.findMany({
      where: { statusFinal: { not: 'CLIENTE' } },
      include: {
        respostas: { orderBy: { createdAt: 'asc' } },
        primeiroContatoGestor: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.gestor.findMany({
      where: { autorizado: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || ''
  const protocol = headerList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const questionarioUrl = host ? `${protocol}://${host}/questionario` : '/questionario'

  const leads = leadsRaw.map((lead) => ({
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    callMarcadaPara: lead.callMarcadaPara?.toISOString() || null,
    followUpInicio: lead.followUpInicio?.toISOString() || null,
    respostas: lead.respostas.map((answer) => ({
      id: answer.id,
      bloco: answer.bloco,
      pergunta: answer.pergunta,
      resposta: answer.resposta,
    })),
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 1</p>
          <h1 className="mt-1.5 text-2xl font-semibold text-[#11231f]">Funil de vendas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Link publico, leads reais, primeiro contato, call marcada, follow up de 15 dias e limpeza de leads.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {leadColumns.map((column) => (
            <Badge key={column.status} variant="outline" className={column.color}>{column.status}</Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle>Questionario publico unico</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5 md:grid-cols-2">
            {questionnaireBlocks.map((block) => (
              <div key={block.title} className="rounded-md border border-[#d7ad68]/25 bg-white/55 p-3">
                <p className="font-medium text-[#0b3b31]">{block.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {block.questions.map((question) => (
                    <li key={question}>- {question}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="atlas-dark-panel">
          <CardHeader>
            <CardTitle className="text-[#f4d59a]">Logica de qualificacao</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-2">
            {qualificationRules.map(([rule, result]) => (
              <div key={rule} className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/65 p-2.5">
                <p className="text-sm text-[#f8e7c4]">{rule}</p>
                <p className="mt-1 text-sm font-semibold text-[#d7ad68]">{result}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <FunilBoard leads={leads} gestores={gestores} questionarioUrl={questionarioUrl} />
    </div>
  )
}
