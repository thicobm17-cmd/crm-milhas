import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.programa.createMany({
    data: [
      { nome: 'LATAM Pass', companhia: 'LATAM Airlines', cor: '#e3373c' },
      { nome: 'Smiles', companhia: 'GOL Linhas Aéreas', cor: '#f97316' },
      { nome: 'TudoAzul', companhia: 'Azul Linhas Aéreas', cor: '#2563eb' },
      { nome: 'Livelo', companhia: 'Livelo', cor: '#8b5cf6' },
      { nome: 'Outro', companhia: 'Outros', cor: '#6b7280' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Programas de fidelidade inseridos.')
}

main().finally(() => prisma.$disconnect())
