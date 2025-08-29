/**
 * Admin Controllers for User and Tenant Management
 */

import { Request, Response } from 'express';
import { storage } from '../storage.js';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Get all users (admin only)
export async function getUsers(req: Request, res: Response) {
  try {
    console.log('🔍 Fetching all users...');
    // For admin purposes, get users from tenant 1 (default)
    const tenantId = parseInt(req.query.tenantId as string) || 1;
    const users = await storage.getUsers(tenantId);
    console.log(`✅ Found ${users.length} user(s)`);
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get all tenants (admin only)
export async function getTenants(req: Request, res: Response) {
  try {
    console.log('🔍 Fetching all tenants...');
    const tenants = await storage.getTenants();
    console.log(`✅ Found ${tenants.length} tenant(s)`);
    res.json(tenants);
  } catch (error) {
    console.error('❌ Error fetching tenants:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tenants',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get user-tenant assignments (admin only)
export async function getUserTenants(req: Request, res: Response) {
  try {
    console.log('🔍 Fetching user-tenant assignments...');
    const assignments = await storage.getUserTenantAssignments();
    console.log(`✅ Found ${assignments.length} assignment(s)`);
    res.json(assignments);
  } catch (error) {
    console.error('❌ Error fetching user-tenant assignments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch assignments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function createUser(
  supabase: ReturnType<typeof createClient>,
  name: string,
  email: string,
  password: string,
  role?: string
) {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        passwordHash: hashedPassword,
        isActive: true,
        role: role || 'user'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(
  supabase: ReturnType<typeof createClient>,
  userId: number,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    isActive?: boolean;
  }
) {
  try {
    const updates: any = { ...data };

    // If password is being updated, hash it
    if (data.password) {
      updates.passwordHash = await bcrypt.hash(data.password, 10);
      delete updates.password;
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(
  supabase: ReturnType<typeof createClient>,
  userId: number
) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function getUser(
  supabase: ReturnType<typeof createClient>,
  userId: number
) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

export async function listUsers(
  supabase: ReturnType<typeof createClient>,
  options?: {
    role?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  try {
    let query = supabase.from('users').select('*');

    if (options?.role) {
      query = query.eq('role', options.role);
    }

    if (typeof options?.isActive === 'boolean') {
      query = query.eq('isActive', options.isActive);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    return users;
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
}

// Assign user to tenant (admin only)
export async function assignUserToTenant(req: Request, res: Response) {
  try {
    const sessionData = req.session as any;
    
    if (!sessionData?.userId || sessionData?.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const { userId } = req.params;
    const { tenantId, role } = req.body;

    if (!userId || !tenantId || !role) {
      return res.status(400).json({
        success: false,
        message: 'userId, tenantId, and role are required'
      });
    }

    const validRoles = ['admin', 'accountant', 'assistant', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: admin, accountant, assistant, viewer'
      });
    }

    const assignment = await storage.assignUserToTenant({
      userId: parseInt(userId),
      tenantId: parseInt(tenantId),
      role,
      isActive: true
    });

    res.json({
      success: true,
      assignment,
      message: 'User assigned to tenant successfully'
    });
  } catch (error) {
    console.error('❌ Error assigning user to tenant:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to assign user to tenant',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Update user-tenant assignment (admin only)
export async function updateUserTenantAssignment(req: Request, res: Response) {
  try {
    const sessionData = req.session as any;
    
    if (!sessionData?.userId || sessionData?.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const { assignmentId } = req.params;
    const { role, isActive } = req.body;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
    }

    const validRoles = ['admin', 'accountant', 'assistant', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: admin, accountant, assistant, viewer'
      });
    }

    const assignment = await storage.updateUserTenantAssignment(parseInt(assignmentId), {
      role,
      isActive
    });

    res.json({
      success: true,
      assignment,
      message: 'Assignment updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update assignment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Deactivate user (admin only)
export async function deactivateUser(req: Request, res: Response) {
  try {
    const sessionData = req.session as any;
    
    if (!sessionData?.userId || sessionData?.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Don't allow admin to deactivate themselves
    if (parseInt(userId) === sessionData.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const user = await storage.updateUser(parseInt(userId), { isActive: false });

    res.json({
      success: true,
      user,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('❌ Error deactivating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to deactivate user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}