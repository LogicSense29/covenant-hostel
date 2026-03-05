import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prismaClientSingleton = () => {
  if (typeof window !== "undefined") return new PrismaClient();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString === "") {
    // In build environments where DATABASE_URL is missing, return a base client.
    // This prevents the adapter from trying to initialize a pool with undefined.
    return new PrismaClient();
  }

  try {
    const pool = new pg.Pool({ 
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error("Prisma Initialization Error (Build-time safe):", error.message);
    return new PrismaClient();
  }
};

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;