'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [telefone, setTelefone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password, telefone }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? 'Erro ao criar conta.')
      }

      // Quando nao e o primeiro usuario, a conta fica pendente de aprovacao do CEO
      if (data.autorizado === false) {
        setPending(true)
        setLoading(false)
        return
      }

      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        throw new Error('Conta criada, mas nao foi possivel entrar automaticamente. Tente entrar pelo login.')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.')
      setLoading(false)
    }
  }

  if (pending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#061411] p-4">
        <Card className="w-full max-w-md border-[#d7ad68]/25 bg-[#fffcf5] shadow-2xl">
          <CardHeader>
            <CardTitle>Conta criada - aguardando aprovacao</CardTitle>
            <CardDescription>
              Sua conta foi registrada e esta na fila de aprovacao do CEO. Voce podera entrar assim que o acesso for autorizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]">Voltar para o login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#061411] p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-4 size-24 overflow-hidden rounded-full border border-[#d7ad68]/70 bg-black">
            <Image src="/atlas-beyond-destinations.png" alt="Atlas Beyond Destinations" fill sizes="96px" className="object-cover" priority />
          </div>
          <h1 className="atlas-wordmark text-3xl font-semibold text-[#f4d59a]">ATLAS</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.26em] text-[#d7ad68]">Beyond Destinations</p>
        </div>

        <Card className="border-[#d7ad68]/25 bg-[#fffcf5] shadow-2xl">
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
            <CardDescription>Acesso Atlas para colaboradores e gestores autorizados.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCadastro} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" type="tel" placeholder="(21) 99999-9999" value={telefone} onChange={e => setTelefone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="Minimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              {error && <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</p>}
              <Button type="submit" className="h-10 w-full bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]" disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Ja tem conta?{' '}
              <Link href="/login" className="font-medium text-[#0b3b31] hover:underline">Entrar</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
