import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function login(email: string, passwordPlain: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return false;
  }

  const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
  return isPasswordValid;
}

export async function signup(email: string, passwordPlain: string): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(passwordPlain, 12); // cost factor 12
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
      },
    });
    return true;
  } catch (error: unknown) {
    console.error('Signup error:', error);
    return false;
  }
}
