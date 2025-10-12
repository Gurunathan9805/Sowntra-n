import { Router } from 'express';
import {
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  addBoardMember,
  removeBoardMember
} from '../controllers/board.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// All board routes require authentication
router.use(authenticateUser);

// Board CRUD operations
router.get('/', listBoards);
router.post('/', createBoard);
router.get('/:id', getBoard);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);

// Board member management
router.post('/:id/members', addBoardMember);
router.delete('/:id/members/:memberId', removeBoardMember);

export default router;

