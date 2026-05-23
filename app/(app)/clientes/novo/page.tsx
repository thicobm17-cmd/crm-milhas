'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', cpf: '',
    dataNascimento: '', feeMensal: '', feePorEmissao: '',
    metaEconomia: '', observacoes: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erro ao salvar.'); setLoading(false); return }
    router.push(`/clientes/${data.id}`)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/clientes">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" /> Voltar</Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Novo Cliente</h1>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Dados pessoais</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={e => update('nome', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefone / WhatsApp</Label>
                <Input type="tel" placeholder="(11) 99999-9999" value={form.telefone} onChange={e => update('telefone', e.target.value)} />
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

            <div className="border-t pt-5">
              <h3 className="font-medium text-slate-700 mb-4">Valores da assessoria</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fee mensal (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00" value={form.feeMensal} onChange={e => update('feeMensal', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fee por emissão (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00" value={form.feePorEmissao} onChange={e => update('feePorEmissao', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Meta de economia (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00" value={form.metaEconomia} onChange={e => update('metaEconomia', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Preferências de voo, programas prioritários..." value={form.observacoes} onChange={e => update('observacoes', e.target.value)} rows={3} />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar cliente'}</Button>
              <Link href="/clientes"><Button type="button" variant="outline">Cancelar</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
