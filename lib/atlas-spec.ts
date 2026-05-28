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
    description: 'Lead entrou pelo link público e ainda não recebeu o primeiro contato.',
  },
  {
    status: 'Aguardando marcação',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Entrevista via WhatsApp já foi feita e falta escolher data e hora.',
  },
  {
    status: 'Marcada',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Call com data, horário e colaboradores definidos no calendário.',
  },
  {
    status: 'Follow up',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Prazo ativo por 15 dias corridos a partir da seleção.',
  },
  {
    status: 'Cliente negado',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Status automático depois de 15 dias sem conversão no follow up.',
  },
]

export const publicQuizQuestions = [
  {
    bloco: 'Perfil de viagem',
    pergunta: 'Você viaja mais a trabalho ou a lazer?',
    opcoes: ['Trabalho', 'Lazer', 'Os dois'],
  },
  {
    bloco: 'Frequência de viagem',
    pergunta: 'Quantas viagens você faz por ano?',
    opcoes: ['1 a 2', '3 a 5', '6 ou mais', 'Quase não viajo, mas queria'],
  },
  {
    bloco: 'Milhas',
    pergunta: 'Você já acumula milhas?',
    opcoes: ['Sim, e uso', 'Sim, mas estão paradas', 'Não sei se tenho', 'Não acumulo'],
  },
  {
    bloco: 'Barreira principal',
    pergunta: 'O que mais te impede de viajar mais?',
    opcoes: ['Tempo pra planejar', 'Preço das passagens', 'Não sei usar milhas', 'Falta de organização'],
  },
  {
    bloco: 'Perfil financeiro',
    pergunta: 'Quanto você movimenta no cartão por mês, em média?',
    opcoes: ['Até R$5 mil', 'R$5 a 15 mil', 'R$15 a 40 mil', 'Acima de R$40 mil'],
  },
  {
    bloco: 'Destino desejado',
    pergunta: 'Pra onde você sonha em ir nos próximos 12 meses?',
    opcoes: ['Europa', 'EUA', 'Ásia', 'Brasil', 'Ainda decidindo'],
  },
  {
    bloco: 'Contato preferido',
    pergunta: 'Como prefere receber seu diagnóstico?',
    opcoes: ['WhatsApp', 'E-mail'],
  },
]

export const questionnaireBlocks = [
  {
    title: 'Perfil de viagens',
    questions: ['O que mais valoriza ao viajar', 'Viagem dos sonhos', 'Viagens por ano', 'Viagens programadas nos próximos 6 a 12 meses'],
  },
  {
    title: 'Situação com milhas',
    questions: ['Se já acumula milhas', 'Programa principal e saldo atual', 'Cartão de crédito principal', 'Como emite passagens hoje'],
  },
  {
    title: 'Perfil financeiro',
    questions: ['Predominância no cartão de crédito'],
  },
  {
    title: 'Contexto e motivação',
    questions: ['Conhecimento sobre gestão de milhas', 'Maior obstáculo para viajar', 'Motivo para buscar assessoria agora'],
  },
]

export const qualificationRules = [
  ['Acima de R$40 mil/mês ou alta frequência de viagens', 'Prioridade para Gestão de Viagens Completa'],
  ['R$15 mil a R$40 mil/mês', 'Avaliar gestão completa ou acompanhamento na call'],
  ['Até R$5 mil/mês ou dificuldade para usar milhas', 'Tende a encaixar melhor em consultoria'],
  ['Veio por indicação', 'Aplicar condição comercial com indicação'],
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
