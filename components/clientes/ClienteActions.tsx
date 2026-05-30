'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Clipboard, ImageIcon, Pencil, Power, Trash2, Upload, X } from 'lucide-react'

interface ProdutoCatalogo { id: string; nome: string; preco: number }

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
  fotoUrl: string | null
  ativo: boolean
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Nao foi possivel ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Imagem invalida.'))
    img.src = src
  })
}

async function compressProfileImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Envie apenas arquivos de imagem.')
  }

  const dataUrl = await readFileAsDataUrl(file)
  const img = await loadImage(dataUrl)
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Nao foi possivel processar a imagem.')

  const sourceSize = Math.min(img.width, img.height)
  const sx = (img.width - sourceSize) / 2
  const sy = (img.height - sourceSize) / 2
  ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size)

  return canvas.toDataURL('image/jpeg', 0.82)
}

export function ClienteActions({ cliente }: { cliente: ClienteData }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    fetch('/api/catalogo', { cache: 'no-store' }).then(r => r.json()).then(setProdutos).catch(() => setProdutos([]))
  }, [])

  const [form, setForm] = useState({
    nome: cliente.nome,
    email: cliente.email ?? '',
    telefone: cliente.telefone ?? '',
    cpf: cliente.cpf ?? '',
    dataNascimento: cliente.dataNascimento ?? '',
    produtoContratado: cliente.produtoContratado ?? '',
    valorProduto: cliente.metaEconomia ? String(cliente.metaEconomia) : '',
    valorModo: 'outro',
    observacoes: cliente.observacoes ?? '',
    fotoUrl: cliente.fotoUrl ?? '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function selecionarProduto(nome: string) {
    const produto = produtos.find(p => p.nome === nome)
    setForm(prev => ({
      ...prev,
      produtoContratado: nome,
      valorModo: produto && produto.preco > 0 ? 'catalogo' : 'outro',
      valorProduto: produto && produto.preco > 0 ? String(produto.preco) : '',
    }))
  }

  function selecionarValor(modo: string) {
    const produto = produtos.find(p => p.nome === form.produtoContratado)
    setForm(prev => ({
      ...prev,
      valorModo: modo,
      valorProduto: modo === 'catalogo' && produto && produto.preco > 0 ? String(produto.preco) : '',
    }))
  }

  async function usarArquivo(file: File | null | undefined) {
    if (!file) return
    setError('')
    try {
      const fotoUrl = await compressProfileImage(file)
      setForm(prev => ({ ...prev, fotoUrl }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel usar essa imagem.')
    }
  }

  async function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (!item) return
    e.preventDefault()
    await usarArquivo(item.getAsFile())
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
          <form onSubmit={salvarEdicao} onPaste={handlePaste} className="mt-2 space-y-4">
            <div className="rounded-lg border border-dashed border-[#d7ad68]/45 bg-white/55 p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border border-[#d7ad68]/50 bg-[#0b3b31] text-lg font-semibold text-[#f4d59a]">
                  {form.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.fotoUrl} alt={`Foto de ${form.nome}`} className="size-full object-cover" />
                  ) : (
                    getInitials(form.nome || cliente.nome)
                  )}
                </div>
                <div className="min-w-[190px] flex-1">
                  <p className="text-sm font-medium text-[#11231f]">Foto do cliente</p>
                  <p className="text-xs text-muted-foreground">Cole com Ctrl+V ou anexe uma imagem. Ela sera compactada automaticamente.</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => usarArquivo(e.target.files?.[0])}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} /> Anexar
                  </Button>
                  <Button type="button" size="icon-sm" variant="outline" title="Cole uma imagem com Ctrl+V dentro deste modal">
                    <Clipboard size={14} />
                  </Button>
                  {form.fotoUrl && (
                    <Button type="button" size="icon-sm" variant="ghost" className="text-red-600" title="Remover foto" onClick={() => update('fotoUrl', '')}>
                      <X size={14} />
                    </Button>
                  )}
                </div>
              </div>
              {!form.fotoUrl && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-[#f7ead2]/70 p-2 text-xs text-[#8f7040]">
                  <ImageIcon size={14} /> Dica: copie um print ou foto e pressione Ctrl+V com este modal aberto.
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={form.nome} onChange={e => update('nome', e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <Label>Valor investido</Label>
                <Select value={form.valorModo} onValueChange={v => selecionarValor(v ?? 'outro')}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {produtos.find(p => p.nome === form.produtoContratado)?.preco ? (
                      <SelectItem value="catalogo">Valor cadastrado - {formatMoney(produtos.find(p => p.nome === form.produtoContratado)!.preco)}</SelectItem>
                    ) : null}
                    <SelectItem value="outro">Outro valor / desconto</SelectItem>
                  </SelectContent>
                </Select>
                {form.valorModo === 'outro' ? (
                  <Input type="number" step="0.01" placeholder="Digite o valor negociado" value={form.valorProduto} onChange={e => update('valorProduto', e.target.value)} />
                ) : (
                  <Input readOnly value={produtos.find(p => p.nome === form.produtoContratado)?.preco ? formatMoney(produtos.find(p => p.nome === form.produtoContratado)!.preco) : 'Sem valor cadastrado'} />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Produto contratado</Label>
              <Select value={form.produtoContratado} onValueChange={v => selecionarProduto(v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>
                  {produtos.map(p => (
                    <SelectItem key={p.id} value={p.nome}>
                      {p.nome}{p.preco > 0 ? ` - ${formatMoney(p.preco)}` : ''}
                    </SelectItem>
                  ))}
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
