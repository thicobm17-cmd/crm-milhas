'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, Check, Copy, Eye, Loader2, Trash2, UserCheck, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { leadColumns } from '@/lib/atlas-spec'
import { formatSaoPauloDateTime } from '@/lib/date-time'

type LeadAnswer = { id: string; bloco: string; pergunta: string; resposta: string }
type Gestor = { id: string; nome: string }
type Lead = {
  id: string
  nome: string
  whatsapp: string
  email: string
  origem: string | null
  indicadoPor: string | null
  gastoMensal: string | null
  statusCall: string
  statusFinal: string
  primeiroContatoRealizado: boolean
  callMarcadaPara: string | null
  followUpInicio: string | null
  primeiroContatoGestor: Gestor | null
  respostas: LeadAnswer[]
}

interface Props {
  leads: Lead[]
  gestores: Gestor[]
  questionarioUrl: string
}

function getColumnStatus(lead: Lead) {
  if (lead.statusFinal === 'FOLLOW_UP') return 'Follow up'
  if (lead.statusFinal === 'CLIENTE_NEGADO') return 'Cliente negado'
  if (lead.statusCall === 'MARCADA') return 'Marcada'
  if (lead.statusCall === 'AGUARDANDO_MARCACAO') return 'Aguardando marcacao'
  return 'Aguardando entrevista'
}

function formatDateTime(value: string | null) {
  if (!value) return 'Sem data'
  return formatSaoPauloDateTime(new Date(value))
}

function leadResumo(lead: Lead): LeadAnswer[] {
  return [
    { id: `${lead.id}-nome`, bloco: 'Identificacao', pergunta: 'Nome completo', resposta: lead.nome },
    { id: `${lead.id}-whatsapp`, bloco: 'Identificacao', pergunta: 'WhatsApp', resposta: lead.whatsapp },
    { id: `${lead.id}-email`, bloco: 'Identificacao', pergunta: 'E-mail', resposta: lead.email },
    { id: `${lead.id}-origem`, bloco: 'Origem', pergunta: 'Como chegou ate a Atlas', resposta: lead.origem || 'Nao informado' },
    { id: `${lead.id}-indicacao`, bloco: 'Origem', pergunta: 'Quem indicou', resposta: lead.indicadoPor || 'Nao informado' },
    { id: `${lead.id}-gasto`, bloco: 'Perfil financeiro', pergunta: 'Gasto/movimentacao mensal', resposta: lead.gastoMensal || 'Nao informado' },
    {
      id: `${lead.id}-contato`,
      bloco: 'Operacao comercial',
      pergunta: 'Primeiro contato',
      resposta: lead.primeiroContatoRealizado ? `Realizado por ${lead.primeiroContatoGestor?.nome || 'gestor nao informado'}` : 'Pendente',
    },
    { id: `${lead.id}-status-call`, bloco: 'Operacao comercial', pergunta: 'Status da call', resposta: getColumnStatus(lead) },
    { id: `${lead.id}-data-call`, bloco: 'Operacao comercial', pergunta: 'Data e hora da call', resposta: formatDateTime(lead.callMarcadaPara) },
    { id: `${lead.id}-follow-up`, bloco: 'Operacao comercial', pergunta: 'Inicio do follow up', resposta: formatDateTime(lead.followUpInicio) },
  ]
}

export function FunilBoard({ leads, gestores, questionarioUrl }: Props) {
  const router = useRouter()
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [dateByLead, setDateByLead] = useState<Record<string, string>>({})
  const [gestorByLead, setGestorByLead] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const grouped = useMemo(() => {
    return leadColumns.map((column) => ({
      ...column,
      leads: leads.filter((lead) => getColumnStatus(lead) === column.status),
    }))
  }, [leads])

  async function patchLead(id: string, action: string, extra: Record<string, string> = {}) {
    setLoadingId(id)
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, ...extra }),
    })
    setLoadingId(null)
    router.refresh()
  }

  async function deleteLead(id: string) {
    setLoadingId(id)
    await fetch(`/api/leads?id=${id}`, { method: 'DELETE' })
    setLoadingId(null)
    router.refresh()
  }

  async function copyLink() {
    await navigator.clipboard.writeText(questionarioUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <>
      <div className="atlas-panel flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8f7040]">Link publico do funil</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">{questionarioUrl}</p>
        </div>
        <Button type="button" onClick={copyLink} className="bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copiado' : 'Copiar link'}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {grouped.map((column) => (
          <Card key={column.status} className="atlas-panel min-h-80">
            <CardHeader className="gap-2 p-4">
              <Badge variant="outline" className={column.color}>{column.status}</Badge>
              <p className="text-xs text-muted-foreground">{column.description}</p>
              <p className="text-xs font-semibold text-[#0b3b31]">{column.leads.length} lead(s)</p>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {column.leads.length === 0 && (
                <div className="rounded-md border border-dashed border-[#d7ad68]/35 p-4 text-center text-xs text-muted-foreground">
                  Nenhum lead neste status.
                </div>
              )}
              {column.leads.map((lead) => {
                const busy = loadingId === lead.id
                return (
                  <div key={lead.id} className="rounded-md border border-[#d7ad68]/25 bg-white/75 p-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#11231f]">{lead.nome}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{lead.whatsapp}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                      {busy && <Loader2 className="animate-spin text-[#8f7040]" size={15} />}
                    </div>
                    <div className="mt-3 space-y-1 text-xs">
                      <p>Gasto: <span className="font-medium">{lead.gastoMensal || 'Nao informado'}</span></p>
                      <p>Contato: <span className="font-medium">{lead.primeiroContatoGestor?.nome || 'Pendente'}</span></p>
                      <p>Call: <span className="font-medium">{formatDateTime(lead.callMarcadaPara)}</span></p>
                    </div>

                    <div className="mt-3 space-y-2">
                      <Button type="button" size="xs" variant="outline" className="w-full justify-start" onClick={() => setSelectedLead(lead)}>
                        <Eye size={13} /> Ver respostas
                      </Button>

                      {column.status === 'Aguardando entrevista' && (
                        <div className="grid gap-2">
                          <Select value={gestorByLead[lead.id] || ''} onValueChange={(value) => setGestorByLead((prev) => ({ ...prev, [lead.id]: value ?? '' }))}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Quem fez contato?" /></SelectTrigger>
                            <SelectContent>
                              {gestores.map((gestor) => <SelectItem key={gestor.id} value={gestor.id}>{gestor.nome}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button type="button" size="xs" onClick={() => patchLead(lead.id, 'primeiro_contato', { gestorId: gestorByLead[lead.id] || '' })}>
                            <UserCheck size={13} /> Primeiro contato feito
                          </Button>
                        </div>
                      )}

                      {(column.status === 'Aguardando marcacao' || column.status === 'Marcada') && (
                        <div className="grid gap-2">
                          <Input
                            type="datetime-local"
                            value={dateByLead[lead.id] || ''}
                            onChange={(event) => setDateByLead((prev) => ({ ...prev, [lead.id]: event.target.value }))}
                          />
                          <Button type="button" size="xs" onClick={() => patchLead(lead.id, 'agendar_call', { dataHora: dateByLead[lead.id] || '' })}>
                            <CalendarPlus size={13} /> Agendar call
                          </Button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" size="xs" variant="outline" onClick={() => patchLead(lead.id, 'follow_up')}>
                          Follow up
                        </Button>
                        <Button type="button" size="xs" variant="destructive" onClick={() => patchLead(lead.id, 'cliente_negado')}>
                          <XCircle size={13} /> Negado
                        </Button>
                      </div>
                      <Button type="button" size="xs" variant="ghost" className="w-full text-red-700 hover:text-red-700" onClick={() => deleteLead(lead.id)}>
                        <Trash2 size={13} /> Apagar lead
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedLead?.nome}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {selectedLead && [...leadResumo(selectedLead), ...selectedLead.respostas].map((answer) => (
              <div key={answer.id} className="rounded-md border border-[#d7ad68]/25 bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f7040]">{answer.bloco}</p>
                <Label className="mt-2 block">{answer.pergunta}</Label>
                <p className="mt-1 text-sm text-muted-foreground">{answer.resposta || 'Sem resposta'}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
