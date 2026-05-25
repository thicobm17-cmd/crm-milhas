'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface ProdutoCatalogo { id: string; nome: string; preco: number }

export default function NovoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([])
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    dataNascimento: '',
    produtoContratado: '',
    valorProduto: '',
    mesesAcesso: '12',
    observacoes: '',
  })

  useEffect(() => {
    fetch('/api/catalogo', { cache: 'no-store' }).then(r => r.json()).then(setProdutos).catch(() => setProdutos([]))
  }, [])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Ao escolher um produto, preenche o valor investido com o preco do catalogo
  function selecionarProduto(nome: string) {
    const produto = produtos.find(p => p.nome === nome)
    setForm(prev => ({
      ...prev,
      produtoContratado: nome,
      valorProduto: produto && produto.preco > 0 ? String(produto.preco) : prev.valorProduto,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar cliente.')

      router.push(`/clientes/${data.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cliente.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/clientes">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} /> Voltar</Button>
        </Link>
        <div>
          <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Cliente Atlas</p>
          <h1 className="text-3xl font-semibold text-[#11231f]">Novo cliente</h1>
        </div>
      </div>

      <Card className="atlas-panel">
        <CardHeader><CardTitle>Dados do cliente e produto</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={e => update('nome', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefone / WhatsApp</Label>
                <Input type="tel" placeholder="(21) 99999-9999" value={form.telefone} onChange={e => update('telefone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input placeholder="000.000.000-00" value={form.cpf} onChange={e => update('cpf', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data de nascimento</Label>
                <Input type="date" value={form.dataNascimento} onChange={e => update('dataNascimento', e.target.value)} />
              </div>
            </div>

            <div className="border-t border-[#d7ad68]/25 pt-5">
              <h3 className="mb-4 font-medium text-[#0b3b31]">Produto escolhido</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Produto contratado</Label>
                  <Select value={form.produtoContratado} onValueChange={v => selecionarProduto(v ?? '')}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                    <SelectContent>
                      {produtos.map(product => (
                        <SelectItem key={product.id} value={product.nome}>
                          {product.nome}{product.preco > 0 ? ` — ${product.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Gerencie produtos e precos em Configuracoes.</p>
                </div>
                <div className="space-y-2">
                  <Label>Valor pago/investido no produto (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00" value={form.valorProduto} onChange={e => update('valorProduto', e.target.value)} />
                  <p className="text-xs text-muted-foreground">Vira a meta de economia do cliente e entra como receita no Financeiro.</p>
                </div>
                <div className="space-y-2">
                  <Label>Duracao do plano</Label>
                  <Select value={form.mesesAcesso} onValueChange={v => update('mesesAcesso', v ?? '12')}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 meses (anual)</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="24">24 meses</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Define quando o acesso do cliente vence.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Textarea placeholder="Preferencias de voo, programas prioritarios, observacoes da call..." value={form.observacoes} onChange={e => update('observacoes', e.target.value)} rows={3} />
            </div>

            {error && <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]">
                {loading ? 'Salvando...' : 'Salvar cliente'}
              </Button>
              <Link href="/clientes"><Button type="button" variant="outline">Cancelar</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
