import { Router } from 'express';
import { getHealthStatus, getDatabaseStats } from '../controllers/health.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/', getHealthStatus);
router.get('/stats', authenticateUser, getDatabaseStats);

export default router;

