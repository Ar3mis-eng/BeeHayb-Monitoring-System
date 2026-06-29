import { Router } from 'express';
import * as sensorController from '../controllers/sensorController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All sensor routes require authentication
router.use(authMiddleware);

router.get('/', sensorController.getSensorReadings);
router.get('/hive/:hiveId/latest', sensorController.getLatestSensorReadingByHive);
router.get('/hive/:hiveId/range', sensorController.getSensorReadingsByHiveAndTimeRange);
router.get('/hive/:hiveId', sensorController.getSensorReadingsByHive);
router.post('/', sensorController.createSensorReading);

export default router;
