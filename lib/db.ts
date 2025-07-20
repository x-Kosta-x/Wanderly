import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaInstance: PrismaClient | null = null

function createPrismaClient() {
  if (prismaInstance) {
    return prismaInstance
  }

  try {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
    return prismaInstance
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    throw error
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Ensure connection is established
export async function connectDB() {
  try {
    await prisma.$connect()
    console.log('Database connected successfully')
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}
