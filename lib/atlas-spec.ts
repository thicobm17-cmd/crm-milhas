import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Hotel,
  Map,
  Plane,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

export const leadColumns = [
  {
    status: 'Aguardando entrevista',
    color: 'bg-stone-200 text-stone-700 border-stone-300',
    description: 'Lead entrou pelo link publico e ainda nao recebeu o primeiro contato.',
  },
  {
    status: 'Aguardando marcacao',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Entrevista via WhatsApp ja foi feita e falta escolher data e hora.',
  },
  {
    status: 'Marcada',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Call com data, horario e colaboradores definidos no calendario.',
  },
  {
    status: 'Follow up',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Prazo ativo por 15 dias corridos a partir da selecao.',
  },
  {
    status: 'Cliente negado',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Status automatico depois de 15 dias sem conversao no follow up.',
  },
]

export const questionnaireBlocks = [
  {
    title: 'Identificacao',
    questions: ['Nome completo', 'WhatsApp com DDD', 'E-mail', 'Como nos conheceu', 'Quem indicou, quando houver'],
  },
  {
    title: 'Perfil de viagens',
    questions: ['O que mais valoriza ao viajar', 'Viagem dos sonhos', 'Viagens por ano', 'Viagens programadas nos proximos 6 a 12 meses'],
  },
  {
    title: 'Situacao com milhas',
    questions: ['Se ja acumula milhas', 'Programa principal e saldo atual', 'Cartao de credito principal', 'Como emite passagens hoje'],
  },
  {
    title: 'Perfil financeiro',
    questions: ['Movimentacao mensal', 'Predominancia no cartao de credito'],
  },
  {
    title: 'Contexto e motivacao',
    questions: ['Conhecimento sobre gestao de milhas', 'Maior obstaculo para viajar', 'Motivo para buscar assessoria agora'],
  },
]

export const qualificationRules = [
  ['Acima de R$8.000/mes + cartao predominante', 'Gestao de Viagens Completa'],
  ['Entre R$3.000 e R$8.000/mes', 'Avaliar na call'],
  ['Abaixo de R$3.000 ou Pix/debito predominante', 'Consultoria'],
  ['Veio por indicacao', 'Aplicar valor com desconto de indicacao'],
]

export const atlasPrograms = [
  'Esfera',
  'Livelo',
  'TudoAzul',
  'Smiles',
  'LATAM Pass',
  'Iberia',
  'TAP',
  'AAdvantage',
]

export const clientProductTypes = [
  {
    title: 'Passagem',
    icon: Plane,
    fields: ['Data da solicitacao', 'Status', 'Origem e destino', 'Ida e volta flexivel ou calendario', 'Check-in', 'Classe', 'Preco companhia', 'Preco Atlas', 'Responsavel'],
  },
  {
    title: 'Hotel',
    icon: Hotel,
    fields: ['Data da solicitacao', 'Status', 'Local', 'Check-in', 'Check-out', 'Preco plataforma', 'Preco Atlas', 'Responsavel'],
  },
  {
    title: 'Passeio',
    icon: Map,
    fields: ['Data da solicitacao', 'Nome do passeio', 'Status', 'Local', 'Data do passeio', 'Preco plataforma', 'Preco Atlas', 'Responsavel'],
  },
  {
    title: 'Seguro',
    icon: ShieldCheck,
    fields: ['Data da solicitacao', 'Tipo de seguro', 'Status', 'Regiao', 'Dias de cobertura', 'Preco normal', 'Preco Atlas', 'Responsavel'],
  },
]

export const dashboardPanels = [
  { label: 'Economia total gerada', icon: Sparkles },
  { label: 'Clientes ativos', icon: Users },
  { label: 'Clientes que bateram a meta', icon: CheckCircle2 },
  { label: 'Faturamento do periodo', icon: CircleDollarSign },
  { label: 'Emissoes pendentes', icon: ClipboardList },
  { label: 'Painel de check-in', icon: Bell },
]

export const collaborators = [
  { name: 'Thiago', role: 'CEO', availability: ['09:00', '10:30', '15:00'] },
  { name: 'Gestor Atlas 1', role: 'Gestor de Milhas', availability: ['11:00', '14:00', '16:30'] },
  { name: 'Gestor Atlas 2', role: 'Gestor de Milhas', availability: ['09:30', '13:30', '17:00'] },
]

export const financeLines = [
  { label: 'Receita recebida', color: 'bg-emerald-500', icon: CircleDollarSign },
  { label: 'Despesas', color: 'bg-red-500', icon: CreditCard },
  { label: 'Lucro liquido', color: 'bg-blue-500', icon: Sparkles },
  { label: 'Meta do mes', color: 'bg-stone-900', icon: CalendarDays },
]
