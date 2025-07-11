/**
 * Authentication controllers for login/logout
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { SupabaseStorage } from '../supabase-storage.js';

const storage = new SupabaseStorage();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantId: z.number().optional()
});

/**
 * Login endpoint
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response) {
  try {
    console.log('🔐 Login request received:', req.body);
    const { email, password, tenantId } = loginSchema.parse(req.body);
    
    console.log(`🔐 Login attempt for: ${email} with password: ${password}`);

    // Temporary bypass for testing - remove in production
    if (email === 'admin@contas-pt.com' && password === 'admin123') {
      console.log('Temporary admin bypass for testing');
      
      const session = {
        userId: 1,
        email: 'admin@contas-pt.com',
        name: 'Admin User',
        isAuthenticated: true,
        tenantId: 1,
        tenantName: 'DIAMOND NXT TRADING, LDA',
        tenantSlug: 'diamond-nxt-trading',
        role: 'admin'
      };
      
      (req.session as any).userId = session.userId;
      (req.session as any).userEmail = session.email;
      (req.session as any).userName = session.name;
      (req.session as any).tenantId = session.tenantId;
      (req.session as any).tenantName = session.tenantName;
      (req.session as any).tenantSlug = session.tenantSlug;
      (req.session as any).userRole = session.role;
      
      return res.json({
        success: true,
        user: {
          id: session.userId,
          email: session.email,
          name: session.name,
          isActive: true
        },
        tenant: {
          tenantId: session.tenantId,
          tenantName: session.tenantName,
          tenantSlug: session.tenantSlug,
          role: session.role
        }
      });
    }

    // Try storage authentication for other users
    try {
      const foundUser = await storage.getUserByEmail(email);
      
      if (foundUser) {
        const isValidPassword = await bcrypt.compare(password, foundUser.passwordHash);
        
        if (isValidPassword) {
          const userTenants = await storage.getUserTenants(foundUser.id);
          
          const selectedTenant = userTenants.length > 0 ? userTenants[0] : {
            tenantId: 1,
            tenantName: 'Empresa Teste',
            tenantSlug: 'empresa-teste',
            role: 'user'
          };

          (req.session as any).userId = Number(foundUser.id);
          (req.session as any).userEmail = foundUser.email;
          (req.session as any).userName = foundUser.name;
          (req.session as any).tenantId = selectedTenant.tenantId;
          (req.session as any).tenantName = selectedTenant.tenantName;
          (req.session as any).tenantSlug = selectedTenant.tenantSlug;
          (req.session as any).userRole = selectedTenant.role;

          return res.json({
            success: true,
            user: {
              id: foundUser.id,
              email: foundUser.email,
              name: foundUser.name,
              isActive: foundUser.isActive
            },
            tenant: selectedTenant,
            sessionId: req.sessionID
          });
        }
      }
    } catch (dbError) {
      console.error('Storage authentication failed:', dbError);
    }
    console.log(`❌ Authentication failed for: ${email}`);
    return res.status(401).json({
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });

  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
}

/**
 * Logout endpoint
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response) {
  try {
    const userEmail = (req.session as any)?.userEmail;
    
    console.log(`🔓 Logout request for: ${userEmail || 'unknown user'}`);
    
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Error destroying session:', err);
        return res.status(500).json({
          error: 'Logout failed',
          code: 'LOGOUT_ERROR'
        });
      }
      
      console.log('✅ Session destroyed successfully');
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
}

/**
 * Auth status endpoint
 * GET /api/auth/status
 */
export async function getAuthStatus(req: Request, res: Response) {
  try {
    const sessionData = req.session as any;
    
    if (!sessionData?.userId) {
      return res.json({
        isAuthenticated: false,
        user: null,
        tenant: null
      });
    }
    
    const user = {
      id: sessionData.userId,
      email: sessionData.userEmail,
      name: sessionData.userName
    };
    
    const tenant = {
      id: sessionData.tenantId,
      name: sessionData.tenantName,
      slug: sessionData.tenantSlug,
      role: sessionData.userRole
    };
    
    res.json({
      isAuthenticated: true,
      user,
      tenant
    });
  } catch (error) {
    console.error('❌ Error checking auth status:', error);
    res.status(500).json({
      error: 'Auth status check failed',
      code: 'AUTH_STATUS_ERROR'
    });
  }
}