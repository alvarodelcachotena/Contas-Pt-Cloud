-- Local Development User Setup
-- Run this in your Supabase SQL editor or with psql

-- Create super admin user
INSERT INTO users (id, email, name, password_hash, is_active, created_at, updated_at)
VALUES (
  3,
  'aki@diamondnxt.com',
  'Aki Super Admin',
  '$2b$10$5pVbR2Sv3YSmxXh3YeZvxONg0T4..VHky4QrUJYRzqV2bvDuHdCC2', -- Password: Aki1234!@#
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create tenant (company)
INSERT INTO tenants (id, name, tax_id, address, created_at, updated_at)
VALUES (
  1,
  'DIAMOND NXT TRADING LDA',
  '517124548',
  'Vila Nova de Gaia, Portugal',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create user-tenant relationship
INSERT INTO user_tenants (user_id, tenant_id, role, is_active, created_at)
VALUES (
  '3',
  1,
  'admin',
  true,
  NOW()
) ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Verify the setup
SELECT 
  u.email,
  u.name,
  t.name as company,
  ut.role
FROM users u
JOIN user_tenants ut ON u.id::text = ut.user_id
JOIN tenants t ON ut.tenant_id = t.id
WHERE u.email = 'aki@diamondnxt.com';