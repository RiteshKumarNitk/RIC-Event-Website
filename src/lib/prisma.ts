import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from '@prisma/adapter-neon';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  // PrismaNeonHttp uses HTTP (fetch) — correct adapter for Node.js server environments.
  // PrismaNeon (WebSocket Pool) is only for Edge runtimes and causes hanging in Node.js.
  const adapter = new PrismaNeonHttp(connectionString, {});
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
