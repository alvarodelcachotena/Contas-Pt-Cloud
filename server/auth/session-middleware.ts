/**
 * Simplified session-based authentication middleware for Supabase storage
 */

import { Request, Response, NextFunction } from 'express';
import { hasPermission, Permission } from './permissions.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
  userTenant?: {
    userId: number;
    tenantId: number;
    role: string;
  };
  userId?: number;
  tenantId?: number;
}

/**
 * Enhanced session-based authentication middleware with proper role-based access control
 */
export function requireSessionAuth(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const sessionData = req.session as any;
    
    if (!sessionData?.userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Add user info to request
    req.userId = sessionData.userId;
    req.user = {
      id: sessionData.userId,
      email: sessionData.userEmail,
      name: sessionData.userName
    };

    // Add tenant info from session
    if (!sessionData.tenantId) {
      return res.status(400).json({ 
        error: 'Company selection required',
        code: 'TENANT_REQUIRED'
      });
    }

    req.tenantId = sessionData.tenantId;
    req.userTenant = {
      userId: sessionData.userId,
      tenantId: sessionData.tenantId,
      role: sessionData.userRole || 'viewer'
    };

    // Enhanced permission checking with proper role validation
    const userRole = sessionData.userRole || 'viewer';
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions for this action',
        code: 'PERMISSION_DENIED',
        required: permission,
        userRole: userRole,
        message: `Role '${userRole}' does not have permission '${permission}'`
      });
    }

    next();
  };
}

/**
 * Middleware for routes that require authentication but no specific permissions
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionData = req.session as any;
  
  if (!sessionData?.userId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  req.userId = sessionData.userId;
  req.user = {
    id: sessionData.userId,
    email: sessionData.userEmail,
    name: sessionData.userName
  };

  if (sessionData.tenantId) {
    req.tenantId = sessionData.tenantId;
    req.userTenant = {
      userId: sessionData.userId,
      tenantId: sessionData.tenantId,
      role: sessionData.userRole || 'viewer'
    };
  }

  next();
}