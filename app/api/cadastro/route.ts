import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { nome, email, password, telefone } = await request.json()
    const emailNormalizado = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!nome || !emailNormalizado || !password) {
      return NextResponse.json({ error: 'Campos obrigatorios faltando.' }, { status: 400 })
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 })
    }

    const existe = await prisma.gestor.findUnique({ where: { email: emailNormalizado } })
    if (existe) {
      return NextResponse.json({ error: 'Este email ja esta em uso.' }, { status: 400 })
    }

    const senha = await bcrypt.hash(password, 12)

    await prisma.gestor.create({
      data: {
        nome: String(nome).trim(),
        email: emailNormalizado,
        senha,
        telefone: telefone ? String(telefone).trim() : null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Este email ja esta em uso.' }, { status: 400 })
    }

    console.error('[cadastro] Erro ao criar gestor:', error)
    return NextResponse.json({ error: 'Erro interno ao criar conta.' }, { status: 500 })
  }
}
