'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarDays } from 'lucide-react'

const meses = [
  { value: '0', label: 'Ano inteiro' },
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Marco' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

interface Props {
  mes: number
  ano: number
}

export function PeriodoFilter({ mes, ano }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const anoAtual = new Date().getFullYear()
  const anos = [anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1].map(String)

  function aplicar(campo: 'mes' | 'ano', valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(campo, valor)
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <CalendarDays size={16} className="text-[#8f7040]" />
      <Select value={String(mes)} onValueChange={v => aplicar('mes', v ?? '0')}>
        <SelectTrigger className="h-9 w-[140px] bg-white/70"><SelectValue /></SelectTrigger>
        <SelectContent>
          {meses.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={String(ano)} onValueChange={v => aplicar('ano', v ?? String(anoAtual))}>
        <SelectTrigger className="h-9 w-[100px] bg-white/70"><SelectValue /></SelectTrigger>
        <SelectContent>
          {anos.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
