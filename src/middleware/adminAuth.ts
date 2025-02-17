import { NextFunction, Request, Response } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = req.user;
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

// Middleware to check if user is admin without blocking
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  res.locals.isAdmin = !!(req.isAuthenticated() && user?.isAdmin);
  next();
}