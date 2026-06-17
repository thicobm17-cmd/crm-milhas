'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil, Trash2 } from 'lucide-react'

interface GestorSimples {
  id: string
  nome: string
}

interface ProdutoEditavel {
  id: string
  tipo: string
  nome: string
  local: string
  origem: string
  destino: string
  dataInicio: string
  dataFim: string
  classe: string
  precoReferencia: string
  precoAtlas: string
  responsavelId: string
  observacoes: string
}

interface Props {
  id: string
  status: string
  produto: ProdutoEditavel
  gestores: GestorSimples[]
}

const tipos = [
  { value: 'PASSAGEM', label: 'Passagem' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'PASSEIO', label: 'Passeio' },
  { value: 'SEGURO', label: 'Seguro' },
]

const tipoLabels = Object.fromEntries(tipos.map((tipo) => [tipo.value, tipo.label]))

const statusLabels: Record<string, string> = {
  EM_COTACAO: 'Em cotacao',
  EMITIDO: 'Emitido',
}

function parseMoney(value: string) {
  if (!value) return 0
  const normalized = value.trim()
  if (!normalized) return 0
  if (normalized.includes(',')) {
    return Number(normalized.replace(/\./g, '').replace(',', '.')) || 0
  }
  return Number(normalized) || 0
}

export function ProdutoActions({ id, status, produto, gestores }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState(produto)
  const gestorLabels = Object.fromEntries(gestores.map((gestor) => [gestor.id, gestor.nome]))
  const isPassagem = form.tipo === 'PASSAGEM'
  const isHotel = form.tipo === 'HOTEL'
  const isSeguro = form.tipo === 'SEGURO'
  const isPasseio = form.tipo === 'PASSEIO'
  const economia = parseMoney(form.precoReferencia) - parseMoney(form.precoAtlas)

  function update(field: keyof ProdutoEditavel, value: string) {
    if (erro) setErro('')
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function mudarStatus(novo: string) {
    setLoading(true)
    await fetch('/api/produtos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'status', status: novo }),
    })
    setLoading(false)
    router.refresh()
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const response = await fetch('/api/produtos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id, action: 'update' }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Nao foi possivel editar o produto.')
      }

      setEditOpen(false)
      router.refresh()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao editar produto.')
    } finally {
      setLoading(false)
    }
  }

  async function excluir() {
    setLoading(true)
    await fetch(`/api/produtos?id=${id}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" title="Editar produto" onClick={() => setEditOpen(true)} disabled={loading}>
        <Pencil size={13} />
      </Button>
      <Select value={status} onValueChange={v => mudarStatus(v ?? status)} disabled={loading}>
        <SelectTrigger className="h-7 w-[120px] text-xs">
          <SelectValue>{value => statusLabels[String(value)] ?? 'Em cotacao'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EM_COTACAO">Em cotacao</SelectItem>
          <SelectItem value="EMITIDO">Emitido</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon-sm" className="text-red-600" title="Excluir" onClick={excluir} disabled={loading}>
        <Trash2 size={13} />
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar produto de viagem</DialogTitle></DialogHeader>
          <form onSubmit={salvarEdicao} className="mt-2 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => update('tipo', v ?? 'PASSAGEM')}>
                  <SelectTrigger><SelectValue>{value => tipoLabels[String(value)] ?? 'Passagem'}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {tipos.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsavel</Label>
                <Select value={form.responsavelId} onValueChange={v => update('responsavelId', v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Selecione">{value => gestorLabels[String(value)] ?? 'Selecione'}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {gestores.map(g => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isPassagem && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>Origem</Label><Input value={form.origem} onChange={e => update('origem', e.target.value)} placeholder="GRU" /></div>
                <div className="space-y-2"><Label>Destino</Label><Input value={form.destino} onChange={e => update('destino', e.target.value)} placeholder="LIS" /></div>
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select value={form.classe} onValueChange={v => update('classe', v ?? 'Economica')}>
                    <SelectTrigger><SelectValue>{value => String(value || 'Economica')}</SelectValue></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Economica">Economica</SelectItem>
                      <SelectItem value="Executiva">Executiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(isHotel || isPasseio || isSeguro) && (
              <div className="space-y-2">
                <Label>{isSeguro ? 'Regiao' : isPasseio ? 'Nome do passeio / local' : 'Local'}</Label>
                <Input value={isPasseio ? form.nome : form.local} onChange={e => update(isPasseio ? 'nome' : 'local', e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isPassagem ? 'Data de ida' : isHotel ? 'Check-in' : isSeguro ? 'Inicio' : 'Data do passeio'}</Label>
                <Input type="date" value={form.dataInicio} onChange={e => update('dataInicio', e.target.value)} />
              </div>
              {!isPasseio && (
                <div className="space-y-2">
                  <Label>{isPassagem ? 'Data de volta' : isHotel ? 'Check-out' : 'Fim'}</Label>
                  <Input type="date" value={form.dataFim} onChange={e => update('dataFim', e.target.value)} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isPassagem ? 'Preco companhia (R$)' : 'Preco plataforma (R$)'}</Label>
                <Input inputMode="decimal" value={form.precoReferencia} onChange={e => update('precoReferencia', e.target.value)} placeholder="Ex: 4.463,00" />
              </div>
              <div className="space-y-2">
                <Label>Preco Atlas (R$)</Label>
                <Input inputMode="decimal" value={form.precoAtlas} onChange={e => update('precoAtlas', e.target.value)} placeholder="Ex: 246,26" />
              </div>
            </div>

            {economia > 0 && (
              <p className="rounded-md bg-emerald-50 p-2 text-sm font-medium text-emerald-700">
                Economia gerada: R$ {economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}

            {erro && (
              <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm font-medium text-red-700">
                {erro}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading} className="bg-[#0b3b31] text-[#f4d59a]">{loading ? 'Salvando...' : 'Salvar'}</Button>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
