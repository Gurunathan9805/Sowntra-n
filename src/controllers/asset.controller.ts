import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { storage } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload asset to Firebase Storage
 */
export async function uploadAsset(req: Request, res: Response): Promise<void> {
  try {
    const { boardId } = req.params;
    const userId = req.user?.dbUserId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if user has access to the board
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { members: true }
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const hasAccess =
      board.ownerId === userId ||
      board.members.some(m => m.userId === userId && m.role !== 'viewer');

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const file = req.file;
    const fileId = uuidv4();
    const fileName = `boards/${boardId}/${fileId}-${file.originalname}`;

    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Make file publicly accessible
    await fileUpload.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Save asset metadata to database
    const asset = await prisma.asset.create({
      data: {
        boardId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        url: publicUrl,
        storageRef: fileName,
      },
    });

    res.status(201).json(asset);
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ error: 'Failed to upload asset' });
  }
}

/**
 * Get all assets for a board
 */
export async function getAssets(req: Request, res: Response): Promise<void> {
  try {
    const { boardId } = req.params;
    const userId = req.user?.dbUserId;

    // Check if user has access to the board
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { members: true }
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const hasAccess =
      board.isPublic ||
      board.ownerId === userId ||
      (userId && board.members.some(m => m.userId === userId));

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const assets = await prisma.asset.findMany({
      where: { boardId },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
}

/**
 * Delete an asset
 */
export async function deleteAsset(req: Request, res: Response): Promise<void> {
  try {
    const { boardId, assetId } = req.params;
    const userId = req.user?.dbUserId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get asset
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        board: {
          include: { members: true }
        }
      }
    });

    if (!asset || asset.boardId !== boardId) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    // Check if user has permission to delete
    const hasAccess =
      asset.board.ownerId === userId ||
      asset.board.members.some(m => m.userId === userId && m.role !== 'viewer');

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Delete from Firebase Storage
    try {
      const bucket = storage.bucket();
      await bucket.file(asset.storageRef).delete();
    } catch (error) {
      console.warn('Failed to delete file from storage:', error);
    }

    // Delete from database
    await prisma.asset.delete({
      where: { id: assetId }
    });

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
}

