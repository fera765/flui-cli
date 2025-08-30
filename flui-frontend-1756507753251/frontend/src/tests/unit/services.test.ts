import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { AuthService } from '@/services/auth/AuthService';
import { ApiService } from '@/services/api/ApiService';

vi.mock('axios');

describe('AuthService', () => {
  let authService: AuthService;
  
  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        data: {
          token: 'mock-jwt-token',
          user: { id: 1, email: 'test@example.com' }
        }
      };
      
      (axios.post as any).mockResolvedValue(mockResponse);
      
      const result = await authService.login('test@example.com', 'password123');
      
      expect(result).toEqual(mockResponse.data);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        { email: 'test@example.com', password: 'password123' }
      );
    });

    it('should throw error on invalid credentials', async () => {
      (axios.post as any).mockRejectedValue(new Error('Invalid credentials'));
      
      await expect(authService.login('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear token and user data on logout', () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      
      authService.logout();
      
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('token', 'mock-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      localStorage.removeItem('token');
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});