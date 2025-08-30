import { Request, Response } from 'express';
import { ContractService } from '../services/contract.service';

export class ContractController {
  private service: ContractService;
  
  constructor() {
    this.service = new ContractService();
  }
  
  getAll = async (req: Request, res: Response) => {
    const result = await this.service.getAll();
    res.json(result);
  };
  
  getById = async (req: Request, res: Response) => {
    const result = await this.service.getById(req.params.id);
    res.json(result);
  };
  
  create = async (req: Request, res: Response) => {
    const result = await this.service.create(req.body);
    res.status(201).json(result);
  };
  
  update = async (req: Request, res: Response) => {
    const result = await this.service.update(req.params.id, req.body);
    res.json(result);
  };
  
  delete = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    res.status(204).send();
  };
}