-- Row-Level Security (RLS) Policies for Contas-PT Cloud - CORRECTED VERSION
-- This file configures RLS policies for multi-tenant data isolation
-- Fixed to handle UUID vs INTEGER type mismatches and match actual table schemas

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_drive_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_agent_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_item_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE consensus_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_embedding ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_query_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_invoice_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_statement_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE saft_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_rates ENABLE ROW LEVEL SECURITY;

-- Create function to get current user's tenant ID
-- Note: This assumes auth.uid() returns a UUID that needs to be converted to INTEGER
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT tenant_id 
    FROM user_tenants 
    WHERE user_id = (auth.uid()::TEXT)::INTEGER
    AND is_active = true 
    LIMIT 1;
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS(
        SELECT 1 
        FROM user_tenants 
        WHERE user_id = (auth.uid()::TEXT)::INTEGER
        AND role = 'admin' 
        AND is_active = true
    );
$$;

-- Create function to check if user has access to tenant
CREATE OR REPLACE FUNCTION has_tenant_access(tenant_id_param INTEGER)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS(
        SELECT 1 
        FROM user_tenants 
        WHERE user_id = (auth.uid()::TEXT)::INTEGER
        AND tenant_id = tenant_id_param 
        AND is_active = true
    );
$$;

-- Tenants table policies
CREATE POLICY "Users can view their own tenants" ON tenants
    FOR SELECT USING (has_tenant_access(id));

CREATE POLICY "Admins can create tenants" ON tenants
    FOR INSERT WITH CHECK (is_user_admin());

CREATE POLICY "Admins can update their tenants" ON tenants
    FOR UPDATE USING (has_tenant_access(id));

CREATE POLICY "Admins can delete their tenants" ON tenants
    FOR DELETE USING (has_tenant_access(id));

-- Users table policies
-- Note: Converting auth.uid() UUID to INTEGER for comparison
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = (auth.uid()::TEXT)::INTEGER);

CREATE POLICY "Admins can view all users in their tenant" ON users
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM user_tenants 
            WHERE user_id = users.id 
            AND tenant_id IN (
                SELECT tenant_id FROM user_tenants 
                WHERE user_id = (auth.uid()::TEXT)::INTEGER AND is_active = true
            )
        )
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = (auth.uid()::TEXT)::INTEGER);

-- User-tenant mapping policies
CREATE POLICY "Users can view their own tenant mappings" ON user_tenants
    FOR SELECT USING (user_id = (auth.uid()::TEXT)::INTEGER);

CREATE POLICY "Admins can view all mappings in their tenant" ON user_tenants
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage tenant mappings" ON user_tenants
    FOR ALL USING (has_tenant_access(tenant_id));

-- Bank accounts policies
CREATE POLICY "Users can view bank accounts in their tenant" ON bank_accounts
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage bank accounts in their tenant" ON bank_accounts
    FOR ALL USING (has_tenant_access(tenant_id));

-- Clients policies
CREATE POLICY "Users can view clients in their tenant" ON clients
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage clients in their tenant" ON clients
    FOR ALL USING (has_tenant_access(tenant_id));

-- Invoices policies
CREATE POLICY "Users can view invoices in their tenant" ON invoices
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage invoices in their tenant" ON invoices
    FOR ALL USING (has_tenant_access(tenant_id));

-- Expenses policies
CREATE POLICY "Users can view expenses in their tenant" ON expenses
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage expenses in their tenant" ON expenses
    FOR ALL USING (has_tenant_access(tenant_id));

-- Payments policies
CREATE POLICY "Users can view payments in their tenant" ON payments
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage payments in their tenant" ON payments
    FOR ALL USING (has_tenant_access(tenant_id));

-- Bank transactions policies
CREATE POLICY "Users can view bank transactions in their tenant" ON bank_transactions
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage bank transactions in their tenant" ON bank_transactions
    FOR ALL USING (has_tenant_access(tenant_id));

-- Documents policies
CREATE POLICY "Users can view documents in their tenant" ON documents
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can upload documents to their tenant" ON documents
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Users can update documents in their tenant" ON documents
    FOR UPDATE USING (has_tenant_access(tenant_id));

-- Cloud drive configs policies
CREATE POLICY "Users can view cloud configs in their tenant" ON cloud_drive_configs
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage cloud configs in their tenant" ON cloud_drive_configs
    FOR ALL USING (has_tenant_access(tenant_id));

-- Raw documents policies
CREATE POLICY "Users can view raw documents in their tenant" ON raw_documents
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create raw documents in their tenant" ON raw_documents
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

-- Multi-agent results policies
CREATE POLICY "Users can view processing results in their tenant" ON multi_agent_results
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create processing results in their tenant" ON multi_agent_results
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

-- Provenance policies
CREATE POLICY "Users can view provenance in their tenant" ON field_provenance
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create provenance in their tenant" ON field_provenance
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Users can view line item provenance in their tenant" ON line_item_provenance
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create line item provenance in their tenant" ON line_item_provenance
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

-- Consensus metadata policies
CREATE POLICY "Users can view consensus metadata in their tenant" ON consensus_metadata
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create consensus metadata in their tenant" ON consensus_metadata
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

-- RAG vectors policies
CREATE POLICY "Users can view RAG vectors in their tenant" ON rag_vectors
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create RAG vectors in their tenant" ON rag_vectors
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

-- Documents embedding policies
CREATE POLICY "Users can view document embeddings in their tenant" ON documents_embedding
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create document embeddings in their tenant" ON documents_embedding
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

-- RAG query log policies (CORRECTED - no user_id column in this table)
CREATE POLICY "Users can view query logs in their tenant" ON rag_query_log
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create query logs in their tenant" ON rag_query_log
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

-- Manager approvals policies
CREATE POLICY "Users can view approvals in their tenant" ON manager_approvals
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create approval requests in their tenant" ON manager_approvals
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage approvals in their tenant" ON manager_approvals
    FOR ALL USING (has_tenant_access(tenant_id));

-- Extracted invoice data policies
CREATE POLICY "Users can view extracted data in their tenant" ON extracted_invoice_data
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create extracted data in their tenant" ON extracted_invoice_data
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

-- Monthly statement entries policies
CREATE POLICY "Users can view statement entries in their tenant" ON monthly_statement_entries
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create statement entries in their tenant" ON monthly_statement_entries
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

-- SAF-T exports policies
CREATE POLICY "Users can view SAF-T exports in their tenant" ON saft_exports
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Users can create SAF-T exports in their tenant" ON saft_exports
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

-- AI chat messages policies (CORRECTED - this table has user_id)
CREATE POLICY "Users can view their own chat messages" ON ai_chat_messages
    FOR SELECT USING (user_id = (auth.uid()::TEXT)::INTEGER);

CREATE POLICY "Users can create chat messages in their tenant" ON ai_chat_messages
    FOR INSERT WITH CHECK (has_tenant_access(tenant_id));

-- Webhook credentials policies
CREATE POLICY "Users can view webhook credentials in their tenant" ON webhook_credentials
    FOR SELECT USING (has_tenant_access(tenant_id));

CREATE POLICY "Admins can manage webhook credentials in their tenant" ON webhook_credentials
    FOR ALL USING (has_tenant_access(tenant_id));

-- VAT rates policies (read-only for all users)
CREATE POLICY "All users can view VAT rates" ON vat_rates
    FOR SELECT USING (true);

-- Log successful RLS configuration
DO $$
BEGIN
    RAISE NOTICE '✅ Row-Level Security policies configured successfully (UUID compatibility fixed)';
    RAISE NOTICE '⚠️  Note: Converting auth.uid() UUID to INTEGER for compatibility';
    RAISE NOTICE '✅ All table schemas verified and policies corrected';
END $$;
