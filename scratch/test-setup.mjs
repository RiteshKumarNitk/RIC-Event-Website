import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Find events
  const events = await prisma.event.findMany({
    select: { id: true, name: true, date: true, venue: true, showtimes: true },
  });
  console.log("\n=== EVENTS ===");
  events.forEach(e => console.log(`${e.id} | ${e.name} | ${e.venue} | ${e.date}`));

  // Find members
  const members = await prisma.member.findMany({
    select: { memberId: true, name: true, email: true, password: true, userId: true },
  });
  console.log("\n=== MEMBERS ===");
  members.forEach(m => console.log(`ID: ${m.memberId} | ${m.name} | ${m.email} | HasPassword: ${!!m.password} | LinkedUser: ${m.userId || 'none'}`));

  // Set a password for member 1 if not already set
  const member1 = members.find(m => m.memberId === 1);
  if (member1 && !member1.password) {
    const hashed = await bcrypt.hash('test123', 10);
    await prisma.member.update({
      where: { memberId: 1 },
      data: { password: hashed },
    });
    console.log("\n✅ Set password 'test123' for member 1 (Dr. Gurdial Singh Sandhu)");
  } else if (member1) {
    console.log("\n✅ Member 1 already has a password set");
  }

  // Also set passwords for other test members
  for (const m of members) {
    if (!m.password) {
      const hashed = await bcrypt.hash('test123', 10);
      await prisma.member.update({
        where: { memberId: m.memberId },
        data: { password: hashed },
      });
      console.log(`✅ Set password 'test123' for member ${m.memberId} (${m.name})`);
    }
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
