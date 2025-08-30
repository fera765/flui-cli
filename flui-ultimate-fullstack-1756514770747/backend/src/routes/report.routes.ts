import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';

const router = Router();
const controller = new ReportController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;