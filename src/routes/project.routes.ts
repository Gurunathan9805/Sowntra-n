import { Router } from 'express';
import {
  saveProjectData,
  loadProjectData,
  autoSaveProjectData,
  createProjectVersion,
  getProjectVersions,
  restoreProjectVersion
} from '../controllers/project.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

router.post('/:boardId/save', saveProjectData);
router.get('/:boardId/load', loadProjectData);
router.post('/:boardId/autosave', autoSaveProjectData);

router.post('/:boardId/versions', createProjectVersion);
router.get('/:boardId/versions', getProjectVersions);
router.post('/:boardId/versions/:versionId/restore', restoreProjectVersion);

export default router;

