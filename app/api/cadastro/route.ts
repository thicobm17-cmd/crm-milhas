import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { nome, email, password, telefone } = await request.json()

  if (!nome || !email || !password) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })
  }

  const existe = await prisma.gestor.findUnique({ where: { email } })
  if (existe) {
    return NextResponse.json({ error: 'Este email já está em uso.' }, { status: 400 })
  }

  const senha = await bcrypt.hash(password, 12)

  await prisma.gestor.create({
    data: { nome, email, senha, telefone: telefone || null },
  })

  return NextResponse.json({ ok: true })
}
