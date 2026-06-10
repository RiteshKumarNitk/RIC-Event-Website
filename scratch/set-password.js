require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHttp } = require('@prisma/adapter-neon');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaNeonHttp(connectionString, {});
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashed = await bcrypt.hash('test123', 10);
  
  const member = await prisma.member.update({
    where: { memberId: 1 },
    data: { password: hashed },
  });
  console.log('Password set for:', member.name);
  
  const events = await prisma.event.findMany({
    select: { id: true, name: true, venue: true, showtimes: true },
    take: 5,
  });
  console.log('\nEvents:');
  events.forEach(e => console.log(`${e.id} | ${e.name} | ${e.venue} | ${JSON.stringify(e.showtimes)}`));
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
