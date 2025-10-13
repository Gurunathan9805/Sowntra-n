import { Request, Response } from 'express';
import { prisma } from '../config/database';

/**
 * Get current user profile
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.dbUserId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        firebaseUid: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            boards: true,
            boardMembers: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.dbUserId;
    const { name, profileImage } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(profileImage !== undefined && { profileImage })
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        firebaseUid: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.dbUserId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [ownedBoardsCount, sharedBoardsCount, totalAssetsCount] = await Promise.all([
      prisma.board.count({ where: { ownerId: userId } }),
      prisma.boardMember.count({ where: { userId } }),
      prisma.board.findMany({
        where: { ownerId: userId },
        include: { _count: { select: { assets: true } } }
      })
    ]);

    const totalAssets = totalAssetsCount.reduce((sum, board) => sum + board._count.assets, 0);

    res.json({
      ownedBoards: ownedBoardsCount,
      sharedBoards: sharedBoardsCount,
      totalAssets,
      memberSince: (await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true }
      }))?.createdAt
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
}

/**
 * Delete user account
 */
export async function deleteUserAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.dbUserId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
}

/**
 * Search users by email (for collaboration)
 */
export async function searchUsers(req: Request, res: Response): Promise<void> {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true
      },
      take: 10
    });

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
}

