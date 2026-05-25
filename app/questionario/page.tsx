'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { questionnaireBlocks } from '@/lib/atlas-spec'

type Answers = Record<string, string>

const spendOptions = [
  'Ate R$3.000/mes',
  'R$3.000 a R$8.000/mes',
  'R$8.000 a R$20.000/mes',
  'Acima de R$20.000/mes',
]

export default function QuestionarioPage() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    email: '',
    origem: 'Instagram',
    indicadoPor: '',
    gastoMensal: '',
  })
  const [answers, setAnswers] = useState<Answers>({})

  const flatQuestions = useMemo(
    () => questionnaireBlocks.flatMap((block) => block.questions.map((question) => ({ block: block.title, question }))),
    []
  )

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateAnswer(question: string, value: string) {
    setAnswers((prev) => ({ ...prev, [question]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const respostas = flatQuestions.map((item) => ({
      bloco: item.block,
      pergunta: item.question,
      resposta: answers[item.question] || '',
    }))

    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, respostas }),
    })

    setLoading(false)
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error || 'Nao foi possivel enviar agora. Tente novamente.')
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#071d19] px-5 py-10 text-[#f8e7c4]">
        <section className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center text-center">
          <Image src="/atlas-beyond-destinations.png" alt="Atlas Beyond Destinations" width={128} height={128} className="mb-6 rounded-full" />
          <CheckCircle2 className="mb-4 text-[#d7ad68]" size={42} />
          <h1 className="atlas-wordmark text-3xl font-semibold">Recebemos suas respostas</h1>
          <p className="mt-3 text-sm text-[#f8e7c4]/75">
            O time Atlas vai analisar seu perfil e entrar em contato para encaixar voce no produto certo.
          </p>
          <Link href="/" className="mt-6 text-sm text-[#d7ad68] underline underline-offset-4">Voltar</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#071d19] px-4 py-8 text-[#11231f]">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 text-center text-[#f8e7c4]">
          <Image src="/atlas-beyond-destinations.png" alt="Atlas Beyond Destinations" width={118} height={118} className="mx-auto mb-4 rounded-full" />
          <p className="atlas-kicker text-xs font-semibold text-[#d7ad68]">Atlas Beyond Destinations</p>
          <h1 className="atlas-wordmark mt-2 text-3xl font-semibold">Questionario de Viagens e Milhas</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[#f8e7c4]/75">
            As respostas ajudam a definir se o melhor caminho e gestao completa, consultoria ou acompanhamento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="atlas-panel space-y-6 rounded-lg p-5 shadow-2xl md:p-7">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input required value={form.nome} onChange={(event) => update('nome', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp com DDD</Label>
              <Input required value={form.whatsapp} onChange={(event) => update('whatsapp', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Como nos conheceu</Label>
              <Input value={form.origem} onChange={(event) => update('origem', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Quem indicou</Label>
              <Input value={form.indicadoPor} onChange={(event) => update('indicadoPor', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Gasto/movimentacao mensal</Label>
              <Select value={form.gastoMensal} onValueChange={(value) => update('gastoMensal', value ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {spendOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {questionnaireBlocks.map((block) => (
            <div key={block.title} className="rounded-md border border-[#d7ad68]/25 bg-white/55 p-4">
              <h2 className="font-semibold text-[#0b3b31]">{block.title}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {block.questions.map((question) => (
                  <div key={question} className="space-y-2">
                    <Label>{question}</Label>
                    <Textarea
                      value={answers[question] || ''}
                      onChange={(event) => updateAnswer(question, event.target.value)}
                      placeholder="Conte um pouco..."
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button type="submit" disabled={loading} className="h-10 w-full bg-[#0b3b31] text-[#f4d59a] hover:bg-[#12483d]">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            {loading ? 'Enviando...' : 'Enviar respostas'}
          </Button>
        </form>
      </section>
    </main>
  )
}
