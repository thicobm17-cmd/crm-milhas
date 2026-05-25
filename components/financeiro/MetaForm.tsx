'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  mes: number
  ano: number
  valorAtual: number
  label: string
}

export function MetaForm({ mes, ano, valorAtual, label }: Props) {
  const router = useRouter()
  const [valor, setValor] = useState(valorAtual ? String(valorAtual) : '')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)

  // Ano inteiro nao permite editar meta (e a soma das mensais)
  const desabilitado = mes === 0

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (desabilitado) return
    setLoading(true)
    await fetch('/api/metas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes, ano, valor }),
    })
    setLoading(false)
    setOk(true)
    setTimeout(() => setOk(false), 2500)
    router.refresh()
  }

  return (
    <form onSubmit={salvar} className="space-y-2">
      <p className="text-sm text-[#e8d3ab]/75">Meta de faturamento — {label}</p>
      {desabilitado ? (
        <p className="text-xs text-[#e8d3ab]/60">Selecione um mes especifico para definir a meta.</p>
      ) : (
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={valor}
            onChange={e => setValor(e.target.value)}
            className="bg-white text-[#11231f] placeholder:text-slate-400"
          />
          <Button type="submit" disabled={loading} className="bg-[#d7ad68] text-[#081613] hover:bg-[#e5be7c]">
            {loading ? '...' : 'Salvar'}
          </Button>
        </div>
      )}
      {ok && <p className="text-xs text-emerald-300">Meta salva!</p>}
    </form>
  )
}
