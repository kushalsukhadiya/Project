import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const authorizeRoles = (allowedRoles: ('citizen' | 'collector' | 'recycler' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. Authenticated session required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden. This action requires one of the following roles: [${allowedRoles.join(', ')}].` 
      });
    }

    next();
  };
};
