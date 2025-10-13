import { Router } from 'express';
import {
  getCurrentUser,
  updateUserProfile,
  getUserStats,
  deleteUserAccount,
  searchUsers
} from '../controllers/user.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

router.get('/me', getCurrentUser);
router.put('/me', updateUserProfile);
router.get('/me/stats', getUserStats);
router.delete('/me', deleteUserAccount);
router.get('/search', searchUsers);

export default router;

