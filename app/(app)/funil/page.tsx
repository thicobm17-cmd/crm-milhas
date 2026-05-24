import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { leadColumns, qualificationRules, questionnaireBlocks } from '@/lib/atlas-spec'
import { CalendarPlus, Eye, Link2, Trash2, UserCheck } from 'lucide-react'

const sampleLeads = [
  { name: 'Lead Instagram', spend: 'Acima de R$20.000', contact: '(21) 99999-0001', owner: 'Thiago', status: 'Aguardando entrevista' },
  { name: 'Indicacao Premium', spend: 'R$8.000 a R$20.000', contact: '(21) 99999-0002', owner: 'Gestor Atlas 1', status: 'Marcada' },
  { name: 'Consultoria direta', spend: 'R$3.000 a R$8.000', contact: '(21) 99999-0003', owner: 'Gestor Atlas 2', status: 'Follow up' },
]

export default function FunilPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 1</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#11231f]">Funil de vendas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Link publico, leads, status de call e conversao para cliente.</p>
        </div>
        <Button className="h-9 bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]">
          <Link2 size={16} />
          Copiar link do questionario
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="atlas-panel">
          <CardHeader>
            <CardTitle>Questionario publico unico</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {questionnaireBlocks.map((block) => (
              <div key={block.title} className="rounded-md border border-[#d7ad68]/25 bg-white/55 p-4">
                <p className="font-medium text-[#0b3b31]">{block.title}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
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
          <CardContent className="space-y-3">
            {qualificationRules.map(([rule, result]) => (
              <div key={rule} className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/65 p-3">
                <p className="text-sm text-[#f8e7c4]">{rule}</p>
                <p className="mt-1 text-sm font-semibold text-[#d7ad68]">{result}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {leadColumns.map((column) => (
          <Card key={column.status} className="atlas-panel min-h-64">
            <CardHeader className="gap-2">
              <Badge variant="outline" className={column.color}>{column.status}</Badge>
              <p className="text-xs text-muted-foreground">{column.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {sampleLeads.filter((lead) => lead.status === column.status).map((lead) => (
                <div key={lead.name} className="rounded-md border border-[#d7ad68]/25 bg-white/70 p-3">
                  <p className="font-medium text-[#11231f]">{lead.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{lead.contact}</p>
                  <p className="mt-2 text-xs">Gasto: <span className="font-medium">{lead.spend}</span></p>
                  <p className="text-xs">Contato: <span className="font-medium">{lead.owner}</span></p>
                  <div className="mt-3 flex gap-1.5">
                    <Button size="icon-xs" variant="outline" title="Ver respostas"><Eye size={13} /></Button>
                    <Button size="icon-xs" variant="outline" title="Marcar call"><CalendarPlus size={13} /></Button>
                    <Button size="icon-xs" variant="outline" title="Converter cliente"><UserCheck size={13} /></Button>
                    <Button size="icon-xs" variant="destructive" title="Remover lead"><Trash2 size={13} /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
