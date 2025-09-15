/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@example.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Seed: demo user already exists');
    return;
  }

  const password = await argon2.hash('P@ssw0rd!');
  const user = await prisma.user.create({
    data: {
      email,
      username: 'demo',
      password,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          name: 'Demo User',
        },
      },
    },
    include: { profile: true },
  });

  console.log('Seed: created demo user', { id: user.id, email: user.email });
}

main()
  .catch((e) => {
    console.error('Seed error', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
