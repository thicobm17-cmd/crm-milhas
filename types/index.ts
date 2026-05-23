export type Gestor = {
  id: string
  nome: string
  email: string
  telefone?: string
  created_at: string
}

export type Programa = {
  id: number
  nome: string
  companhia: string
  cor: string
}

export type Cliente = {
  id: string
  gestor_id: string
  nome: string
  email?: string
  telefone?: string
  cpf?: string
  data_nascimento?: string
  observacoes?: string
  fee_mensal: number
  fee_por_emissao: number
  meta_economia: number
  ativo: boolean
  created_at: string
}

export type ClienteResumo = Cliente & {
  economia_total: number
  total_emissoes: number
  total_milhas_usadas: number
}

export type ContaPrograma = {
  id: string
  cliente_id: string
  gestor_id: string
  programa_id: number
  numero_conta?: string
  saldo_atual: number
  ultima_atualizacao_saldo?: string
  programa?: Programa
}

export type Emissao = {
  id: string
  gestor_id: string
  cliente_id: string
  programa_id?: number
  origem: string
  destino: string
  data_voo: string
  passageiros: number
  milhas_utilizadas: number
  preco_mercado: number
  taxas_pagas: number
  fee_cobrado: number
  economia: number
  classe: string
  status: 'confirmada' | 'cancelada' | 'pendente'
  observacoes?: string
  created_at: string
  cliente?: Cliente
  programa?: Programa
}

export type Transacao = {
  id: string
  gestor_id: string
  cliente_id?: string
  emissao_id?: string
  tipo: 'receita' | 'despesa' | 'fee_mensal' | 'fee_emissao' | 'compra_milhas'
  descricao: string
  valor: number
  data_vencimento?: string
  data_pagamento?: string
  pago: boolean
  created_at: string
  cliente?: Cliente
}

export const PROGRAMAS_CORES: Record<number, string> = {
  1: '#e3373c',
  2: '#f97316',
  3: '#2563eb',
  4: '#8b5cf6',
  5: '#6b7280',
}
