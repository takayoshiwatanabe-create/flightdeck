import { auth } from '@/src/auth';
import { prisma } from '@/src/lib/prisma';
import { fetchUserProfile, updateUserProfile } from './user';

// Mock external dependencies
jest.mock('@/src/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('@/src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('User Actions', () => {
  const mockUserId = 'user123';
  const mockUserEmail = 'test@example.com';
  const mockUserName = 'Test User';
  const mockPreferredLanguage = 'en';

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ user: { id: mockUserId, email: mockUserEmail } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: mockUserId,
      email: mockUserEmail,
      name: mockUserName,
      preferredLanguage: mockPreferredLanguage,
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: mockUserId,
      email: mockUserEmail,
      name: 'Updated User',
      preferredLanguage: 'ja',
    });
  });

  describe('fetchUserProfile', () => {
    it('should fetch user profile if authenticated', async () => {
      const profile = await fetchUserProfile();
      expect(auth).toHaveBeenCalled();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: { name: true, email: true, preferredLanguage: true },
      });
      expect(profile).toEqual({
        name: mockUserName,
        email: mockUserEmail,
        preferredLanguage: mockPreferredLanguage,
      });
    });

    it('should return null if not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);
      const profile = await fetchUserProfile();
      expect(profile).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return null if user not found in DB', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      const profile = await fetchUserProfile();
      expect(profile).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
      const profile = await fetchUserProfile();
      expect(profile).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile if authenticated', async () => {
      const updatedData = { name: 'Updated User', preferredLanguage: 'ja' };
      const success = await updateUserProfile(updatedData);
      expect(auth).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: updatedData,
      });
      expect(success).toBe(true);
    });

    it('should return false if not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);
      const updatedData = { name: 'Updated User' };
      const success = await updateUserProfile(updatedData);
      expect(success).toBe(false);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return false if database update fails', async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('DB update error'));
      const updatedData = { name: 'Updated User' };
      const success = await updateUserProfile(updatedData);
      expect(success).toBe(false);
    });

    it('should not update email field', async () => {
      const updatedData = { email: 'newemail@example.com', name: 'Updated User' };
      const success = await updateUserProfile(updatedData);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { name: 'Updated User' }, // Email should be filtered out
      });
      expect(success).toBe(true);
    });
  });
});

