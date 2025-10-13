import { Request, Response } from 'express';
import { prisma } from '../config/database';

export async function getHealthStatus(_req: Request, res: Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
}

export async function getDatabaseStats(_req: Request, res: Response): Promise<void> {
  try {
    const [usersCount, boardsCount, assetsCount] = await Promise.all([
      prisma.user.count(),
      prisma.board.count(),
      prisma.asset.count()
    ]);

    res.json({
      users: usersCount,
      boards: boardsCount,
      assets: assetsCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ error: 'Failed to fetch database statistics' });
  }
}

