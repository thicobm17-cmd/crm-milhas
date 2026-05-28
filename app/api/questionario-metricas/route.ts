import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function readBody(request: NextRequest) {
  const text = await request.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

function cleanText(value: unknown, fallback = '') {
  return String(value || fallback).trim().slice(0, 255)
}

export async function POST(request: NextRequest) {
  const body = await readBody(request)
  const sessionId = cleanText(body.sessionId)
  const eventType = cleanText(body.eventType)

  if (!sessionId || !eventType) {
    return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 })
  }

  const stepIndex = Number.isFinite(Number(body.stepIndex)) ? Number(body.stepIndex) : null

  await prisma.questionarioEvento.create({
    data: {
      sessionId,
      eventType,
      stepIndex,
      stepLabel: cleanText(body.stepLabel) || null,
      path: cleanText(body.path) || null,
      userAgent: cleanText(request.headers.get('user-agent')) || null,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const eventos = await prisma.questionarioEvento.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return NextResponse.json(eventos)
}
