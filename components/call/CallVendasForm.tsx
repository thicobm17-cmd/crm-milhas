'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, ExternalLink, Loader2, MessageCircle, Presentation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { questionnaireBlocks } from '@/lib/atlas-spec'
import { formatSaoPauloDateTime } from '@/lib/date-time'

type Answer = { id: string; bloco: string; pergunta: string; resposta: string }
type ProdutoCatalogo = { id: string; nome: string; preco: number }
type Lead = {
  id: string
  nome: string
  whatsapp: string
  email: string
  gastoMensal: string | null
  callMarcadaPara: string | null
  respostas: Answer[]
}
type Gestor = { id: string; nome: string }

interface Props {
  leads: Lead[]
  gestores: Gestor[]
  produtos: ProdutoCatalogo[]
}

const spendOptions = [
  'Ate R$3.000/mes',
  'R$3.000 a R$8.000/mes',
  'R$8.000 a R$20.000/mes',
  'Acima de R$20.000/mes',
]

const canvaLinks = [
  { product: 'Gestao de Viagens Completa - Com indicacao', url: 'https://www.canva.com/' },
  { product: 'Gestao de Viagens Completa - Sem indicacao', url: 'https://www.canva.com/' },
  { product: 'Consultoria 1h', url: 'https://www.canva.com/' },
  { product: 'Consultoria + Acompanhamento', url: 'https://www.canva.com/' },
]

function formatDateTime(value: string | null) {
  if (!value) return 'Sem horario marcado'
  return formatSaoPauloDateTime(new Date(value))
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CallVendasForm({ leads, gestores, produtos }: Props) {
  const router = useRouter()
  const produtoInicial = produtos[0]
  const [loading, setLoading] = useState(false)
  const [origin, setOrigin] = useState('FUNIL')
  const [leadId, setLeadId] = useState(leads[0]?.id || '')
  const [manualLead, setManualLead] = useState({ nome: '', whatsapp: '', email: '', indicadoPor: '', gastoMensal: '' })
  const [manualAnswers, setManualAnswers] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    dataHora: '',
    produto: produtoInicial?.nome || '',
    valor: produtoInicial?.preco ? String(produtoInicial.preco) : '',
    valorModo: produtoInicial?.preco ? 'catalogo' : 'outro',
    periodoMeses: '1',
    fechou: 'true',
    pago: 'false',
    observacoes: '',
  })
  const [participantes, setParticipantes] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('')

  const selectedLead = useMemo(() => leads.find((lead) => lead.id === leadId) || null, [leads, leadId])
  const selectedProduct = useMemo(() => produtos.find((produto) => produto.nome === form.produto) || null, [produtos, form.produto])
  const flatQuestions = useMemo(
    () => questionnaireBlocks.flatMap((block) => block.questions.map((question) => ({ bloco: block.title, pergunta: question }))),
    []
  )

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateManual(field: string, value: string) {
    setManualLead((prev) => ({ ...prev, [field]: value }))
  }

  function selecionarProduto(nome: string) {
    const produto = produtos.find((item) => item.nome === nome)
    setForm((prev) => ({
      ...prev,
      produto: nome,
      valorModo: produto?.preco ? 'catalogo' : 'outro',
      valor: produto?.preco ? String(produto.preco) : '',
    }))
  }

  function selecionarValor(modo: string) {
    setForm((prev) => ({
      ...prev,
      valorModo: modo,
      valor: modo === 'catalogo' && selectedProduct?.preco ? String(selectedProduct.preco) : '',
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const respostas = flatQuestions.map((item) => ({
      ...item,
      resposta: manualAnswers[item.pergunta] || '',
    }))

    const response = await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origemCliente: origin,
        leadId: origin === 'FUNIL' ? leadId : undefined,
        manualLead: origin === 'INDICACAO' ? manualLead : undefined,
        respostas,
        participanteIds: Object.entries(participantes).filter(([, checked]) => checked).map(([id]) => id),
        ...form,
      }),
    })

    setLoading(false)
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setMessage(data?.error || 'Nao foi possivel salvar a call.')
      return
    }

    setMessage(form.fechou === 'true' ? 'Cliente criado e financeiro atualizado.' : 'Lead enviado para follow up por 15 dias.')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
      <div className="space-y-4">
        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle>Origem do cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={origin} onValueChange={(value) => setOrigin(value ?? 'FUNIL')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FUNIL">Link do Funil</SelectItem>
                  <SelectItem value="INDICACAO">Indicacao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {origin === 'FUNIL' ? (
              <div className="space-y-2">
                <Label>Lead com call marcada</Label>
                <Select value={leadId} onValueChange={(value) => setLeadId(value ?? '')}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => <SelectItem key={lead.id} value={lead.id}>{lead.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Indicado por</Label>
                <Input value={manualLead.indicadoPor} onChange={(event) => updateManual('indicadoPor', event.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>

        {origin === 'FUNIL' && selectedLead && (
          <Card className="atlas-panel">
            <CardHeader>
              <CardTitle>{selectedLead.nome}</CardTitle>
              <p className="text-sm text-muted-foreground">{selectedLead.whatsapp} - {formatDateTime(selectedLead.callMarcadaPara)}</p>
            </CardHeader>
            <CardContent className="grid gap-2.5 md:grid-cols-2">
              <div className="rounded-md border border-[#d7ad68]/25 bg-white/70 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f7040]">Contato</p>
                <p className="mt-2 text-sm font-medium">E-mail</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedLead.email || 'Sem email'}</p>
              </div>
              <div className="rounded-md border border-[#d7ad68]/25 bg-white/70 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f7040]">Perfil financeiro</p>
                <p className="mt-2 text-sm font-medium">Gasto/movimentacao mensal</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedLead.gastoMensal || 'Nao informado'}</p>
              </div>
              {selectedLead.respostas.length === 0 && <p className="text-sm text-muted-foreground">Esse lead ainda nao tem respostas salvas.</p>}
              {selectedLead.respostas.map((answer) => (
                <div key={answer.id} className="rounded-md border border-[#d7ad68]/25 bg-white/70 p-2.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f7040]">{answer.bloco}</p>
                  <p className="mt-2 text-sm font-medium">{answer.pergunta}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{answer.resposta || 'Sem resposta'}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {origin === 'INDICACAO' && (
          <Card className="atlas-panel">
            <CardHeader>
              <CardTitle>Questionario manual durante a call</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={manualLead.nome} onChange={(event) => updateManual('nome', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={manualLead.whatsapp} onChange={(event) => updateManual('whatsapp', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={manualLead.email} onChange={(event) => updateManual('email', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gasto/movimentacao mensal</Label>
                  <Select value={manualLead.gastoMensal} onValueChange={(value) => updateManual('gastoMensal', value ?? '')}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {spendOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {questionnaireBlocks.map((block) => (
                <div key={block.title} className="rounded-md border border-[#d7ad68]/25 bg-white/55 p-3">
                  <h3 className="font-semibold text-[#0b3b31]">{block.title}</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {block.questions.map((question) => (
                      <div key={question} className="space-y-2">
                        <Label>{question}</Label>
                        <Textarea
                          value={manualAnswers[question] || ''}
                          onChange={(event) => setManualAnswers((prev) => ({ ...prev, [question]: event.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card className="atlas-dark-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#f4d59a]"><Presentation size={18} /> Apresentacoes Canva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {canvaLinks.map((item) => (
              <a key={item.product} href={item.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-md border border-[#d7ad68]/25 bg-[#0f2d27]/65 p-2.5 text-sm text-[#f8e7c4] hover:bg-[#153d35]">
                {item.product}
                <ExternalLink size={14} />
              </a>
            ))}
          </CardContent>
        </Card>

        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageCircle size={18} /> Quebra-gelo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>- Qual viagem voce tiraria do papel se custo nao fosse o problema?</p>
            <p>- O que mais te irrita hoje ao organizar uma viagem?</p>
            <p>- Voce prefere conforto, frequencia ou economia?</p>
          </CardContent>
        </Card>

        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle>Desfecho da call</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Participantes da call</Label>
              <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
                {gestores.map((gestor) => (
                  <label key={gestor.id} className="flex items-center gap-2 rounded-md border border-[#d7ad68]/25 bg-white/60 p-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!participantes[gestor.id]}
                      onChange={(event) => setParticipantes((prev) => ({ ...prev, [gestor.id]: event.target.checked }))}
                    />
                    {gestor.nome}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data e hora da call</Label>
              <Input type="datetime-local" value={form.dataHora} onChange={(event) => update('dataHora', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cliente fechou?</Label>
              <Select value={form.fechou} onValueChange={(value) => update('fechou', value ?? 'true')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim, vai para Clientes</SelectItem>
                  <SelectItem value="false">Nao, follow up 15 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Produto escolhido</Label>
              <Select value={form.produto} onValueChange={(value) => selecionarProduto(value ?? '')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {produtos.map((product) => (
                    <SelectItem key={product.id} value={product.nome}>
                      {product.nome}{product.preco > 0 ? ` - ${formatMoney(product.preco)}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-2">
                <Label>Valor do produto</Label>
                <Select value={form.valorModo} onValueChange={(value) => selecionarValor(value ?? 'outro')}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {selectedProduct?.preco ? (
                      <SelectItem value="catalogo">Valor cadastrado - {formatMoney(selectedProduct.preco)}</SelectItem>
                    ) : null}
                    <SelectItem value="outro">Outro valor / desconto</SelectItem>
                  </SelectContent>
                </Select>
                {form.valorModo === 'outro' ? (
                  <Input type="number" step="0.01" placeholder="Digite o valor negociado" value={form.valor} onChange={(event) => update('valor', event.target.value)} />
                ) : (
                  <Input readOnly value={selectedProduct?.preco ? formatMoney(selectedProduct.preco) : 'Sem valor cadastrado'} />
                )}
              </div>
              <div className="space-y-2">
                <Label>Acesso</Label>
                <Select value={form.periodoMeses} onValueChange={(value) => update('periodoMeses', value ?? '1')}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((month) => (
                      <SelectItem key={month} value={month}>{month} mes(es)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pagamento</Label>
              <Select value={form.pago} onValueChange={(value) => update('pago', value ?? 'false')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Pendente - entra em A receber</SelectItem>
                  <SelectItem value="true">Pago - entra em receita recebida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Textarea value={form.observacoes} onChange={(event) => update('observacoes', event.target.value)} />
            </div>
            {message && (
              <Badge className={message.includes('Nao') ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}>
                {message}
              </Badge>
            )}
            <Button type="submit" disabled={loading} className="h-10 w-full bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]">
              {loading ? <Loader2 className="animate-spin" size={16} /> : form.fechou === 'true' ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
              Salvar desfecho
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
