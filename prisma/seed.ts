import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const programas = [
    { nome: 'LATAM Pass', companhia: 'LATAM Airlines', cor: '#e3373c' },
    { nome: 'Smiles', companhia: 'GOL Linhas Aéreas', cor: '#f97316' },
    { nome: 'TudoAzul', companhia: 'Azul Linhas Aéreas', cor: '#2563eb' },
    { nome: 'Livelo', companhia: 'Livelo', cor: '#8b5cf6' },
    { nome: 'Outro', companhia: 'Outros', cor: '#6b7280' },
  ]

  for (const programa of programas) {
    const existing = await prisma.programa.findFirst({
      where: { nome: programa.nome },
    })

    if (existing) {
      await prisma.programa.update({
        where: { id: existing.id },
        data: programa,
      })
      continue
    }

    await prisma.programa.create({ data: programa })
  }

  console.log('Programas de fidelidade sincronizados.')
}

main().finally(() => prisma.$disconnect())
