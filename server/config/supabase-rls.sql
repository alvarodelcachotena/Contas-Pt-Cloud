-- Supabase Row-Level Security (RLS) Policies for Multi-Tenant System
-- Run these SQL commands in your Supabase SQL editor to enable proper data isolation

-- Enable RLS on all tenant-specific tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_drive_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saft_exports ENABLE ROW LEVEL SECURITY;

-- Create helper function to get current user's tenant access
CREATE OR REPLACE FUNCTION get_user_tenant_ids(user_id INTEGER)
RETURNS INTEGER[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT tenant_id 
    FROM user_tenants 
    WHERE user_id = $1 AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants: Users can only see tenants they belong to
CREATE POLICY tenant_access ON tenants
  FOR ALL
  USING (
    id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- Users: Can see their own user record
CREATE POLICY user_access ON users
  FOR ALL
  USING (
    id = current_setting('app.current_user_id')::INTEGER
  );

-- User Tenants: Users can see their own tenant assignments
CREATE POLICY user_tenant_access ON user_tenants
  FOR ALL
  USING (
    user_id = current_setting('app.current_user_id')::INTEGER
    OR tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- Clients: Access restricted to user's tenants
CREATE POLICY client_tenant_access ON clients
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- Invoices: Access restricted to user's tenants
CREATE POLICY invoice_tenant_access ON invoices
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- Expenses: Access restricted to user's tenants
CREATE POLICY expense_tenant_access ON expenses
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- Payments: Access restricted to user's tenants
CREATE POLICY payment_tenant_access ON payments
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- Bank Accounts: Access restricted to user's tenants
CREATE POLICY bank_account_tenant_access ON bank_accounts
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- Bank Transactions: Access restricted to user's tenants
CREATE POLICY bank_transaction_tenant_access ON bank_transactions
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- Documents: Access restricted to user's tenants
CREATE POLICY document_tenant_access ON documents
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- Cloud Drive Configs: Access restricted to user's tenants
CREATE POLICY cloud_drive_tenant_access ON cloud_drive_configs
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- Raw Documents: Access restricted to user's tenants
CREATE POLICY raw_document_tenant_access ON raw_documents
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- AI Chat Messages: Access restricted to user's tenants and own messages
CREATE POLICY ai_chat_tenant_access ON ai_chat_messages
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
    AND user_id = current_setting('app.current_user_id')::INTEGER
  );

-- Manager Approvals: Access restricted to user's tenants
CREATE POLICY manager_approval_tenant_access ON manager_approvals
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- SAF-T Exports: Access restricted to user's tenants
CREATE POLICY saft_export_tenant_access ON saft_exports
  FOR ALL
  USING (
    tenant_id = ANY(get_user_tenant_ids(current_setting('app.current_user_id')::INTEGER))
  );

-- Grant necessary permissions to the service role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION get_user_tenant_ids(INTEGER) TO service_role;

-- Comments for documentation
COMMENT ON FUNCTION get_user_tenant_ids(INTEGER) IS 'Helper function to get all tenant IDs that a user has access to';
COMMENT ON POLICY tenant_access ON tenants IS 'Users can only access tenants they belong to';
COMMENT ON POLICY user_access ON users IS 'Users can only access their own user record';
COMMENT ON POLICY client_tenant_access ON clients IS 'Access restricted to clients within user''s tenants';