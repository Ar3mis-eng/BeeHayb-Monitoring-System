import { Request, Response, NextFunction } from 'express';
import jwt from 'jwt-simple';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded: any = jwt.decode(token, process.env.JWT_SECRET || 'secret');
    req.user = {
      id: decoded.id,
      username: decoded.username,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
