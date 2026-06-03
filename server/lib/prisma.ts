import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
} catch (e) {
  try {
    prisma = new PrismaClient({
      log: ['error']
    });
  } catch(e2) {
    console.warn("Could not initialize Prisma Client:", (e2 as any).message);
    prisma = {} as PrismaClient;
  }
}

export const checkDbConnection = async (): Promise<boolean> => {
  if (!process.env.DATABASE_URL) return false;
  try {
    if (prisma.$queryRaw) {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export default prisma;
