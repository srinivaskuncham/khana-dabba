import { NextFunction, Request, Response } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

// Middleware to check if user is admin without blocking
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    res.locals.isAdmin = true;
  } else {
    res.locals.isAdmin = false;
  }
  next();
}
