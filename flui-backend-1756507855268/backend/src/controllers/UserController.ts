import { Request, Response, NextFunction } from 'express';
import { UserService } from '@/services/UserService';
import { ValidationError, NotFoundError } from '@/utils/errors';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validateRequest } from '@/middleware/validation';
import { body, param, query } from 'express-validator';

export class UserController {
  constructor(private userService: UserService) {}

  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const users = await this.userService.findAll({ page, limit });
    
    res.status(200).json({
      success: true,
      data: users,
    });
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.findById(req.params.id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  });

  createUser = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*d)(?=.*[@$!%*?&])/),
    body('name').trim().isLength({ min: 2, max: 100 }),
    validateRequest,
    asyncHandler(async (req: Request, res: Response) => {
      const user = await this.userService.create(req.body);
      
      res.status(201).json({
        success: true,
        data: user,
      });
    }),
  ];

  updateUser = [
    param('id').isUUID(),
    body('email').optional().isEmail().normalizeEmail(),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    validateRequest,
    asyncHandler(async (req: Request, res: Response) => {
      const user = await this.userService.update(req.params.id, req.body);
      
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      res.status(200).json({
        success: true,
        data: user,
      });
    }),
  ];

  deleteUser = [
    param('id').isUUID(),
    validateRequest,
    asyncHandler(async (req: Request, res: Response) => {
      const deleted = await this.userService.delete(req.params.id);
      
      if (!deleted) {
        throw new NotFoundError('User not found');
      }
      
      res.status(204).send();
    }),
  ];
}