import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App;

try {
  // Try to load service account from file
  const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
  
  // Check if service account key exists
  const serviceAccount = require(serviceAccountPath);
  
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.warn('⚠️  Firebase service account key not found. Using default credentials.');
  console.warn('   Please add serviceAccountKey.json to the backend root directory.');
  
  // Initialize with minimal config for development
  firebaseApp = admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'sowntra-dev'
  });
}

export const auth = admin.auth();
export const storage = admin.storage();
export const firestore = admin.firestore();

/**
 * Verify Firebase ID token
 * @param token - Firebase ID token from client
 * @returns Decoded token with user information
 */
export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user by UID
 * @param uid - Firebase user UID
 * @returns User record
 */
export async function getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
  try {
    return await auth.getUser(uid);
  } catch (error) {
    throw new Error('User not found');
  }
}

export default firebaseApp;

