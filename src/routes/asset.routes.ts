import { Router } from 'express';
import multer from 'multer';
import { uploadAsset, getAssets, deleteAsset } from '../controllers/asset.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// All asset routes require authentication
router.use(authenticateUser);

// Asset routes
router.post('/:boardId/upload', upload.single('file'), uploadAsset);
router.get('/:boardId', getAssets);
router.delete('/:boardId/:assetId', deleteAsset);

export default router;

