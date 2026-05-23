'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  gestor: { id: string; nome: string; email: string; telefone: string | null } | null
}

export function PerfilForm({ gestor }: Props) {
  const [nome, setNome] = useState(gestor?.nome ?? '')
  const [telefone, setTelefone] = useState(gestor?.telefone ?? '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, telefone }),
    })

    setSuccess(true)
    setLoading(false)
    setTimeout(() => setSuccess(false), 3000)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={gestor?.email ?? ''} disabled className="bg-slate-50" />
        <p className="text-xs text-slate-400">Email não pode ser alterado.</p>
      </div>
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input value={nome} onChange={e => setNome(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Telefone / WhatsApp</Label>
        <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar alterações'}</Button>
        {success && <span className="text-sm text-green-600">Salvo com sucesso!</span>}
      </div>
    </form>
  )
}
