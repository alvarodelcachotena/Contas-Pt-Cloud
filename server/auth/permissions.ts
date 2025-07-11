/**
 * Permission system for multi-tenant role-based access control
 */

export enum Permission {
  // Document permissions
  DOCUMENTS_READ = 'documents:read',
  DOCUMENTS_WRITE = 'documents:write',
  DOCUMENTS_DELETE = 'documents:delete',
  
  // Invoice permissions
  INVOICES_READ = 'invoices:read',
  INVOICES_CREATE = 'invoices:create',
  INVOICES_EDIT = 'invoices:edit',
  INVOICES_VALIDATE = 'invoices:validate',
  INVOICES_DELETE = 'invoices:delete',
  
  // Expense permissions
  EXPENSES_READ = 'expenses:read',
  EXPENSES_CREATE = 'expenses:create',
  EXPENSES_EDIT = 'expenses:edit',
  EXPENSES_DELETE = 'expenses:delete',
  
  // Bank account permissions
  BANK_ACCOUNTS_READ = 'bank_accounts:read',
  BANK_ACCOUNTS_MANAGE = 'bank_accounts:manage',
  
  // Client permissions
  CLIENTS_READ = 'clients:read',
  CLIENTS_MANAGE = 'clients:manage',
  
  // Payment permissions
  PAYMENTS_READ = 'payments:read',
  PAYMENTS_MANAGE = 'payments:manage',
  
  // Report permissions
  REPORTS_VIEW = 'reports:view',
  REPORTS_EXPORT = 'reports:export',
  
  // Admin permissions
  USERS_MANAGE = 'users:manage',
  TENANTS_MANAGE = 'tenants:manage',
  SETTINGS_MANAGE = 'settings:manage',
  
  // Cloud drive permissions
  CLOUD_DRIVES_READ = 'cloud_drives:read',
  CLOUD_DRIVES_MANAGE = 'cloud_drives:manage'
}

// Base permissions for each role
const VIEWER_PERMISSIONS = [
  Permission.DOCUMENTS_READ,
  Permission.INVOICES_READ,
  Permission.EXPENSES_READ,
  Permission.BANK_ACCOUNTS_READ,
  Permission.CLIENTS_READ,
  Permission.PAYMENTS_READ,
  Permission.REPORTS_VIEW,
  Permission.CLOUD_DRIVES_READ
];

const ASSISTANT_PERMISSIONS = [
  ...VIEWER_PERMISSIONS,
  Permission.DOCUMENTS_WRITE,
  Permission.EXPENSES_CREATE,
  Permission.EXPENSES_EDIT
];

const ACCOUNTANT_PERMISSIONS = [
  ...ASSISTANT_PERMISSIONS,
  Permission.INVOICES_CREATE,
  Permission.INVOICES_EDIT,
  Permission.INVOICES_VALIDATE,
  Permission.BANK_ACCOUNTS_MANAGE,
  Permission.CLIENTS_MANAGE,
  Permission.PAYMENTS_MANAGE,
  Permission.REPORTS_EXPORT,
  Permission.CLOUD_DRIVES_MANAGE
];

const ADMIN_PERMISSIONS = [
  ...Object.values(Permission)
];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  viewer: VIEWER_PERMISSIONS,
  assistant: ASSISTANT_PERMISSIONS,
  accountant: ACCOUNTANT_PERMISSIONS,
  admin: ADMIN_PERMISSIONS
};

export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) {
    return false;
  }
  return rolePermissions.includes(permission);
}

export function getAllPermissions(userRole: string): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

export function isValidRole(role: string): boolean {
  return Object.keys(ROLE_PERMISSIONS).includes(role);
}