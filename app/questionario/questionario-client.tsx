'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { publicQuizQuestions } from '@/lib/atlas-spec'

type Answers = Record<string, string>

type QuizQuestion = {
  bloco: string
  pergunta: string
  opcoes: string[]
}

const quizQuestions: QuizQuestion[] = publicQuizQuestions
const totalSteps = quizQuestions.length + 1
const whatsappUrl = 'https://wa.me/5521997334307'
const sessionStorageKey = 'atlas_questionario_session_id'

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function isValidWhatsapp(value: string) {
  const digits = onlyDigits(value)
  return digits.length >= 10 && digits.length <= 13
}

function createSessionId() {
  if (typeof window === 'undefined') return ''
  const existing = window.sessionStorage.getItem(sessionStorageKey)
  if (existing) return existing

  const id = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  window.sessionStorage.setItem(sessionStorageKey, id)
  return id
}

export default function QuestionarioPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    email: '',
    origem: 'Instagram',
    indicadoPor: '',
  })
  const sessionIdRef = useRef('')
  const stepRef = useRef(0)
  const stepLabelRef = useRef('Abertura')
  const doneRef = useRef(false)

  const progress = done ? 100 : Math.round((Math.min(step, totalSteps) / totalSteps) * 100)
  const currentQuestion = step > 0 && step <= quizQuestions.length ? quizQuestions[step - 1] : null
  const stepLabel = done
    ? 'Confirmação'
    : step === 0
      ? 'Abertura'
      : currentQuestion?.pergunta || 'Captura de contato'

  const trackQuizEvent = useCallback((eventType: string, stepIndex: number, label: string) => {
    if (typeof window === 'undefined') return

    const sessionId = sessionIdRef.current || createSessionId()
    sessionIdRef.current = sessionId

    fetch('/api/questionario-metricas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        eventType,
        stepIndex,
        stepLabel: label,
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    sessionIdRef.current = createSessionId()
    trackQuizEvent('ABRIU_LINK', 0, 'Abertura')
  }, [trackQuizEvent])

  useEffect(() => {
    stepRef.current = done ? totalSteps + 1 : step
    stepLabelRef.current = stepLabel
    doneRef.current = done

    if (!sessionIdRef.current) return

    if (done) {
      trackQuizEvent('CONFIRMOU', totalSteps + 1, 'Confirmação')
      return
    }

    trackQuizEvent(step === totalSteps ? 'CHEGOU_CAPTURA' : 'VIU_ETAPA', step, stepLabel)
  }, [done, step, stepLabel, trackQuizEvent])

  useEffect(() => {
    function handlePageHide() {
      if (!sessionIdRef.current || doneRef.current) return

      const body = JSON.stringify({
        sessionId: sessionIdRef.current,
        eventType: 'SAIU',
        stepIndex: stepRef.current,
        stepLabel: stepLabelRef.current,
        path: window.location.pathname,
      })

      if (!navigator.sendBeacon('/api/questionario-metricas', body)) {
        trackQuizEvent('SAIU', stepRef.current, stepLabelRef.current)
      }
    }

    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [trackQuizEvent])

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function goBack() {
    setError('')
    setStep((current) => Math.max(0, current - 1))
  }

  function chooseAnswer(question: QuizQuestion, value: string) {
    setError('')
    setAnswers((prev) => ({ ...prev, [question.pergunta]: value }))
    window.setTimeout(() => setStep((current) => Math.min(totalSteps, current + 1)), 160)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (!form.nome.trim()) {
      setError('Informe seu nome completo.')
      return
    }

    if (!isValidWhatsapp(form.whatsapp)) {
      setError('Informe um WhatsApp válido com DDD.')
      return
    }

    if (!isValidEmail(form.email)) {
      setError('Informe um e-mail válido.')
      return
    }

    setLoading(true)

    const respostas = [
      ...quizQuestions.map((question) => ({
        bloco: question.bloco,
        pergunta: question.pergunta,
        resposta: answers[question.pergunta] || '',
      })),
      {
        bloco: 'Contato',
        pergunta: 'Como nos conheceu',
        resposta: form.origem || 'Não informado',
      },
    ]

    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        whatsapp: form.whatsapp,
        email: form.email,
        origem: form.origem,
        indicadoPor: form.indicadoPor,
        gastoMensal: answers['Quanto você movimenta no cartão por mês, em média?'] || null,
        respostas,
      }),
    })

    setLoading(false)
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error || 'Não foi possível enviar agora. Tente novamente.')
      return
    }

    trackQuizEvent('ENVIOU_RESPOSTAS', totalSteps + 1, 'Confirmação')
    setDone(true)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#071d19] px-4 py-5 text-[#11231f] md:px-6">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(135deg,rgba(215,173,104,0.12)_0%,rgba(7,29,25,0)_34%,rgba(15,74,61,0.38)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(rgba(248,231,196,0.08)_1px,transparent_1px)] [background-size:28px_28px] opacity-30" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-3xl flex-col">
        <header className="flex items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative size-12 overflow-hidden rounded-full border border-[#d7ad68]/60 bg-black shadow-lg">
              <Image src="/atlas-beyond-destinations.png" alt="Atlas Prime - Gestão de Milhas" fill sizes="48px" className="object-cover" priority />
            </div>
            <div>
              <p className="atlas-kicker text-[0.68rem] font-semibold text-[#d7ad68]">Atlas Prime</p>
              <p className="text-xs text-[#f8e7c4]/70">Gestão de Milhas</p>
            </div>
          </div>
          {step > 0 && !done && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1 rounded-full border border-[#d7ad68]/25 px-3 py-1.5 text-xs font-medium text-[#f8e7c4]/75 transition hover:border-[#d7ad68]/55 hover:text-[#f8e7c4]"
            >
              <ArrowLeft size={13} />
              Voltar
            </button>
          )}
        </header>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#f8e7c4]/12">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#d7ad68] to-[#f4d59a] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex flex-1 items-center justify-center py-4">
          <div key={done ? 'done' : step} className="w-full animate-in fade-in slide-in-from-right-3 duration-300">
            {done ? (
              <div className="atlas-panel mx-auto max-w-xl p-6 text-center shadow-2xl md:p-8">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-[#0b3b31] text-[#f4d59a]">
                  <CheckCircle2 size={30} />
                </div>
                <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Diagnóstico solicitado</p>
                <h1 className="mt-3 text-2xl font-semibold text-[#0b3b31] md:text-3xl">Recebemos suas respostas!</h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  Em breve um especialista da Atlas envia seu diagnóstico personalizado.
                </p>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex">
                  <Button className="h-11 bg-[#0b3b31] px-5 text-[#f4d59a] hover:bg-[#12483d]">
                    <MessageCircle size={17} />
                    Falar com a Atlas no WhatsApp
                  </Button>
                </a>
              </div>
            ) : step === 0 ? (
              <div className="mx-auto max-w-2xl text-center text-[#f8e7c4]">
                <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-[#d7ad68]/25 bg-[#0f2d27]/70 px-3 py-1.5 text-xs text-[#d7ad68]">
                  Diagnóstico gratuito de viagens e milhas
                </div>
                <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
                  Quanto suas milhas valem em viagens? Descubra em 2 minutos.
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#f8e7c4]/72 md:text-base">
                  Responda 7 perguntas rápidas e receba um diagnóstico personalizado.
                </p>
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-7 h-12 rounded-lg bg-[#d7ad68] px-7 text-base font-semibold text-[#081613] hover:bg-[#e5be7c]"
                >
                  Começar diagnóstico
                  <Send size={17} />
                </Button>
              </div>
            ) : currentQuestion ? (
              <div className="atlas-panel mx-auto max-w-2xl p-5 shadow-2xl md:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Pergunta {step} de {quizQuestions.length}</p>
                  <span className="rounded-full bg-[#0b3b31]/10 px-2.5 py-1 text-xs font-medium text-[#0b3b31]">
                    {progress}%
                  </span>
                </div>
                <h2 className="text-2xl font-semibold leading-tight text-[#0b3b31] md:text-3xl">{currentQuestion.pergunta}</h2>
                <div className="mt-6 grid gap-3">
                  {currentQuestion.opcoes.map((option) => {
                    const selected = answers[currentQuestion.pergunta] === option
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => chooseAnswer(currentQuestion, option)}
                        className={[
                          'group flex min-h-14 w-full items-center justify-between rounded-lg border p-4 text-left text-base font-medium transition duration-200',
                          selected
                            ? 'border-[#0b3b31] bg-[#0b3b31] text-[#f4d59a] shadow-lg shadow-[#0b3b31]/20'
                            : 'border-[#d7ad68]/30 bg-white/70 text-[#11231f] hover:-translate-y-0.5 hover:border-[#d7ad68] hover:bg-white',
                        ].join(' ')}
                      >
                        <span>{option}</span>
                        <ChevronRight
                          size={18}
                          className={selected ? 'text-[#f4d59a]' : 'text-[#8f7040] transition group-hover:translate-x-0.5'}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="atlas-panel mx-auto max-w-2xl p-5 shadow-2xl md:p-7">
                <p className="atlas-kicker text-xs font-semibold text-[#8f7040]">Última etapa</p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#0b3b31] md:text-3xl">
                  Pronto! Seu diagnóstico está calculado. Pra onde enviamos?
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome completo</Label>
                    <Input required value={form.nome} onChange={(event) => updateForm('nome', event.target.value)} placeholder="Seu nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp com DDD</Label>
                    <Input required inputMode="tel" value={form.whatsapp} onChange={(event) => updateForm('whatsapp', event.target.value)} placeholder="(21) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input required type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="voce@email.com" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Como nos conheceu</Label>
                    <Input value={form.origem} onChange={(event) => updateForm('origem', event.target.value)} placeholder="Instagram, indicação, evento..." />
                  </div>
                </div>
                {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <Button type="submit" disabled={loading} className="mt-5 h-12 w-full rounded-lg bg-[#0b3b31] text-base font-semibold text-[#f4d59a] hover:bg-[#12483d]">
                  {loading ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
                  {loading ? 'Enviando diagnóstico...' : 'Receber meu diagnóstico'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
