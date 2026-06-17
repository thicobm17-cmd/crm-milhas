'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

interface GestorSimples { id: string; nome: string }

interface Props {
  clienteId: string
  gestores: GestorSimples[]
}

const tipos = [
  { value: 'PASSAGEM', label: 'Passagem' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'PASSEIO', label: 'Passeio' },
  { value: 'SEGURO', label: 'Seguro' },
]

function parseMoney(value: string) {
  if (!value) return 0
  const normalized = value.trim()
  if (!normalized) return 0
  if (normalized.includes(',')) {
    return Number(normalized.replace(/\./g, '').replace(',', '.')) || 0
  }
  return Number(normalized) || 0
}

export function AdicionarProdutoForm({ clienteId, gestores }: Props) {
  const router = useRouter()
  const gestorLabels = Object.fromEntries(gestores.map((gestor) => [gestor.id, gestor.nome]))
  const tipoLabels = Object.fromEntries(tipos.map((tipo) => [tipo.value, tipo.label]))
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    tipo: 'PASSAGEM',
    nome: '',
    local: '',
    origem: '',
    destino: '',
    dataInicio: '',
    dataFim: '',
    classe: 'Economica',
    precoReferencia: '',
    precoAtlas: '',
    responsavelId: gestores[0]?.id ?? '',
    observacoes: '',
  })

  function update(field: string, value: string) {
    if (erro) setErro('')
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const economia = parseMoney(form.precoReferencia) - parseMoney(form.precoAtlas)
  const isPassagem = form.tipo === 'PASSAGEM'
  const isHotel = form.tipo === 'HOTEL'
  const isSeguro = form.tipo === 'SEGURO'
  const isPasseio = form.tipo === 'PASSEIO'

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, ...form }),
        signal: controller.signal,
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Nao foi possivel salvar o produto.')
      }

      setOpen(false)
      setForm({
        tipo: 'PASSAGEM', nome: '', local: '', origem: '', destino: '',
        dataInicio: '', dataFim: '', classe: 'Economica',
        precoReferencia: '', precoAtlas: '', responsavelId: gestores[0]?.id ?? '', observacoes: '',
      })
      router.refresh()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setErro('O salvamento demorou demais. Verifique sua conexao e tente novamente.')
      } else {
        setErro(error instanceof Error ? error.message : 'Erro ao salvar produto.')
      }
    } finally {
      window.clearTimeout(timeout)
      setLoading(false)
    }
  }

  return (
    <>
      <Button className="bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]" onClick={() => setOpen(true)}>
        <Plus size={16} /> Adicionar produto
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Novo produto de viagem</DialogTitle></DialogHeader>
          <form onSubmit={salvar} className="mt-2 space-y-4">
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
              <Button type="submit" disabled={loading} className="bg-[#0b3b31] text-[#f4d59a]">{loading ? 'Salvando...' : 'Adicionar'}</Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
