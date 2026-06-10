require('dotenv/config');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHttp } = require('@prisma/adapter-neon');
const p = new PrismaClient({ adapter: new PrismaNeonHttp(process.env.DATABASE_URL, {}) });

async function main() {
  const hash = await bcrypt.hash('test123', 10);
  await p.member.update({ where: { memberId: 555555 }, data: { password: hash } });
  console.log('Password set to: test123 for member 555555 (arun)');
  
  // Also get event IDs
  const events = await p.event.findMany({ 
    where: { venue: 'RIC Auditorium' },
    select: { id: true, name: true, showtimes: true } 
  });
  console.log('\nRIC Auditorium events:');
  events.forEach(e => console.log(`${e.id} | ${e.name} | ${JSON.stringify(e.showtimes)}`));
  
  await p.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
