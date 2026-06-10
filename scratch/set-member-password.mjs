import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Set password 'test123' for member 1
  const hashed = await bcrypt.hash('test123', 10);
  
  const result = await prisma.member.update({
    where: { memberId: 1 },
    data: { password: hashed },
  });
  
  console.log(`Set password for member 1: ${result.name}`);
  
  // Verify it worked
  const check = await prisma.member.findUnique({
    where: { memberId: 1 },
    select: { memberId: true, name: true, password: true },
  });
  console.log(`Verified: ${check.name} has password: ${!!check.password}`);
  
  // Also get event IDs
  const events = await prisma.event.findMany({
    select: { id: true, name: true, venue: true },
    take: 5,
  });
  console.log('\nEvents:');
  events.forEach(e => console.log(`${e.id} | ${e.name} | ${e.venue}`));
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
