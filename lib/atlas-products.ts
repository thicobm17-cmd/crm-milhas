export const atlasProducts = [
  'Gestao de Viagens Completa - Com indicacao',
  'Gestao de Viagens Completa - Sem indicacao',
  'Consultoria 1h',
  'Consultoria + Acompanhamento',
]

export function getProductLabel(value?: string | null) {
  return value || 'Produto nao definido'
}
