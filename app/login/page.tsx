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

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error('Email ou senha incorretos.')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#061411] p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-[#d7ad68]/25 bg-[#071713] shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="atlas-dark-panel hidden min-h-[620px] flex-col justify-between p-10 lg:flex">
          <div>
            <div className="relative mb-8 size-28 overflow-hidden rounded-full border border-[#d7ad68]/60 bg-black">
              <Image src="/atlas-beyond-destinations.png" alt="Atlas Beyond Destinations" fill sizes="112px" className="object-cover" priority />
            </div>
            <p className="atlas-kicker text-xs text-[#d7ad68]">CRM oficial</p>
            <h1 className="atlas-wordmark mt-4 text-4xl font-semibold text-[#f4d59a]">ATLAS</h1>
            <p className="mt-3 text-sm uppercase tracking-[0.28em] text-[#d7ad68]">Beyond Destinations</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {['Funil', 'Clientes', 'Viagens', 'Financeiro'].map((item) => (
              <div key={item} className="rounded-md border border-[#d7ad68]/20 bg-[#0f2d27]/70 p-3">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#fbf4e8] p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="relative size-14 overflow-hidden rounded-full border border-[#d7ad68]/70 bg-black">
              <Image src="/atlas-beyond-destinations.png" alt="Atlas Beyond Destinations" fill sizes="56px" className="object-cover" />
            </div>
            <div>
              <p className="atlas-wordmark font-semibold text-[#0b3b31]">ATLAS</p>
              <p className="text-xs uppercase tracking-[0.2em] text-[#8f7040]">Beyond Destinations</p>
            </div>
          </div>

          <Card className="border-[#d7ad68]/25 bg-[#fffcf5] shadow-none">
            <CardHeader>
              <CardTitle className="text-xl text-[#11231f]">Entrar na plataforma</CardTitle>
              <CardDescription>Gestao de milhas, viagens, vendas e renovacoes.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {error && <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</p>}
                <Button type="submit" className="h-10 w-full bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Nao tem conta?{' '}
                <Link href="/cadastro" className="font-medium text-[#0b3b31] hover:underline">
                  Solicitar acesso
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
