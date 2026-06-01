import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Clock, Users } from 'lucide-react'
import { formatSaoPauloDate, formatSaoPauloTime, formatSaoPauloWeekdayShort } from '@/lib/date-time'

export const dynamic = 'force-dynamic'

export default async function CalendarioPage() {
  const [equipe, callsAgendadas] = await Promise.all([
    prisma.gestor.findMany({
      where: { autorizado: true },
      select: { id: true, nome: true, cargo: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.lead.findMany({
      where: { statusCall: 'MARCADA', callMarcadaPara: { gte: new Date() } },
      select: { id: true, nome: true, callMarcadaPara: true, whatsapp: true },
      orderBy: { callMarcadaPara: 'asc' },
      take: 20,
    }),
  ])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 7</p>
          <h1 className="mt-1.5 text-2xl font-semibold text-[#11231f]">Calendario</h1>
          <p className="mt-1 text-sm text-muted-foreground">Equipe disponivel e calls de vendas agendadas (uma ou mais pessoas por call).</p>
        </div>
        <Link href="/funil">
          <Button className="h-9 bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]">
            <CalendarDays size={16} />
            Marcar call no funil
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock size={18} /> Proximas calls agendadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {callsAgendadas.length > 0 ? callsAgendadas.map((call) => {
              const data = call.callMarcadaPara ? new Date(call.callMarcadaPara) : null
              return (
                <div key={call.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#d7ad68]/25 bg-white/65 p-2.5">
                  <div>
                    <p className="font-medium text-[#11231f]">{call.nome}</p>
                    <p className="text-xs text-muted-foreground">{call.whatsapp}</p>
                  </div>
                  {data && (
                    <Badge className="bg-emerald-100 text-emerald-800">
                      {formatSaoPauloWeekdayShort(data)} {formatSaoPauloDate(data)} - {formatSaoPauloTime(data)}
                    </Badge>
                  )}
                </div>
              )
            }) : (
              <div className="rounded-md border border-dashed border-[#d7ad68]/35 p-6 text-center text-sm text-muted-foreground">
                Nenhuma call agendada. Marque calls na aba Funil de vendas.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="atlas-dark-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#f4d59a]"><Users size={18} /> Equipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {equipe.map((membro) => (
              <div key={membro.id} className="flex items-center justify-between rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-2.5">
                <span className="text-sm text-[#f8e7c4]">{membro.nome}</span>
                <Badge variant="outline" className="border-[#d7ad68]/40 text-[#e8d3ab]">{membro.cargo === 'CEO' ? 'CEO' : 'Gestor'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
