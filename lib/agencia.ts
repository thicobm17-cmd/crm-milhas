export const canaisVenda = [
  'Instagram',
  'WhatsApp',
  'Facebook',
  'Google',
  'Telegram',
  'Indicação',
  'Afiliado',
  'Representante',
  'Site',
  'Cadastro manual',
]

export const solicitacaoStatus = ['NOVA', 'EM_ANALISE', 'CONVERTIDA_EM_COTACAO', 'PERDIDA']
export const cotacaoStatus = ['AGUARDANDO', 'EM_COTACAO', 'AGUARDANDO_CLIENTE', 'APROVADA', 'REPROVADA', 'CANCELADA']
export const viagemStatus = ['PLANEJADA', 'CONFIRMADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']

export const cotacaoItemTipos = [
  'AEREO',
  'HOTEL',
  'SEGURO',
  'CRUZEIRO',
  'TRANSFER',
  'PASSEIO',
  'LOCACAO_VEICULO',
  'SERVICO',
  'OUTRO',
]

export const programasEstoqueMilhas = [
  { programa: 'Smiles', logoUrl: '/programas-milhas/smiles.png' },
  { programa: 'Latampass', logoUrl: '/programas-milhas/latampass.png' },
  { programa: 'TudoAzul', logoUrl: '/programas-milhas/tudoazul.png' },
  { programa: 'Iberia', logoUrl: '/programas-milhas/iberia.png' },
  { programa: 'Finnair', logoUrl: '/programas-milhas/finnair.png' },
  { programa: 'Aircanada', logoUrl: '/programas-milhas/aircanada.png' },
  { programa: 'AA', logoUrl: '/programas-milhas/aa.png' },
  { programa: 'Qatar', logoUrl: '/programas-milhas/qatar.png' },
]

export const automacoesAgenciaPadrao = [
  ['APROVACAO_VENDA', 'Confirmação da compra', 'Enviar confirmação da compra e próximos passos.'],
  ['7_DIAS_ANTES_VIAGEM', 'Lembrete da viagem', 'Enviar lembrete com documentos, horários e contatos.'],
  ['CHECKIN_DISPONIVEL', 'Check-in disponível', 'Avisar abertura do check-in e dados do voo.'],
  ['RETORNO_VIAGEM', 'Pesquisa de satisfação', 'Enviar pesquisa e convite para recompra.'],
  ['ANIVERSARIO', 'Mensagem de aniversário', 'Enviar mensagem automática de relacionamento.'],
]

export function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function calcMargin(valorVenda: number, custo: number) {
  const lucro = valorVenda - custo
  return valorVenda > 0 ? (lucro / valorVenda) * 100 : 0
}

export function formatAgencyStatus(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w|\s\w/g, (char) => char.toUpperCase())
}
