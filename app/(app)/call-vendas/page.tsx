import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { questionnaireBlocks } from '@/lib/atlas-spec'
import { ArrowRight, ClipboardCheck, ExternalLink, MessageCircle, Presentation, UserRoundSearch } from 'lucide-react'

const callSteps = [
  'Selecionar origem: Link do Funil ou Indicacao',
  'Puxar respostas do lead ou preencher questionario manual',
  'Usar apresentacao correta do Canva para o produto',
  'Definir desfecho: cliente fechado ou follow up de 15 dias',
]

export default function CallVendasPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Aba 2</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#11231f]">Call de vendas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Roteiro de call, origem do cliente, apresentacoes e desfecho comercial.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {callSteps.map((step, index) => (
          <Card key={step} className="atlas-panel">
            <CardContent className="p-4">
              <div className="mb-3 flex size-8 items-center justify-center rounded-full bg-[#0b3b31] text-sm font-semibold text-[#f4d59a]">{index + 1}</div>
              <p className="text-sm font-medium">{step}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="funil">
        <TabsList className="bg-[#e7d6b6]">
          <TabsTrigger value="funil">Link do Funil</TabsTrigger>
          <TabsTrigger value="indicacao">Indicacao</TabsTrigger>
        </TabsList>

        <TabsContent value="funil" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="atlas-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserRoundSearch size={18} /> Selecionar lead agendado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['Indicacao Premium', 'Lead Instagram', 'Familia Europa 2026'].map((lead) => (
                  <button key={lead} className="flex w-full items-center justify-between rounded-md border border-[#d7ad68]/25 bg-white/65 p-3 text-left text-sm hover:bg-white">
                    <span>{lead}</span>
                    <ArrowRight size={15} />
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="atlas-panel">
              <CardHeader>
                <CardTitle>Respostas aparecem automaticamente</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {questionnaireBlocks.slice(0, 4).map((block) => (
                  <div key={block.title} className="rounded-md bg-white/65 p-3">
                    <p className="text-sm font-medium text-[#0b3b31]">{block.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{block.questions[0]}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="indicacao" className="mt-4">
          <Card className="atlas-panel">
            <CardHeader>
              <CardTitle>Questionario manual durante a call</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {questionnaireBlocks.map((block) => (
                <div key={block.title} className="rounded-md border border-[#d7ad68]/25 bg-white/65 p-4">
                  <p className="font-medium text-[#0b3b31]">{block.title}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{block.questions.length} perguntas para preencher</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="atlas-dark-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#f4d59a]"><Presentation size={18} /> Apresentacoes Canva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['Gestao de Viagens Completa', 'Consultoria 1h', 'Consultoria + Acompanhamento'].map((product) => (
              <Button key={product} variant="outline" className="w-full justify-between border-[#d7ad68]/30 bg-transparent text-[#f8e7c4] hover:bg-[#0f2d27]">
                {product}
                <ExternalLink size={14} />
              </Button>
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
            <CardTitle className="flex items-center gap-2"><ClipboardCheck size={18} /> Desfecho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge className="bg-emerald-100 text-emerald-800">Cliente fechou - vai para Clientes</Badge>
            <Badge className="bg-amber-100 text-amber-800">Nao fechou - Follow up por 15 dias</Badge>
            <p className="text-sm text-muted-foreground">Ao fechar, o produto contratado alimenta automaticamente o Financeiro da Empresa.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
