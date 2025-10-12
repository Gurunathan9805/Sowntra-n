import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '../config/firebase';
import { prisma } from '../config/database';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        name?: string;
        dbUserId?: string;
      };
    }
  }
}

/**
 * Middleware to verify Firebase authentication token
 */
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authentication token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify token with Firebase
    const decodedToken = await verifyIdToken(token);

    // Get or create user in database
    let dbUser = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid }
    });

    if (!dbUser) {
      // Create user if doesn't exist
      dbUser = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || '',
          name: decodedToken.name || decodedToken.email?.split('@')[0],
          profileImage: decodedToken.picture
        }
      });
    }

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name,
      dbUserId: dbUser.id
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication - continues even if no token
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await verifyIdToken(token);

      let dbUser = await prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid }
      });

      if (dbUser) {
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          name: decodedToken.name,
          dbUserId: dbUser.id
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

