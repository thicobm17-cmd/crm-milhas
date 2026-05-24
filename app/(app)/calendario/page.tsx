import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { collaborators } from '@/lib/atlas-spec'
import { CalendarDays, Clock, Users } from 'lucide-react'

const days = [
  { day: 'Seg', date: '25', available: ['Thiago', 'Gestor Atlas 1'] },
  { day: 'Ter', date: '26', available: ['Gestor Atlas 2'] },
  { day: 'Qua', date: '27', available: ['Thiago', 'Gestor Atlas 1', 'Gestor Atlas 2'] },
  { day: 'Qui', date: '28', available: ['Thiago'] },
  { day: 'Sex', date: '29', available: ['Gestor Atlas 1', 'Gestor Atlas 2'] },
]

export default function CalendarioPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 7</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#11231f]">Calendario</h1>
          <p className="mt-1 text-sm text-muted-foreground">Disponibilidade de colaboradores e marcacao de calls com uma ou mais pessoas.</p>
        </div>
        <Button className="h-9 bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]">
          <CalendarDays size={16} />
          Nova disponibilidade
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {days.map((day) => (
          <Card key={day.date} className="atlas-panel">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{day.day}</span>
                <span className="text-2xl text-[#0b3b31]">{day.date}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {collaborators.map((collaborator) => {
                const isAvailable = day.available.includes(collaborator.name)
                return (
                  <div key={collaborator.name} className="flex items-center justify-between rounded-md bg-white/65 p-2">
                    <span className="text-sm">{collaborator.name}</span>
                    <Badge className={isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                      {isAvailable ? 'Disponivel' : 'Indisponivel'}
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="atlas-dark-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#f4d59a]"><Clock size={18} /> Horarios disponiveis</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {['09:00', '10:30', '11:00', '14:00', '15:00', '16:30'].map((time) => (
              <Button key={time} variant="outline" className="border-[#d7ad68]/30 bg-transparent text-[#f8e7c4] hover:bg-[#0f2d27]">
                {time}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users size={18} /> Agendamento com multiplos colaboradores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {collaborators.map((collaborator) => (
              <div key={collaborator.name} className="rounded-md border border-[#d7ad68]/25 bg-white/65 p-4">
                <p className="font-medium text-[#0b3b31]">{collaborator.name}</p>
                <p className="text-xs text-muted-foreground">{collaborator.role}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {collaborator.availability.map((time) => (
                    <Badge key={time} variant="outline">{time}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
