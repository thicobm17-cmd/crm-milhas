import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Clock, Plane, Users } from 'lucide-react'
import { formatSaoPauloDate, formatSaoPauloTime, formatSaoPauloWeekdayShort } from '@/lib/date-time'

export const dynamic = 'force-dynamic'

type CalendarEvent = {
  id: string
  tipo: string
  titulo: string
  data: Date
  detalhe: string
}

export default async function CalendarioPage() {
  const hoje = new Date()
  const [equipe, callsAgendadas, viagens, voos, hospedagens, transfers, pendentes] = await Promise.all([
    prisma.gestor.findMany({
      where: { autorizado: true },
      select: { id: true, nome: true, cargo: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.lead.findMany({
      where: { statusCall: 'MARCADA', callMarcadaPara: { gte: hoje } },
      select: { id: true, nome: true, callMarcadaPara: true, whatsapp: true },
      orderBy: { callMarcadaPara: 'asc' },
      take: 20,
    }),
    prisma.viagemAgencia.findMany({
      where: { OR: [{ dataIda: { gte: hoje } }, { dataVolta: { gte: hoje } }] },
      orderBy: { dataIda: 'asc' },
      take: 20,
    }),
    prisma.vooOperacional.findMany({
      where: { dataHoraPartida: { gte: hoje } },
      orderBy: { dataHoraPartida: 'asc' },
      take: 20,
    }),
    prisma.hospedagemOperacional.findMany({
      where: { OR: [{ checkin: { gte: hoje } }, { checkout: { gte: hoje } }] },
      orderBy: { checkin: 'asc' },
      take: 20,
    }),
    prisma.transferOperacional.findMany({
      where: { data: { gte: hoje } },
      orderBy: { data: 'asc' },
      take: 20,
    }),
    prisma.transacao.findMany({
      where: { pago: false, dataVencimento: { gte: hoje } },
      orderBy: { dataVencimento: 'asc' },
      take: 20,
    }),
  ])

  const eventos: CalendarEvent[] = [
    ...callsAgendadas.flatMap((call) => call.callMarcadaPara ? [{
      id: `call-${call.id}`,
      tipo: 'Call',
      titulo: call.nome,
      data: call.callMarcadaPara,
      detalhe: call.whatsapp,
    }] : []),
    ...viagens.flatMap((viagem) => [
      ...(viagem.dataIda ? [{ id: `ida-${viagem.id}`, tipo: 'Embarque', titulo: viagem.destino, data: viagem.dataIda, detalhe: viagem.status }] : []),
      ...(viagem.dataVolta ? [{ id: `volta-${viagem.id}`, tipo: 'Retorno', titulo: viagem.destino, data: viagem.dataVolta, detalhe: viagem.status }] : []),
    ]),
    ...voos.flatMap((voo) => voo.dataHoraPartida ? [{
      id: `voo-${voo.id}`,
      tipo: voo.statusCheckin === 'DISPONIVEL' ? 'Check-in disponível' : 'Voo',
      titulo: `${voo.origem} → ${voo.destino}`,
      data: voo.dataHoraPartida,
      detalhe: `${voo.companhia}${voo.localizador ? ` - ${voo.localizador}` : ''}`,
    }] : []),
    ...hospedagens.flatMap((hotel) => [
      ...(hotel.checkin ? [{ id: `checkin-${hotel.id}`, tipo: 'Check-in hotel', titulo: hotel.hotel, data: hotel.checkin, detalhe: hotel.status }] : []),
      ...(hotel.checkout ? [{ id: `checkout-${hotel.id}`, tipo: 'Check-out hotel', titulo: hotel.hotel, data: hotel.checkout, detalhe: hotel.status }] : []),
    ]),
    ...transfers.flatMap((transfer) => transfer.data ? [{
      id: `transfer-${transfer.id}`,
      tipo: 'Transfer',
      titulo: transfer.fornecedor || 'Transfer',
      data: transfer.data,
      detalhe: transfer.motorista || transfer.observacoes || 'Sem detalhes',
    }] : []),
    ...pendentes.flatMap((transacao) => transacao.dataVencimento ? [{
      id: `pagamento-${transacao.id}`,
      tipo: 'Pagamento pendente',
      titulo: transacao.descricao,
      data: transacao.dataVencimento,
      detalhe: `R$ ${Number(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    }] : []),
  ].sort((a, b) => a.data.getTime() - b.data.getTime()).slice(0, 35)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 7</p>
          <h1 className="mt-1.5 text-2xl font-semibold text-[#11231f]">Calendario</h1>
          <p className="mt-1 text-sm text-muted-foreground">Calendário operacional com calls, embarques, retornos, check-ins, transfers e pagamentos pendentes.</p>
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
            <CardTitle className="flex items-center gap-2"><Clock size={18} /> Próximos eventos operacionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {eventos.length > 0 ? eventos.map((evento) => {
              const data = evento.data
              return (
                <div key={evento.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#d7ad68]/25 bg-white/65 p-2.5">
                  <div>
                    <p className="font-medium text-[#11231f]">{evento.titulo}</p>
                    <p className="text-xs text-muted-foreground">{evento.tipo} - {evento.detalhe}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    {formatSaoPauloWeekdayShort(data)} {formatSaoPauloDate(data)} - {formatSaoPauloTime(data)}
                  </Badge>
                </div>
              )
            }) : (
              <div className="rounded-md border border-dashed border-[#d7ad68]/35 p-6 text-center text-sm text-muted-foreground">
                Nenhum evento operacional agendado.
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

      <Card className="atlas-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plane size={18} /> Viagens da agência</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {viagens.map((viagem) => (
            <div key={viagem.id} className="rounded-md border border-[#d7ad68]/25 bg-white/65 p-3">
              <p className="font-medium">{viagem.destino}</p>
              <p className="mt-1 text-xs text-muted-foreground">{viagem.status}</p>
              <p className="mt-2 text-sm">{viagem.dataIda ? formatSaoPauloDate(viagem.dataIda) : 'Ida a definir'} → {viagem.dataVolta ? formatSaoPauloDate(viagem.dataVolta) : 'Volta a definir'}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
