import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', {
      next: { revalidate: 1800 },
    })

    if (!response.ok) throw new Error('Cotacao indisponivel')
    const data = await response.json()
    const value = Number(data?.USDBRL?.bid)
    if (!Number.isFinite(value) || value <= 0) throw new Error('Cotacao invalida')

    return NextResponse.json({
      cotacao: Number(value.toFixed(4)),
      fonte: 'AwesomeAPI USD-BRL',
      atualizadoEm: data?.USDBRL?.create_date || new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: 'Nao foi possivel buscar a cotacao do dolar agora.' },
      { status: 503 },
    )
  }
}
