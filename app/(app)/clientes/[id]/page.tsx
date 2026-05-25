import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getProgramas, toNum, calcEconomia } from '@/lib/queries'
import { formatCurrency, formatMilhas } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Plane, DollarSign, Target, Phone, Mail, TrendingUp, Hotel, Map, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { AdicionarContaForm } from '@/components/clientes/AdicionarContaForm'
import { ClienteActions } from '@/components/clientes/ClienteActions'
import { ContaActions } from '@/components/clientes/ContaActions'
import { AdicionarProdutoForm } from '@/components/clientes/AdicionarProdutoForm'
import { ProdutoActions } from '@/components/clientes/ProdutoActions'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

const tipoIcones: Record<string, typeof Plane> = {
  PASSAGEM: Plane,
  HOTEL: Hotel,
  PASSEIO: Map,
  SEGURO: ShieldCheck,
}

const tipoLabels: Record<string, string> = {
  PASSAGEM: 'Passagem',
  HOTEL: 'Hotel',
  PASSEIO: 'Passeio',
  SEGURO: 'Seguro',
}

export default async function ClienteDetalhePage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  const gestorId = session!.user.id

  const [cliente, contas, emissoes, produtos, programas, gestores] = await Promise.all([
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
    prisma.produtoCliente.findMany({
      where: { clienteId: id, cliente: { gestorId } },
      include: { responsavel: { select: { nome: true } } },
      orderBy: { dataSolicitacao: 'desc' },
    }),
    getProgramas(),
    prisma.gestor.findMany({ where: { autorizado: true }, select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
  ])

  if (!cliente) notFound()

  const confirmadas = emissoes.filter(e => e.status === 'confirmada')
  const economiaEmissoes = confirmadas.reduce((acc, e) => acc + calcEconomia(e.precoMercado, e.taxasPagas, e.feeCobrado), 0)
  const economiaProdutos = produtos.filter(p => p.status === 'EMITIDO').reduce((acc, p) => acc + (toNum(p.precoReferencia) - toNum(p.precoAtlas)), 0)
  const economiaTotal = economiaEmissoes + economiaProdutos
  const totalMilhas = confirmadas.reduce((acc, e) => acc + e.milhasUtilizadas, 0)
  const metaEconomia = toNum(cliente.metaEconomia)
  const roi = metaEconomia > 0 ? ((economiaTotal - metaEconomia) / metaEconomia) * 100 : 0
  const progresso = metaEconomia > 0 ? Math.min((economiaTotal / metaEconomia) * 100, 100) : 0
  const initials = cliente.nome.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase()

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/clientes">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" /> Clientes</Button>
        </Link>
        <div className="flex flex-1 items-center gap-3">
          <Avatar className="size-14 border border-[#d7ad68]/40">
            {cliente.fotoUrl && <AvatarImage src={cliente.fotoUrl} alt={cliente.nome} />}
            <AvatarFallback className="bg-[#0b3b31] text-[#f4d59a]">{initials}</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold text-slate-900">{cliente.nome}</h1>
        </div>
        <Badge variant={cliente.ativo ? 'default' : 'secondary'}>{cliente.ativo ? 'Ativo' : 'Inativo'}</Badge>
      </div>

      <ClienteActions cliente={{
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        cpf: cliente.cpf,
        dataNascimento: cliente.dataNascimento ? cliente.dataNascimento.toISOString().slice(0, 10) : null,
        produtoContratado: cliente.produtoContratado,
        metaEconomia,
        observacoes: cliente.observacoes,
        fotoUrl: cliente.fotoUrl,
        ativo: cliente.ativo,
      }} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-medium text-slate-700">Contato</h3>
            {cliente.email && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail size={14} /> {cliente.email}</div>}
            {cliente.telefone && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone size={14} /> {cliente.telefone}</div>}
            {cliente.cpf && (
              <p className="text-sm"><span className="text-slate-500">CPF:</span>{' '}<span className="font-medium">{cliente.cpf}</span></p>
            )}
            {cliente.dataNascimento && (
              <p className="text-sm"><span className="text-slate-500">Nascimento:</span>{' '}<span className="font-medium">{new Date(cliente.dataNascimento).toLocaleDateString('pt-BR')}</span></p>
            )}
            {cliente.produtoContratado && (
              <p className="text-sm"><span className="text-slate-500">Produto:</span>{' '}<span className="font-medium">{cliente.produtoContratado}</span></p>
            )}
            {metaEconomia > 0 && (
              <p className="text-sm"><span className="text-slate-500">Valor investido:</span>{' '}<span className="font-medium">{formatCurrency(metaEconomia)}</span></p>
            )}
            {cliente.acessoFim && (
              <p className="text-sm"><span className="text-slate-500">Acesso ate:</span>{' '}<span className="font-medium">{new Date(cliente.acessoFim).toLocaleDateString('pt-BR')}</span></p>
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
            <p className="text-xs text-slate-500">Produtos</p>
            <p className="text-xl font-bold">{confirmadas.length + produtos.length}</p>
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
            <p className="text-xs text-slate-500 mt-1">{progresso.toFixed(1)}% concluido</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos">Produtos de Viagem</TabsTrigger>
          <TabsTrigger value="programas">Programas de Milhas</TabsTrigger>
          <TabsTrigger value="emissoes">Emissoes (legado)</TabsTrigger>
        </TabsList>

        {/* PRODUTOS: Passagem / Hotel / Passeio / Seguro */}
        <TabsContent value="produtos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <AdicionarProdutoForm clienteId={id} gestores={gestores} />
          </div>
          {produtos.length > 0 ? (
            <div className="space-y-2">
              {produtos.map(p => {
                const Icon = tipoIcones[p.tipo] ?? Plane
                const economia = toNum(p.precoReferencia) - toNum(p.precoAtlas)
                return (
                  <Card key={p.id} className="border-0 shadow-sm">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-md bg-[#0b3b31]/10 text-[#0b3b31]"><Icon size={16} /></div>
                        <div>
                          <p className="font-medium">
                            {tipoLabels[p.tipo] ?? p.tipo}
                            {p.origem && p.destino ? ` · ${p.origem} → ${p.destino}` : ''}
                            {p.local ? ` · ${p.local}` : ''}
                            {p.nome ? ` · ${p.nome}` : ''}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.dataInicio ? new Date(p.dataInicio).toLocaleDateString('pt-BR') : 'sem data'}
                            {p.responsavel?.nome ? ` · resp. ${p.responsavel.nome}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-700">+{formatCurrency(economia)}</p>
                          <Badge className={p.status === 'EMITIDO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                            {p.status === 'EMITIDO' ? 'Emitido' : 'Em cotacao'}
                          </Badge>
                        </div>
                        <ProdutoActions id={p.id} status={p.status} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-slate-400">
                Nenhum produto cadastrado. Adicione passagens, hoteis, passeios e seguros.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PROGRAMAS DE MILHAS */}
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
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{new Intl.NumberFormat('pt-BR').format(conta.saldoAtual)}</p>
                        <p className="text-xs text-slate-500">milhas</p>
                      </div>
                      <ContaActions id={conta.id} saldoAtual={conta.saldoAtual} numeroConta={conta.numeroConta} />
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

        {/* EMISSOES LEGADO */}
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
                  <p>Nenhuma emissao no sistema legado.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
