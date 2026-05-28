import { headers } from 'next/headers'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FunilAnalytics, type FunilAnalyticsData } from '@/components/funil/FunilAnalytics'
import { FunilBoard } from '@/components/funil/FunilBoard'
import { leadColumns, publicQuizQuestions, qualificationRules } from '@/lib/atlas-spec'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function followUpLimitDate() {
  const date = new Date()
  date.setDate(date.getDate() - 15)
  return date
}

const quizStages = [
  { stepIndex: 0, label: 'Abertura' },
  ...publicQuizQuestions.map((question, index) => ({
    stepIndex: index + 1,
    label: question.pergunta,
  })),
  { stepIndex: publicQuizQuestions.length + 1, label: 'Captura de contato' },
  { stepIndex: publicQuizQuestions.length + 2, label: 'Confirmação' },
]

function uniqueSessions<T>(items: T[], predicate: (item: T) => boolean, getSessionId: (item: T) => string) {
  return new Set(items.filter(predicate).map(getSessionId))
}

function buildFunilMetrics(events: Array<{ sessionId: string; eventType: string; stepIndex: number | null; stepLabel: string | null }>): FunilAnalyticsData {
  const opened = uniqueSessions(events, (event) => event.eventType === 'ABRIU_LINK', (event) => event.sessionId)
  const submitted = uniqueSessions(events, (event) => event.eventType === 'ENVIOU_RESPOSTAS', (event) => event.sessionId)
  const reachedContact = uniqueSessions(
    events,
    (event) => ['CHEGOU_CAPTURA', 'ENVIOU_RESPOSTAS', 'CONFIRMOU'].includes(event.eventType),
    (event) => event.sessionId,
  )
  const totalClicks = opened.size
  const sessions = new Map<string, { lastStep: number; lastLabel: string; submitted: boolean }>()

  events.forEach((event) => {
    const current = sessions.get(event.sessionId) || { lastStep: 0, lastLabel: 'Abertura', submitted: false }
    if (event.eventType === 'ENVIOU_RESPOSTAS') current.submitted = true

    if (event.stepIndex !== null && ['ABRIU_LINK', 'VIU_ETAPA', 'CHEGOU_CAPTURA', 'SAIU', 'CONFIRMOU'].includes(event.eventType)) {
      current.lastStep = event.stepIndex
      current.lastLabel = event.stepLabel || quizStages.find((stage) => stage.stepIndex === event.stepIndex)?.label || 'Etapa não identificada'
    }

    sessions.set(event.sessionId, current)
  })

  const stageViews = quizStages.map((stage) => {
    const views = uniqueSessions(
      events,
      (event) => event.stepIndex === stage.stepIndex && ['ABRIU_LINK', 'VIU_ETAPA', 'CHEGOU_CAPTURA', 'CONFIRMOU'].includes(event.eventType),
      (event) => event.sessionId,
    ).size

    return {
      ...stage,
      views,
      percentage: totalClicks > 0 ? (views / totalClicks) * 100 : 0,
    }
  })

  const dropoffMap = new Map<number, { label: string; count: number }>()
  sessions.forEach((session) => {
    if (session.submitted) return
    const item = dropoffMap.get(session.lastStep) || { label: session.lastLabel, count: 0 }
    item.count += 1
    dropoffMap.set(session.lastStep, item)
  })

  return {
    totalClicks,
    reachedContact: reachedContact.size,
    submissions: submitted.size,
    contactRate: totalClicks > 0 ? (reachedContact.size / totalClicks) * 100 : 0,
    conversionRate: totalClicks > 0 ? (submitted.size / totalClicks) * 100 : 0,
    stages: stageViews,
    dropoffs: Array.from(dropoffMap.entries())
      .map(([stepIndex, item]) => ({
        stepIndex,
        label: item.label,
        count: item.count,
        percentage: totalClicks > 0 ? (item.count / totalClicks) * 100 : 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => a.stepIndex - b.stepIndex),
  }
}

export default async function FunilPage() {
  await prisma.lead.updateMany({
    where: {
      statusFinal: 'FOLLOW_UP',
      followUpInicio: { lte: followUpLimitDate() },
    },
    data: { statusFinal: 'CLIENTE_NEGADO' },
  })

  const [leadsRaw, gestores, questionarioEventos] = await Promise.all([
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
    prisma.questionarioEvento.findMany({
      select: {
        sessionId: true,
        eventType: true,
        stepIndex: true,
        stepLabel: true,
      },
      orderBy: { createdAt: 'asc' },
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
  const funilMetrics = buildFunilMetrics(questionarioEventos)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 1</p>
          <h1 className="mt-1.5 text-2xl font-semibold text-[#11231f]">Funil de vendas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Link público, leads reais, primeiro contato, call marcada, follow up de 15 dias e limpeza de leads.
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
            <CardTitle>Questionário público único</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5 md:grid-cols-2">
            {publicQuizQuestions.map((question, index) => (
              <div key={question.pergunta} className="rounded-md border border-[#d7ad68]/25 bg-white/55 p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0b3b31] text-xs font-semibold text-[#f4d59a]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-[#0b3b31]">{question.pergunta}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{question.opcoes.join(' · ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="atlas-dark-panel">
          <CardHeader>
            <CardTitle className="text-[#f4d59a]">Lógica de qualificação</CardTitle>
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

      <FunilAnalytics metrics={funilMetrics} />

      <FunilBoard leads={leads} gestores={gestores} questionarioUrl={questionarioUrl} />
    </div>
  )
}
