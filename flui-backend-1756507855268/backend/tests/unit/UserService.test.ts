import { UserService } from '@/services/UserService';
import { UserRepository } from '@/repositories/UserRepository';
import { CacheService } from '@/services/CacheService';
import { EmailService } from '@/services/EmailService';
import bcrypt from 'bcryptjs';

jest.mock('@/repositories/UserRepository');
jest.mock('@/services/CacheService');
jest.mock('@/services/EmailService');
jest.mock('bcryptjs');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockEmailService: jest.Mocked<EmailService>;
  
  beforeEach(() => {
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockCacheService = new CacheService() as jest.Mocked<CacheService>;
    mockEmailService = new EmailService() as jest.Mocked<EmailService>;
    
    userService = new UserService(
      mockUserRepository,
      mockCacheService,
      mockEmailService
    );
    
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };
      
      const hashedPassword = 'hashed_password';
      const createdUser = {
        id: 1,
        ...userData,
        password: hashedPassword,
      };
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(createdUser);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(true);
      
      const result = await userService.create(userData);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(userData.email);
      expect(result.password).toBeUndefined();
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };
      
      mockUserRepository.findByEmail.mockResolvedValue({ id: 1, email: userData.email });
      
      await expect(userService.create(userData)).rejects.toThrow('Email already exists');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return cached users if available', async () => {
      const cachedUsers = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
      ];
      
      mockCacheService.get.mockResolvedValue(cachedUsers);
      
      const result = await userService.findAll();
      
      expect(result).toEqual(cachedUsers);
      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not cached', async () => {
      const users = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
      ];
      
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.findAll.mockResolvedValue(users);
      
      const result = await userService.findAll();
      
      expect(result).toEqual(users);
      expect(mockCacheService.set).toHaveBeenCalledWith('users:all', users, 300);
    });
  });

  describe('update', () => {
    it('should update user and invalidate cache', async () => {
      const userId = '1';
      const updateData = { name: 'Updated Name' };
      const updatedUser = { id: 1, email: 'test@example.com', name: 'Updated Name' };
      
      mockUserRepository.findById.mockResolvedValue({ id: 1, email: 'test@example.com' });
      mockUserRepository.update.mockResolvedValue(updatedUser);
      
      const result = await userService.update(userId, updateData);
      
      expect(result).toEqual(updatedUser);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockCacheService.delete).toHaveBeenCalledWith('users:all');
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      
      const result = await userService.update('999', { name: 'Updated' });
      
      expect(result).toBeNull();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete user and invalidate cache', async () => {
      const userId = '1';
      
      mockUserRepository.findById.mockResolvedValue({ id: 1 });
      mockUserRepository.delete.mockResolvedValue(true);
      
      const result = await userService.delete(userId);
      
      expect(result).toBe(true);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockCacheService.delete).toHaveBeenCalledWith('users:all');
    });

    it('should return false if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      
      const result = await userService.delete('999');
      
      expect(result).toBe(false);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });
  });
});