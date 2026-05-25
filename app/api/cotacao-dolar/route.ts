import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type CotacaoResult = {
  cotacao: number
  fonte: string
  atualizadoEm: string
}

function assertCotacao(value: number) {
  if (!Number.isFinite(value) || value <= 0) throw new Error('Cotacao invalida')
  return Number(value.toFixed(4))
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Fonte indisponivel: ${url}`)
  return response.json()
}

async function awesomeApi(): Promise<CotacaoResult> {
  const data = await fetchJson('https://economia.awesomeapi.com.br/json/last/USD-BRL')
  return {
    cotacao: assertCotacao(Number(data?.USDBRL?.bid)),
    fonte: 'AwesomeAPI USD-BRL',
    atualizadoEm: data?.USDBRL?.create_date || new Date().toISOString(),
  }
}

async function openExchangeRate(): Promise<CotacaoResult> {
  const data = await fetchJson('https://open.er-api.com/v6/latest/USD')
  return {
    cotacao: assertCotacao(Number(data?.rates?.BRL)),
    fonte: 'Open Exchange Rates USD-BRL',
    atualizadoEm: data?.time_last_update_utc || new Date().toISOString(),
  }
}

async function frankfurter(): Promise<CotacaoResult> {
  const data = await fetchJson('https://api.frankfurter.app/latest?from=USD&to=BRL')
  return {
    cotacao: assertCotacao(Number(data?.rates?.BRL)),
    fonte: 'Frankfurter USD-BRL',
    atualizadoEm: data?.date || new Date().toISOString(),
  }
}

export async function GET() {
  const sources = [awesomeApi, openExchangeRate, frankfurter]

  for (const source of sources) {
    try {
      return NextResponse.json(await source())
    } catch {
      // Tenta a proxima fonte. O campo permanece editavel no front se todas falharem.
    }
  }

  return NextResponse.json(
    { error: 'Nao foi possivel buscar a cotacao do dolar agora.' },
    { status: 503 },
  )
}
