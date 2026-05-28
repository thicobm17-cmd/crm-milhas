import { BarChart3, MousePointerClick, Send, Target, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type FunilAnalyticsData = {
  totalClicks: number
  reachedContact: number
  submissions: number
  contactRate: number
  conversionRate: number
  stages: Array<{
    stepIndex: number
    label: string
    views: number
    percentage: number
  }>
  dropoffs: Array<{
    stepIndex: number
    label: string
    count: number
    percentage: number
  }>
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function metricCards(metrics: FunilAnalyticsData) {
  return [
    {
      label: 'Cliques no link',
      value: metrics.totalClicks,
      helper: 'Pessoas que abriram o questionário público.',
      icon: MousePointerClick,
    },
    {
      label: 'Chegaram ao contato',
      value: metrics.reachedContact,
      helper: `${formatPercent(metrics.contactRate)} chegaram à última etapa antes do envio.`,
      icon: Target,
    },
    {
      label: 'Diagnósticos enviados',
      value: metrics.submissions,
      helper: `${formatPercent(metrics.conversionRate)} de conversão do link até o envio.`,
      icon: Send,
    },
  ]
}

export function FunilAnalytics({ metrics }: { metrics: FunilAnalyticsData }) {
  const biggestStage = Math.max(1, ...metrics.stages.map((stage) => stage.views))
  const biggestDropoff = Math.max(1, ...metrics.dropoffs.map((dropoff) => dropoff.count))

  return (
    <Card className="atlas-panel">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} />
              Métricas do funil público
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhamento do quiz: abertura do link, chegada ao final e onde cada pessoa parou.
            </p>
          </div>
          <div className="rounded-md border border-[#d7ad68]/30 bg-white/65 px-3 py-2 text-xs text-muted-foreground">
            Baseado em sessões únicas do navegador.
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {metricCards(metrics).map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-lg border border-[#d7ad68]/25 bg-white/70 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <Icon size={18} className="text-[#8f7040]" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-[#0b3b31]">{item.value}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.helper}</p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-[#d7ad68]/25 bg-white/65 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#0b3b31]">
              <Target size={16} />
              Pessoas por etapa
            </p>
            <div className="mt-3 space-y-2.5">
              {metrics.stages.map((stage) => (
                <div key={`${stage.stepIndex}-${stage.label}`} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="line-clamp-1 text-muted-foreground">{stage.label}</span>
                    <span className="font-semibold text-[#0b3b31]">{stage.views}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#eadfcb]">
                    <div
                      className="h-full rounded-full bg-[#0b3b31]"
                      style={{ width: `${Math.max(4, (stage.views / biggestStage) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d7ad68]/25 bg-white/65 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#0b3b31]">
              <TrendingDown size={16} />
              Onde pararam
            </p>
            <div className="mt-3 space-y-2.5">
              {metrics.dropoffs.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#d7ad68]/35 p-3 text-center text-xs text-muted-foreground">
                  Ainda não há abandono registrado no quiz.
                </div>
              ) : (
                metrics.dropoffs.map((dropoff) => (
                  <div key={`${dropoff.stepIndex}-${dropoff.label}`} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="line-clamp-1 text-muted-foreground">{dropoff.label}</span>
                      <span className="font-semibold text-[#8f7040]">
                        {dropoff.count} ({formatPercent(dropoff.percentage)})
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#eadfcb]">
                      <div
                        className="h-full rounded-full bg-[#c9a86a]"
                        style={{ width: `${Math.max(4, (dropoff.count / biggestDropoff) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
