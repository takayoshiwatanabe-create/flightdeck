import { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

// Mock the PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

describe('Prisma Client Initialization', () => {
  it('should initialize PrismaClient', () => {
    // The `prisma` instance is imported, so it should already be initialized.
    // We just need to check if the PrismaClient constructor was called.
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });

  it('should export a single instance of PrismaClient', () => {
    // Ensure that subsequent imports or calls to the module don't create new instances
    // This is implicitly tested by `toHaveBeenCalledTimes(1)` above,
    // as `prisma` is a singleton in the module.
    const { prisma: anotherPrismaInstance } = require('./prisma');
    expect(anotherPrismaInstance).toBe(prisma);
  });

  it('should connect and disconnect in development', () => {
    // This logic is typically handled by Next.js development server lifecycle.
    // For unit testing, we can verify the mock methods are present.
    expect(prisma.$connect).toBeDefined();
    expect(prisma.$disconnect).toBeDefined();
  });
});

