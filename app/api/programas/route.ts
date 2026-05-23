import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const programas = await prisma.programa.findMany({ orderBy: { id: 'asc' } })
  return NextResponse.json(programas)
}
