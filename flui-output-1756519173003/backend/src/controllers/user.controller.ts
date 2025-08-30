import { Request, Response } from 'express';
import { userService } from '../services/user.service';

export class UserController {
  private service = new userService();
  
  async create(req: Request, res: Response) {
    const result = await this.service.create(req.body);
    res.status(201).json(result);
  }
  
  async getAll(req: Request, res: Response) {
    const result = await this.service.getAll();
    res.json(result);
  }
  
  async getById(req: Request, res: Response) {
    const result = await this.service.getById(req.params.id);
    res.json(result);
  }
  
  async update(req: Request, res: Response) {
    const result = await this.service.update(req.params.id, req.body);
    res.json(result);
  }
  
  async delete(req: Request, res: Response) {
    await this.service.delete(req.params.id);
    res.status(204).send();
  }
}