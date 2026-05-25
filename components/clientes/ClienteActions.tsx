'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { atlasProducts } from '@/lib/atlas-products'
import { Pencil, Power, Trash2 } from 'lucide-react'

interface ClienteData {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  cpf: string | null
  dataNascimento: string | null
  produtoContratado: string | null
  metaEconomia: number
  observacoes: string | null
  ativo: boolean
}

export function ClienteActions({ cliente }: { cliente: ClienteData }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nome: cliente.nome,
    email: cliente.email ?? '',
    telefone: cliente.telefone ?? '',
    cpf: cliente.cpf ?? '',
    dataNascimento: cliente.dataNascimento ?? '',
    produtoContratado: cliente.produtoContratado ?? '',
    valorProduto: cliente.metaEconomia ? String(cliente.metaEconomia) : '',
    observacoes: cliente.observacoes ?? '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/clientes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cliente.id, ...form }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Erro ao salvar.')
      setLoading(false)
      return
    }
    setEditOpen(false)
    setLoading(false)
    router.refresh()
  }

  async function toggleAtivo() {
    setLoading(true)
    await fetch('/api/clientes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cliente.id, action: 'toggle_ativo' }),
    })
    setLoading(false)
    router.refresh()
  }

  async function excluir() {
    setLoading(true)
    await fetch(`/api/clientes?id=${cliente.id}`, { method: 'DELETE' })
    setLoading(false)
    setDelOpen(false)
    router.push('/clientes')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil size={14} className="mr-1" /> Editar
      </Button>
      <Button variant="outline" size="sm" onClick={toggleAtivo} disabled={loading}>
        <Power size={14} className="mr-1" /> {cliente.ativo ? 'Desativar' : 'Ativar'}
      </Button>
      <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDelOpen(true)}>
        <Trash2 size={14} className="mr-1" /> Excluir
      </Button>

      {/* Dialog de edicao */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
          <form onSubmit={salvarEdicao} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input value={form.nome} onChange={e => update('nome', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => update('telefone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={e => update('cpf', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data de nascimento</Label>
                <Input type="date" value={form.dataNascimento} onChange={e => update('dataNascimento', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valor investido (R$)</Label>
                <Input type="number" step="0.01" value={form.valorProduto} onChange={e => update('valorProduto', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Produto contratado</Label>
              <Select value={form.produtoContratado} onValueChange={v => update('produtoContratado', v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>
                  {atlasProducts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Textarea rows={2} value={form.observacoes} onChange={e => update('observacoes', e.target.value)} />
            </div>
            {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading} className="bg-[#0b3b31] text-[#f4d59a]">{loading ? 'Salvando...' : 'Salvar'}</Button>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de exclusao */}
      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir cliente</DialogTitle>
            <DialogDescription>
              Esta acao remove <strong>{cliente.nome}</strong> e todo o historico (programas, emissoes, produtos, cartoes). Nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setDelOpen(false)}>Cancelar</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={excluir} disabled={loading}>
              {loading ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
