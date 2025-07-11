/**
 * Authentication and authorization middleware for multi-tenant access control
 */

import { Request, Response, NextFunction } from 'express';
import { hasPermission, Permission } from './permissions.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  tenantId?: number;
}

/**
 * Middleware to authenticate user from session
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionData = req.session as any;
  
  if (!sessionData?.userId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Add user info to request
  req.user = {
    id: sessionData.userId,
    email: sessionData.userEmail,
    name: sessionData.userName
  };

  // Add tenant info from session
  if (sessionData.tenantId) {
    req.tenantId = sessionData.tenantId;
    req.userTenant = {
      userId: sessionData.userId,
      tenantId: sessionData.tenantId,
      role: sessionData.userRole || 'admin'
    };
  }

  next();
}

/**
 * Middleware to require a specific tenant context
 */
export function requireTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id || req.body.tenant_id;
  
  if (!tenantId) {
    return res.status(400).json({ 
      error: 'Tenant ID required',
      code: 'TENANT_REQUIRED',
      message: 'Please specify tenant ID in header x-tenant-id or request body'
    });
  }

  req.tenantId = parseInt(tenantId as string, 10);
  next();
}

/**
 * Middleware to verify user has access to the specified tenant
 */
export async function requireTenantAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.id || !req.tenantId) {
    return res.status(401).json({ 
      error: 'Authentication and tenant context required',
      code: 'AUTH_TENANT_REQUIRED'
    });
  }

  try {
    // Check if user has access to this tenant
    const { data: userTenant, error: dbError } = await supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('tenant_id', req.tenantId)
      .eq('is_active', true)
      .limit(1);

    if (dbError) {
      console.error('🔒 Database error checking tenant access:', dbError);
      return res.status(500).json({ 
        error: 'Database error checking tenant access',
        code: 'DB_ERROR'
      });
    }

    if (!userTenant || userTenant.length === 0) {
      console.log(`🔒 Permission denied: User ${req.user.id} has no access to tenant ${req.tenantId}`);
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED',
        tenantId: req.tenantId,
        userId: req.user.id
      });
    }

    // Add tenant info to request
    req.userTenant = {
      userId: req.user.id,
      tenantId: req.tenantId,
      role: userTenant[0].role
    };

    next();
  } catch (error) {
    console.error('🔒 Error checking tenant access:', error);
    return res.status(500).json({ 
      error: 'Internal server error checking tenant access',
      code: 'TENANT_CHECK_ERROR'
    });
  }
}

/**
 * Higher-order function to create permission middleware
 */
export function requirePermission(permission: Permission) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userTenant) {
      return res.status(401).json({ 
        error: 'Tenant authentication required',
        code: 'TENANT_AUTH_REQUIRED'
      });
    }

    // Check if user's role has the required permission
    if (!hasPermission(req.userTenant.role, permission)) {
      console.log(`🔒 Permission denied: Role '${req.userTenant.role}' lacks permission '${permission}' for user ${req.userTenant.userId} in tenant ${req.userTenant.tenantId}`);
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: permission,
        role: req.userTenant.role,
        tenantId: req.userTenant.tenantId,
        route: req.route?.path || req.path
      });
    }

    next();
  };
}

/**
 * Combined middleware for complete authentication and authorization
 * Simplified for Supabase storage without database dependency
 */
export function requireAuthWithPermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const sessionData = req.session as any;
    
    if (!sessionData?.userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Add user info to request
    req.user = {
      id: sessionData.userId,
      email: sessionData.userEmail,
      name: sessionData.userName
    };

    // Add tenant info from session
    if (!sessionData.tenantId) {
      return res.status(400).json({ 
        error: 'Tenant ID required',
        code: 'TENANT_REQUIRED'
      });
    }

    req.tenantId = sessionData.tenantId;
    req.userTenant = {
      userId: sessionData.userId,
      tenantId: sessionData.tenantId,
      role: sessionData.userRole || 'admin'
    };

    // Check permission (simplified - admin role has all permissions)
    const userRole = sessionData.userRole || 'admin';
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: permission,
        role: userRole
      });
    }

    next();
  };
}

/**
 * Middleware to add tenant context without requiring specific permissions (for public endpoints)
 */
export async function addTenantContext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.id && req.tenantId) {
    try {
      const { data: userTenant, error: dbError } = await supabase
        .from('user_tenants')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('tenant_id', req.tenantId)
        .eq('is_active', true)
        .limit(1);

      if (!dbError && userTenant && userTenant.length > 0) {
        req.userTenant = {
          userId: req.user.id,
          tenantId: req.tenantId,
          role: userTenant[0].role
        };
      }
    } catch (error) {
      console.error('🔒 Error adding tenant context:', error);
    }
  }
  
  next();
}