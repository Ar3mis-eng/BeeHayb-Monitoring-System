import { Router } from 'express';
import * as hiveController from '../controllers/hiveController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All hive routes require authentication
router.use(authMiddleware);

router.get('/', hiveController.getAllHives);
router.get('/:id', hiveController.getHiveById);
router.post('/', hiveController.createHive);
router.put('/:id', hiveController.updateHive);
router.delete('/:id', hiveController.deleteHive);

export default router;
