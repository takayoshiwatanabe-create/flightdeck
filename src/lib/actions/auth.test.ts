import { signIn, signOut } from 'next-auth/react'; // Assuming next-auth/react for client-side actions
import { auth } from '@/src/auth'; // Assuming auth is for server-side session
import { login, signup, logout } from './auth';
import { prisma } from '@/src/lib/prisma';
import bcrypt from 'bcrypt';

// Mock external dependencies
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('@/src/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('@/src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (signIn as jest.Mock).mockResolvedValue({ error: null });
    (signOut as jest.Mock).mockResolvedValue(undefined);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('login', () => {
    it('should call signIn with credentials and return true on success', async () => {
      const result = await login('test@example.com', 'password123');
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      });
      expect(result).toBe(true);
    });

    it('should return false if signIn returns an error', async () => {
      (signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' });
      const result = await login('test@example.com', 'wrongpassword');
      expect(result).toBe(false);
    });

    it('should return false if signIn throws an error', async () => {
      (signIn as jest.Mock).mockRejectedValue(new Error('Network error'));
      const result = await login('test@example.com', 'password123');
      expect(result).toBe(false);
    });
  });

  describe('signup', () => {
    it('should create a new user and return true on success', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // User does not exist
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: '1', email: 'new@example.com' });

      const result = await signup('new@example.com', 'newpassword123');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'new@example.com' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          password: 'hashed_password',
          name: 'new@example.com', // Default name
          preferredLanguage: 'en', // Default language
        },
      });
      expect(result).toBe(true);
    });

    it('should return false if user already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', email: 'existing@example.com' });

      const result = await signup('existing@example.com', 'password123');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'existing@example.com' } });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return false if user creation fails', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await signup('fail@example.com', 'password123');
      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call signOut and return true', async () => {
      const result = await logout();
      expect(signOut).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if signOut throws an error', async () => {
      (signOut as jest.Mock).mockRejectedValue(new Error('Logout failed'));
      const result = await logout();
      expect(result).toBe(false);
    });
  });
});

