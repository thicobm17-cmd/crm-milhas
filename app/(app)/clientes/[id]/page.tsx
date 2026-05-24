import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getProgramas, toNum, calcEconomia } from '@/lib/queries'
import { formatCurrency, formatMilhas } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Plane, DollarSign, Target, Phone, Mail, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { AdicionarContaForm } from '@/components/clientes/AdicionarContaForm'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClienteDetalhePage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  const gestorId = session!.user.id

  const [cliente, contas, emissoes, programas] = await Promise.all([
    prisma.cliente.findFirst({ where: { id, gestorId } }),
    prisma.contaPrograma.findMany({
      where: { clienteId: id, gestorId },
      include: { programa: true },
    }),
    prisma.emissao.findMany({
      where: { clienteId: id, gestorId },
      include: { programa: true },
      orderBy: { dataVoo: 'desc' },
    }),
    getProgramas(),
  ])

  if (!cliente) notFound()

  const confirmadas = emissoes.filter(e => e.status === 'confirmada')
  const economiaTotal = confirmadas.reduce((acc, e) => acc + calcEconomia(e.precoMercado, e.taxasPagas, e.feeCobrado), 0)
  const totalMilhas = confirmadas.reduce((acc, e) => acc + e.milhasUtilizadas, 0)
  const metaEconomia = toNum(cliente.metaEconomia)
  const roi = metaEconomia > 0 ? ((economiaTotal - metaEconomia) / metaEconomia) * 100 : 0
  const progresso = metaEconomia > 0 ? Math.min((economiaTotal / metaEconomia) * 100, 100) : 0

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/clientes">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" /> Clientes</Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex-1">{cliente.nome}</h1>
        <Badge variant={cliente.ativo ? 'default' : 'secondary'}>{cliente.ativo ? 'Ativo' : 'Inativo'}</Badge>
        <Link href={`/emissoes/nova?cliente=${id}`}>
          <Button size="sm" className="flex items-center gap-2"><Plane size={14} />Nova emissão</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-medium text-slate-700">Contato</h3>
            {cliente.email && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail size={14} /> {cliente.email}</div>}
            {cliente.telefone && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone size={14} /> {cliente.telefone}</div>}
            {cliente.produtoContratado && (
              <p className="text-sm">
                <span className="text-slate-500">Produto:</span>{' '}
                <span className="font-medium">{cliente.produtoContratado}</span>
              </p>
            )}
            {metaEconomia > 0 && (
              <p className="text-sm">
                <span className="text-slate-500">Valor investido:</span>{' '}
                <span className="font-medium">{formatCurrency(metaEconomia)}</span>
              </p>
            )}
            {cliente.acessoFim && (
              <p className="text-sm">
                <span className="text-slate-500">Acesso ate:</span>{' '}
                <span className="font-medium">{new Date(cliente.acessoFim).toLocaleDateString('pt-BR')}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 text-center">
            <TrendingUp className="text-green-500 mx-auto mb-2" size={22} />
            <p className="text-xs text-slate-500">Economia Total</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(economiaTotal)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 text-center">
            <Plane className="text-blue-500 mx-auto mb-2" size={22} />
            <p className="text-xs text-slate-500">Emissões</p>
            <p className="text-xl font-bold">{confirmadas.length}</p>
            <p className="text-xs text-slate-400">{formatMilhas(totalMilhas)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 text-center">
            <DollarSign className="text-purple-500 mx-auto mb-2" size={22} />
            <p className="text-xs text-slate-500">ROI da Assessoria</p>
            <p className={`text-xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>{roi.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      {metaEconomia > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-blue-600" />
              <span className="font-medium">Meta de Economia</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>{formatCurrency(economiaTotal)} economizados</span>
              <span className="font-medium">Meta: {formatCurrency(metaEconomia)}</span>
            </div>
            <Progress value={progresso} className="h-3" />
            <p className="text-xs text-slate-500 mt-1">{progresso.toFixed(1)}% concluído</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="programas">
        <TabsList>
          <TabsTrigger value="programas">Programas de Fidelidade</TabsTrigger>
          <TabsTrigger value="emissoes">Histórico de Emissões</TabsTrigger>
        </TabsList>

        <TabsContent value="programas" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contas.map(conta => (
              <Card key={conta.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: conta.programa.cor }} />
                      <div>
                        <p className="font-medium">{conta.programa.nome}</p>
                        {conta.numeroConta && <p className="text-xs text-slate-500">Conta: {conta.numeroConta}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{new Intl.NumberFormat('pt-BR').format(conta.saldoAtual)}</p>
                      <p className="text-xs text-slate-500">milhas</p>
                    </div>
                  </div>
                  {conta.ultimaAtualizacaoSaldo && (
                    <p className="text-xs text-slate-400 mt-2">
                      Atualizado: {new Date(conta.ultimaAtualizacaoSaldo).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            <AdicionarContaForm clienteId={id} programas={programas} />
          </div>
        </TabsContent>

        <TabsContent value="emissoes" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {emissoes.length > 0 ? (
                <div className="divide-y">
                  {emissoes.map(e => {
                    const eco = calcEconomia(e.precoMercado, e.taxasPagas, e.feeCobrado)
                    return (
                      <div key={e.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-10 rounded-full" style={{ backgroundColor: e.programa?.cor ?? '#6b7280' }} />
                          <div>
                            <p className="font-medium">{e.origem} → {e.destino}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(e.dataVoo).toLocaleDateString('pt-BR')} · {e.classe} · {e.passageiros} pax
                            </p>
                            <p className="text-xs text-slate-400">{formatMilhas(e.milhasUtilizadas)} · {e.programa?.nome}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+{formatCurrency(eco)}</p>
                          <p className="text-xs text-slate-500">mercado: {formatCurrency(toNum(e.precoMercado))}</p>
                          <Badge variant={e.status === 'confirmada' ? 'default' : e.status === 'cancelada' ? 'destructive' : 'secondary'} className="text-xs mt-1">
                            {e.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <p>Nenhuma emissão ainda.</p>
                  <Link href={`/emissoes/nova?cliente=${id}`} className="mt-3 inline-block">
                    <Button size="sm" variant="outline">Registrar emissão</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
