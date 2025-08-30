import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller';

const router = Router();
const controller = new ContractController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;