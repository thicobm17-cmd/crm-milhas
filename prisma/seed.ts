import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const programas = [
    { nome: 'Esfera', companhia: 'Santander', cor: '#d7ad68' },
    { nome: 'Livelo', companhia: 'Livelo', cor: '#8b5cf6' },
    { nome: 'TudoAzul', companhia: 'Azul Linhas Aereas', cor: '#2563eb' },
    { nome: 'Smiles', companhia: 'GOL Linhas Aereas', cor: '#f97316' },
    { nome: 'LATAM Pass', companhia: 'LATAM Airlines', cor: '#e3373c' },
    { nome: 'Iberia Plus', companhia: 'Iberia', cor: '#a31621' },
    { nome: 'TAP Miles&Go', companhia: 'TAP Air Portugal', cor: '#047857' },
    { nome: 'AAdvantage', companhia: 'American Airlines', cor: '#1d4ed8' },
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
