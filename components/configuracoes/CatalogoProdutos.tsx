'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'

interface Produto {
  id: string
  nome: string
  preco: number
  ativo: boolean
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CatalogoProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvandoId, setSalvandoId] = useState('')
  const [precos, setPrecos] = useState<Record<string, string>>({})
  const [novoNome, setNovoNome] = useState('')
  const [novoPreco, setNovoPreco] = useState('')
  const [adicionando, setAdicionando] = useState(false)

  async function carregar() {
    const res = await fetch('/api/catalogo')
    const data: Produto[] = await res.json()
    setProdutos(data)
    setPrecos(Object.fromEntries(data.map(p => [p.id, p.preco ? String(p.preco) : ''])))
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function salvarPreco(id: string) {
    setSalvandoId(id)
    await fetch('/api/catalogo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, preco: precos[id] }),
    })
    await carregar()
    setSalvandoId('')
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim()) return
    setAdicionando(true)
    await fetch('/api/catalogo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoNome, preco: novoPreco }),
    })
    setNovoNome('')
    setNovoPreco('')
    await carregar()
    setAdicionando(false)
  }

  async function excluir(id: string) {
    setSalvandoId(id)
    await fetch(`/api/catalogo?id=${id}`, { method: 'DELETE' })
    await carregar()
    setSalvandoId('')
  }

  if (carregando) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={15} className="animate-spin" /> Carregando catalogo...</div>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {produtos.map(p => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-md border border-[#d7ad68]/25 bg-white/70 p-3">
            <div className="min-w-[180px] flex-1">
              <p className="font-medium text-[#11231f]">{p.nome}</p>
              <p className="text-xs text-muted-foreground">Preco atual: {formatBRL(p.preco)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={precos[p.id] ?? ''}
                onChange={e => setPrecos(prev => ({ ...prev, [p.id]: e.target.value }))}
                className="h-9 w-32"
              />
              <Button size="icon-sm" className="bg-[#0b3b31] text-[#f4d59a]" title="Salvar preco" disabled={salvandoId === p.id} onClick={() => salvarPreco(p.id)}>
                {salvandoId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </Button>
              <Button size="icon-sm" variant="ghost" className="text-red-600" title="Excluir produto" disabled={salvandoId === p.id} onClick={() => excluir(p.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={adicionar} className="rounded-md border border-dashed border-[#d7ad68]/40 bg-white/50 p-3">
        <p className="mb-2 text-sm font-medium text-[#0b3b31]">Adicionar novo produto</p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Nome do produto</Label>
            <Input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Ex: Mentoria Premium" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Preco (R$)</Label>
            <Input type="number" step="0.01" value={novoPreco} onChange={e => setNovoPreco(e.target.value)} placeholder="0,00" className="h-9 w-32" />
          </div>
          <Button type="submit" disabled={adicionando || !novoNome.trim()} className="h-9 bg-[#0b3b31] text-[#f4d59a]">
            <Plus size={15} /> Adicionar
          </Button>
        </div>
      </form>
    </div>
  )
}
