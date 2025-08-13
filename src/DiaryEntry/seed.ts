import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function seed() {
  const reasons = [
    'Trabalho',
    'Família',
    'Relacionamento',
    'Estudos',
    'Saúde',
    'Financeiro',
    'Amizades',
    'Outro',
  ];

  for (const reason of reasons) {
    const exists = await prisma.reasonEmotion.findUnique({ where: { reason } });
    if (!exists) {
      await prisma.reasonEmotion.create({ data: { reason } });
    }
  }

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('Erro ao executar seed:', err);
  prisma.$disconnect();
});
