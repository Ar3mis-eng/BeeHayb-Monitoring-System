import { Router } from 'express';
import * as deviceController from '../controllers/deviceController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All device routes require authentication
router.use(authMiddleware);

router.get('/', deviceController.getAllDevices);
router.get('/:id', deviceController.getDeviceById);
router.get('/hive/:hiveId', deviceController.getDevicesByHive);
router.post('/', deviceController.createDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

export default router;
