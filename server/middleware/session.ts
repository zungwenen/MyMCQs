import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Secret key for signing session tokens (in production, use environment variable)
const SESSION_SECRET = process.env.SESSION_SECRET || '152941180b431b30e2f66cb969f511d37d292c23d6c2f78771886d7230abe5df';

export async function createSessionToken(id: string, type: 'user' | 'admin'): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now();
  const payload = `${sessionId}:${id}:${type}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  
  // Store session in database
  await db.insert(schema.sessions).values({
    id: sessionId,
    [type === 'user' ? 'userId' : 'adminId']: id,
  });
  
  return `${payload}.${signature}`;
}

async function validateSessionToken(token: string): Promise<{ sessionId: string; id: string; type: 'user' | 'admin'; timestamp: number } | null> {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) return null;
    
    const [sessionId, id, type, timestamp] = payload.split(':');
    if (!sessionId || !id || !type || !timestamp) return null;
    
    // Check if session exists in database
    const session = await db.query.sessions.findFirst({
      where: eq(schema.sessions.id, sessionId),
    });
    if (!session) return null;
    
    return {
      sessionId,
      id,
      type: type as 'user' | 'admin',
      timestamp: parseInt(timestamp),
    };
  } catch {
    return null;
  }
}

export async function invalidateSession(token: string) {
  const validated = await validateSessionToken(token);
  if (validated) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, validated.sessionId));
  }
}

// Session middleware - validates session tokens from cookies
export async function attachUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userToken = req.cookies?.userToken;
    const adminToken = req.cookies?.adminToken;
    
    if (userToken) {
      const validated = await validateSessionToken(userToken);
      if (validated && validated.type === 'user') {
        const tokenAge = Date.now() - validated.timestamp;
        
        // Token expires after 28 days (4 weeks)
        if (tokenAge < 28 * 24 * 60 * 60 * 1000) {
          const user = await db.query.users.findFirst({
            where: eq(schema.users.id, validated.id),
          });
          
          if (user && user.isVerified) {
            (req as any).userId = validated.id;
            (req as any).user = user;
          } else {
            // User no longer exists or not verified, invalidate session
            await invalidateSession(userToken);
            res.clearCookie('userToken');
          }
        } else {
          // Token expired, invalidate session
          await invalidateSession(userToken);
          res.clearCookie('userToken');
        }
      }
    }
    
    if (adminToken) {
      const validated = await validateSessionToken(adminToken);
      if (validated && validated.type === 'admin') {
        const tokenAge = Date.now() - validated.timestamp;
        
        // Admin token expires after 24 hours
        if (tokenAge < 24 * 60 * 60 * 1000) {
          const admin = await db.query.admins.findFirst({
            where: eq(schema.admins.id, validated.id),
          });
          
          if (admin) {
            (req as any).adminId = validated.id;
            (req as any).admin = admin;
          } else {
            // Admin no longer exists, invalidate session
            await invalidateSession(adminToken);
            res.clearCookie('adminToken');
          }
        } else {
          // Token expired, invalidate session
          await invalidateSession(adminToken);
          res.clearCookie('adminToken');
        }
      }
    }
    
    next();
  } catch (error) {
    next();
  }
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).userId) {
    return res.status(401).json({ message: 'Unauthorized - user login required' });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).adminId) {
    return res.status(401).json({ message: 'Unauthorized - admin login required' });
  }
  next();
}
