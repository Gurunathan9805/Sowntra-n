import { Router } from 'express';
import {
  saveProjectData,
  loadProjectData,
  autoSaveProjectData,
  createProjectVersion,
  getProjectVersions,
  restoreProjectVersion,
  getUserProjects,
  loadUserProject,
  updateUserProject,
  deleteUserProject
} from '../controllers/project.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

// User project routes (without boardId)
router.post('/save', saveProjectData);
router.get('/', getUserProjects);
router.get('/:projectId', loadUserProject);
router.put('/:projectId', updateUserProject);
router.delete('/:projectId', deleteUserProject);

// Board-specific project data routes (legacy)
router.post('/:boardId/save', saveProjectData);
router.get('/:boardId/load', loadProjectData);
router.post('/:boardId/autosave', autoSaveProjectData);

router.post('/:boardId/versions', createProjectVersion);
router.get('/:boardId/versions', getProjectVersions);
router.post('/:boardId/versions/:versionId/restore', restoreProjectVersion);

export default router;

