import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import seatingChart from '@/lib/seating-chart-config.json';

const prisma = new PrismaClient();

const now = new Date();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.booking.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🗑️  Cleared existing data');

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin RIC',
      email: 'admin@ricjaipur.org',
      emailVerified: now,
      password: hashedPassword,
      role: 'ADMIN',
      image: 'https://picsum.photos/seed/admin/200/200',
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@email.com',
        emailVerified: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        password: hashedPassword,
        role: 'USER',
        image: 'https://picsum.photos/seed/user1/200/200',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        emailVerified: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        password: hashedPassword,
        role: 'USER',
        image: 'https://picsum.photos/seed/user2/200/200',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Amit Singh',
        email: 'amit.singh@email.com',
        emailVerified: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
        password: hashedPassword,
        role: 'USER',
        image: 'https://picsum.photos/seed/user3/200/200',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sneha Patel',
        email: 'sneha.patel@email.com',
        emailVerified: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        password: hashedPassword,
        role: 'USER',
        image: 'https://picsum.photos/seed/user4/200/200',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Vikram Mehta',
        email: 'vikram.mehta@email.com',
        password: hashedPassword,
        role: 'USER',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length + 1} users`);

  // Create Events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        name: 'Starlight Symphony Orchestra',
        description: 'An enchanting evening with the Starlight Symphony Orchestra, performing timeless classics under the stars. A must-see for music lovers.\n\nThe orchestra will feature works by Mozart, Beethoven, and Tchaikovsky, conducted by the renowned Maestro Arjun Verma. Special guest soloist: violinist Ananya Desai.',
        category: 'Music',
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        location: 'Jaipur, Rajasthan',
        venue: 'RIC Auditorium',
        image: 'https://picsum.photos/seed/event1/600/400',
        showtimes: ['19:00', '21:30'],
        ticketTypes: JSON.parse(JSON.stringify([{ type: 'VIP', price: 999 }, { type: 'Standard', price: 299 }, { type: 'Balcony', price: 149 }])),
        seatingChart: seatingChart as any,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Tech Visionaries Summit 2024',
        description: 'Join industry leaders and innovators for a day of insightful talks on the future of technology, AI, and sustainability. Keynote speakers from top tech companies will share their vision for the next decade.',
        category: 'Seminar',
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        location: 'Jaipur, Rajasthan',
        venue: 'Convention Hall',
        image: 'https://picsum.photos/seed/event2/600/400',
        showtimes: ['09:00', '11:00', '14:00', '16:00'],
        ticketTypes: JSON.parse(JSON.stringify([{ type: 'Standard', price: 99 }])),
        seatingChart: seatingChart as any,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Abstract Realities: A Modern Art Exhibit',
        description: 'Explore the vibrant and thought-provoking world of modern abstract art from renowned artists across the globe. This exhibition features over 100 pieces from 25 international artists.',
        category: 'Art',
        date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        location: 'Jaipur, Rajasthan',
        venue: 'Art Gallery',
        image: 'https://picsum.photos/seed/event3/600/400',
        showtimes: ['10:00 - 18:00'],
        ticketTypes: JSON.parse(JSON.stringify([{ type: 'Standard', price: 0 }])),
      },
    }),
    prisma.event.create({
      data: {
        name: 'Hamlet: A Contemporary Tragedy',
        description: "Experience Shakespeare's masterpiece like never before in this gripping, modern-day adaptation of the classic tragedy. Directed by award-winning director Kavita Rao.",
        category: 'Theater',
        date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        location: 'Jaipur, Rajasthan',
        venue: 'Main Auditorium',
        image: 'https://picsum.photos/seed/event4/600/400',
        showtimes: ['20:00'],
        ticketTypes: JSON.parse(JSON.stringify([{ type: 'VIP', price: 1499 }, { type: 'Standard', price: 499 }])),
        seatingChart: seatingChart as any,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Global Rhythms: A Cultural Dance Festival',
        description: 'Celebrate the diversity of world cultures through the universal language of dance. Featuring troupes from five continents performing traditional and contemporary dance forms.',
        category: 'Cultural',
        date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        location: 'Jaipur, Rajasthan',
        venue: 'Open Air Theatre',
        image: 'https://picsum.photos/seed/event5/600/400',
        showtimes: ['18:30'],
        ticketTypes: JSON.parse(JSON.stringify([{ type: 'Standard', price: 199 }])),
        seatingChart: seatingChart as any,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Rajasthan Heritage Cricket Tournament',
        description: 'Watch the best local cricket teams compete in an exciting T20 tournament. Featuring 12 teams from across Rajasthan competing for the prestigious RIC Heritage Cup.',
        category: 'Sports',
        date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        location: 'Jaipur, Rajasthan',
        venue: 'RIC Sports Ground',
        image: 'https://picsum.photos/seed/event6/600/400',
        showtimes: ['09:00', '14:00'],
        ticketTypes: JSON.parse(JSON.stringify([{ type: 'Pavilion', price: 599 }, { type: 'General', price: 99 }])),
      },
    }),
    prisma.event.create({
      data: {
        name: 'AI & The Future of Work - Panel Discussion',
        description: 'A thought-provoking panel discussion on how artificial intelligence is reshaping industries, creating new opportunities, and challenging traditional work paradigms.',
        category: 'Talk',
        date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        location: 'Jaipur, Rajasthan',
        venue: 'Seminar Hall B',
        image: 'https://picsum.photos/seed/event7/600/400',
        showtimes: ['15:00', '17:00'],
        ticketTypes: JSON.parse(JSON.stringify([{ type: 'Standard', price: 0 }])),
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);

  // Create Members
  const members = await Promise.all([
    prisma.member.create({
      data: {
        memberId: 1,
        categoryType: 'Individual',
        categoryAcronym: 'IND',
        doa: new Date('2023-01-15'),
        name: 'Dr. Gurdial Singh Sandhu',
        phone: '+91 9876543210',
        email: 'gurdial.sandhu@email.com',
        dob: new Date('1965-03-20'),
        address: '42, MI Road, Jaipur, Rajasthan 302001',
        emergencyContact: '+91 9876543211',
      },
    }),
    prisma.member.create({
      data: {
        memberId: 2,
        categoryType: 'Corporate',
        categoryAcronym: 'CORP',
        doa: new Date('2023-02-10'),
        name: 'Asha Sharma',
        phone: '+91 8765432109',
        email: 'asha.sharma@corp.com',
        dob: new Date('1980-08-15'),
        address: '15, Tonk Road, Jaipur, Rajasthan 302015',
        emergencyContact: '+91 8765432108',
      },
    }),
    prisma.member.create({
      data: {
        memberId: 3,
        categoryType: 'Student',
        categoryAcronym: 'STU',
        doa: new Date('2023-03-05'),
        name: 'Rohan Verma',
        phone: '+91 7654321098',
        email: 'rohan.verma@univ.edu',
        dob: new Date('2000-11-10'),
        address: 'Hostel Block C, University of Rajasthan, Jaipur 302004',
        emergencyContact: '+91 7654321097',
      },
    }),
    prisma.member.create({
      data: {
        memberId: 4,
        categoryType: 'Senior Citizen',
        categoryAcronym: 'SEN',
        doa: new Date('2022-11-20'),
        name: 'Sunita Agarwal',
        phone: '+91 6543210987',
        email: 'sunita.agarwal@email.com',
        dob: new Date('1950-02-25'),
        address: '78, Malviya Nagar, Jaipur, Rajasthan 302017',
        emergencyContact: '+91 6543210986',
      },
    }),
    prisma.member.create({
      data: {
        memberId: 5,
        categoryType: 'Individual',
        categoryAcronym: 'IND',
        doa: new Date('2023-05-12'),
        name: 'Karan Malhotra',
        phone: '+91 5432109876',
        email: 'karan.malhotra@email.com',
        dob: new Date('1992-07-30'),
        address: '23, Vaishali Nagar, Jaipur, Rajasthan 302021',
        emergencyContact: '+91 5432109875',
      },
    }),
    prisma.member.create({
      data: {
        memberId: 6,
        categoryType: 'Corporate',
        categoryAcronym: 'CORP',
        doa: new Date('2023-06-01'),
        name: 'Meera Joshi',
        phone: '+91 4321098765',
        email: 'meera.joshi@techcorp.com',
        dob: new Date('1988-04-18'),
        address: 'Tech Park, Sitapura, Jaipur, Rajasthan 302022',
        emergencyContact: '+91 4321098764',
      },
    }),
    prisma.member.create({
      data: {
        memberId: 7,
        categoryType: 'Student',
        categoryAcronym: 'STU',
        doa: new Date('2024-01-10'),
        name: 'Ananya Gupta',
        phone: '+91 3210987654',
        email: 'ananya.gupta@stu.edu',
        dob: new Date('2002-09-05'),
        address: 'NIT Hostel, Jaipur, Rajasthan 302017',
        emergencyContact: '+91 3210987653',
      },
    }),
  ]);

  console.log(`✅ Created ${members.length} members`);

  // Create Bookings
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        userId: users[0].id,
        eventId: events[0].id,
        eventName: events[0].name,
        eventDate: events[0].date,
        attendees: JSON.parse(JSON.stringify([
          { seatId: 'balcony-left-N-1', price: 149, attendeeName: 'Rajesh Kumar', memberId: '1', isMember: true, memberIdVerified: true },
          { seatId: 'balcony-left-N-2', price: 149, attendeeName: 'Guest 1', memberId: '', isMember: false, memberIdVerified: true },
        ])),
        total: 149,
        bookingDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.booking.create({
      data: {
        userId: users[1].id,
        eventId: events[0].id,
        eventName: events[0].name,
        eventDate: events[0].date,
        attendees: JSON.parse(JSON.stringify([
          { seatId: 'middle-center-H-5', price: 299, attendeeName: 'Priya Sharma', memberId: '', isMember: false, memberIdVerified: true },
        ])),
        total: 299,
        bookingDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.booking.create({
      data: {
        userId: users[2].id,
        eventId: events[1].id,
        eventName: events[1].name,
        eventDate: events[1].date,
        attendees: JSON.parse(JSON.stringify([
          { seatId: 'premium-front-A-1', price: 99, attendeeName: 'Amit Singh', memberId: '2', isMember: true, memberIdVerified: true },
          { seatId: 'premium-front-A-2', price: 99, attendeeName: 'Colleague 1', memberId: '3', isMember: true, memberIdVerified: true },
          { seatId: 'premium-front-A-3', price: 99, attendeeName: 'Colleague 2', memberId: '', isMember: false, memberIdVerified: true },
        ])),
        total: 99,
        bookingDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.booking.create({
      data: {
        userId: users[0].id,
        eventId: events[3].id,
        eventName: events[3].name,
        eventDate: events[3].date,
        attendees: JSON.parse(JSON.stringify([
          { seatId: 'middle-left-E-1', price: 499, attendeeName: 'Rajesh Kumar', memberId: '', isMember: false, memberIdVerified: true },
          { seatId: 'middle-left-E-2', price: 499, attendeeName: 'Partner', memberId: '', isMember: false, memberIdVerified: true },
        ])),
        total: 998,
        bookingDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.booking.create({
      data: {
        userId: users[3].id,
        eventId: events[4].id,
        eventName: events[4].name,
        eventDate: events[4].date,
        attendees: JSON.parse(JSON.stringify([
          { seatId: 'premium-center-B-10', price: 199, attendeeName: 'Sneha Patel', memberId: '5', isMember: true, memberIdVerified: true },
        ])),
        total: 0,
        bookingDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.booking.create({
      data: {
        userId: users[4].id,
        eventId: events[5].id,
        eventName: events[5].name,
        eventDate: events[5].date,
        attendees: JSON.parse(JSON.stringify([
          { seatId: 'GA-1', price: 99, attendeeName: 'Vikram Mehta', memberId: '', isMember: false, memberIdVerified: true },
          { seatId: 'GA-2', price: 99, attendeeName: 'Friend 1', memberId: '', isMember: false, memberIdVerified: true },
          { seatId: 'GA-3', price: 99, attendeeName: 'Friend 2', memberId: '', isMember: false, memberIdVerified: true },
          { seatId: 'GA-4', price: 99, attendeeName: 'Friend 3', memberId: '', isMember: false, memberIdVerified: true },
        ])),
        total: 396,
        bookingDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`✅ Created ${bookings.length} bookings`);

  // Summary
  const stats = {
    users: await prisma.user.count(),
    events: await prisma.event.count(),
    members: await prisma.member.count(),
    bookings: await prisma.booking.count(),
  };

  console.log('\n📊 Seed Summary:');
  console.log(`   Users: ${stats.users}`);
  console.log(`   Events: ${stats.events}`);
  console.log(`   Members: ${stats.members}`);
  console.log(`   Bookings: ${stats.bookings}`);
  console.log('\n🔐 Default admin credentials:');
  console.log('   Email: admin@ricjaipur.org');
  console.log('   Password: password123');
  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
