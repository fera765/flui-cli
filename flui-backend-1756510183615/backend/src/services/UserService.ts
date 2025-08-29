import bcrypt from 'bcryptjs';
import { UserRepository } from '@/repositories/UserRepository';
import { CacheService } from '@/services/CacheService';
import { EmailService } from '@/services/EmailService';
import { ConflictError, ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
}

export interface UserDto {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private cacheService: CacheService,
    private emailService: EmailService
  ) {}

  async create(data: CreateUserDto): Promise<UserDto> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create user
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email);
    } catch (error) {
      logger.error('Failed to send welcome email', { error, userId: user.id });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserDto;
  }

  async findAll(options?: { page?: number; limit?: number }): Promise<UserDto[]> {
    const cacheKey = `users:all:${options?.page || 1}:${options?.limit || 10}`;
    
    // Check cache
    const cached = await this.cacheService.get<UserDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const users = await this.userRepository.findAll(options);
    
    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, users, 300);
    
    return users.map(({ password, ...user }) => user as UserDto);
  }

  async findById(id: string): Promise<UserDto | null> {
    const cacheKey = `user:${id}`;
    
    // Check cache
    const cached = await this.cacheService.get<UserDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    const userDto = userWithoutPassword as UserDto;
    
    // Cache for 10 minutes
    await this.cacheService.set(cacheKey, userDto, 600);
    
    return userDto;
  }

  async update(id: string, data: UpdateUserDto): Promise<UserDto | null> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      return null;
    }

    // Check if new email is already taken
    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await this.userRepository.findByEmail(data.email);
      if (emailTaken) {
        throw new ConflictError('Email already exists');
      }
    }

    // Update user
    const updatedUser = await this.userRepository.update(id, data);
    
    // Invalidate cache
    await this.cacheService.delete(`user:${id}`);
    await this.cacheService.delete('users:all:*');
    
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as UserDto;
  }

  async delete(id: string): Promise<boolean> {
    // Check if user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      return false;
    }

    // Delete user
    const deleted = await this.userRepository.delete(id);
    
    // Invalidate cache
    await this.cacheService.delete(`user:${id}`);
    await this.cacheService.delete('users:all:*');
    
    return deleted;
  }
}