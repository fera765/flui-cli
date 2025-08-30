import { Request, Response } from 'express';
import { UserController } from '@/controllers/UserController';
import { UserService } from '@/services/UserService';
import { ValidationError } from '@/utils/errors';

jest.mock('@/services/UserService');

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    mockUserService = new UserService() as jest.Mocked<UserService>;
    userController = new UserController(mockUserService);
    
    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('getUsers', () => {
    it('should return all users with status 200', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@example.com', name: 'User 1' },
        { id: 2, email: 'user2@example.com', name: 'User 2' },
      ];
      
      mockUserService.findAll.mockResolvedValue(mockUsers);
      
      await userController.getUsers(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
      });
    });

    it('should handle pagination parameters', async () => {
      mockRequest.query = { page: '2', limit: '10' };
      mockUserService.findAll.mockResolvedValue([]);
      
      await userController.getUsers(mockRequest as Request, mockResponse as Response);
      
      expect(mockUserService.findAll).toHaveBeenCalledWith({ page: 2, limit: 10 });
    });
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'SecurePass123!',
        name: 'New User',
      };
      
      const createdUser = { id: 1, ...userData, password: undefined };
      
      mockRequest.body = userData;
      mockUserService.create.mockResolvedValue(createdUser);
      
      await userController.createUser(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdUser,
      });
    });

    it('should return 400 for invalid email', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'New User',
      };
      
      mockUserService.create.mockRejectedValue(new ValidationError('Invalid email format'));
      
      await userController.createUser(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid email format',
      });
    });
  });

  describe('updateUser', () => {
    it('should update user with valid data', async () => {
      const userId = '1';
      const updateData = { name: 'Updated Name' };
      const updatedUser = { id: 1, email: 'user@example.com', name: 'Updated Name' };
      
      mockRequest.params = { id: userId };
      mockRequest.body = updateData;
      mockUserService.update.mockResolvedValue(updatedUser);
      
      await userController.updateUser(mockRequest as Request, mockResponse as Response);
      
      expect(mockUserService.update).toHaveBeenCalledWith(userId, updateData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedUser,
      });
    });

    it('should return 404 for non-existent user', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { name: 'Updated Name' };
      mockUserService.update.mockResolvedValue(null);
      
      await userController.updateUser(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockRequest.params = { id: '1' };
      mockUserService.delete.mockResolvedValue(true);
      
      await userController.deleteUser(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      mockRequest.params = { id: '999' };
      mockUserService.delete.mockResolvedValue(false);
      
      await userController.deleteUser(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });
  });
});