'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Loader2, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react'

interface BackupItem {
  id: string
  reason: string
  status: string
  sizeBytes: number
  createdAt: string | Date
  recordCounts: unknown
}

interface Props {
  backups: BackupItem[]
  souCEO: boolean
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function countTotal(recordCounts: unknown) {
  if (!recordCounts || typeof recordCounts !== 'object') return 0
  return Object.values(recordCounts as Record<string, number>).reduce((acc, value) => acc + (Number(value) || 0), 0)
}

export function BackupPanel({ backups, souCEO }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [message, setMessage] = useState('')

  async function criarBackup() {
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/backups', { method: 'POST' })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setMessage(data?.error || 'Nao foi possivel gerar backup.')
      return
    }
    setMessage('Backup criado com sucesso.')
    router.refresh()
  }

  async function excluirBackup(id: string) {
    setDeletingId(id)
    await fetch(`/api/backups/${id}`, { method: 'DELETE' })
    setDeletingId('')
    router.refresh()
  }

  if (!souCEO) {
    return <p className="text-sm text-muted-foreground">Apenas o CEO pode gerar e baixar backups completos.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 text-[#0b3b31]" size={18} />
          <div>
            <p className="text-sm font-medium text-[#11231f]">Backup automatico ativo</p>
            <p className="text-xs text-muted-foreground">
              O Railway cria snapshots no startup e tenta manter um backup novo a cada 24h. As fotos dos clientes entram junto porque ficam no banco.
            </p>
          </div>
        </div>
        <Button type="button" disabled={loading} onClick={criarBackup} className="bg-[#0b3b31] text-[#f4d59a]">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCcw size={15} />}
          Gerar backup agora
        </Button>
      </div>

      {message && <p className="rounded-md bg-[#f7ead2] p-2 text-sm text-[#0b3b31]">{message}</p>}

      <div className="space-y-2">
        {backups.length === 0 ? (
          <p className="rounded-md border border-dashed border-[#d7ad68]/40 bg-white/55 p-3 text-sm text-muted-foreground">
            Nenhum backup salvo ainda. Clique em &quot;Gerar backup agora&quot; para criar o primeiro imediatamente.
          </p>
        ) : backups.map((backup) => (
          <div key={backup.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#d7ad68]/25 bg-white/70 p-2.5">
            <div>
              <p className="text-sm font-medium text-[#11231f]">{formatDate(backup.createdAt)}</p>
              <p className="text-xs text-muted-foreground">
                {backup.reason} - {countTotal(backup.recordCounts)} registros - {formatBytes(backup.sizeBytes)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800">{backup.status}</Badge>
              <a href={`/api/backups/${backup.id}`} target="_blank" rel="noreferrer">
                <Button type="button" size="icon-sm" variant="outline" title="Baixar JSON">
                  <Download size={14} />
                </Button>
              </a>
              <Button type="button" size="icon-sm" variant="ghost" className="text-red-600" disabled={deletingId === backup.id} onClick={() => excluirBackup(backup.id)}>
                {deletingId === backup.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
