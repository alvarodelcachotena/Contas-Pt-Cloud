-- Indexes and Constraints for Contas-PT Cloud
-- This file creates additional indexes and constraints for better performance

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_tenants_nif ON tenants(nif);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_role ON user_tenants(role);
CREATE INDEX IF NOT EXISTS idx_user_tenants_is_active ON user_tenants(is_active);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant_id ON bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_iban ON bank_accounts(iban);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_active ON bank_accounts(is_active);

CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_nif ON clients(nif);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(number);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_amount ON invoices(amount);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_bank_account_id ON payments(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_tenant_id ON bank_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_account_id ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_transaction_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_type ON bank_transactions(type);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_is_reconciled ON bank_transactions(is_reconciled);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_external_id ON bank_transactions(external_id);

CREATE INDEX IF NOT EXISTS idx_vat_rates_region ON vat_rates(region);
CREATE INDEX IF NOT EXISTS idx_vat_rates_category ON vat_rates(category);
CREATE INDEX IF NOT EXISTS idx_vat_rates_effective_date ON vat_rates(effective_date);
CREATE INDEX IF NOT EXISTS idx_vat_rates_is_active ON vat_rates(is_active);

CREATE INDEX IF NOT EXISTS idx_saft_exports_tenant_id ON saft_exports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saft_exports_period_start ON saft_exports(period_start);
CREATE INDEX IF NOT EXISTS idx_saft_exports_period_end ON saft_exports(period_end);
CREATE INDEX IF NOT EXISTS idx_saft_exports_status ON saft_exports(status);
CREATE INDEX IF NOT EXISTS idx_saft_exports_generated_by ON saft_exports(generated_by);

CREATE INDEX IF NOT EXISTS idx_manager_approvals_tenant_id ON manager_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_manager_approvals_client_id ON manager_approvals(client_id);
CREATE INDEX IF NOT EXISTS idx_manager_approvals_status ON manager_approvals(status);
CREATE INDEX IF NOT EXISTS idx_manager_approvals_requested_by ON manager_approvals(requested_by);
CREATE INDEX IF NOT EXISTS idx_manager_approvals_approved_by ON manager_approvals(approved_by);

CREATE INDEX IF NOT EXISTS idx_extracted_invoice_data_tenant_id ON extracted_invoice_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_extracted_invoice_data_document_id ON extracted_invoice_data(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_invoice_data_issuer_tax_id ON extracted_invoice_data(issuer_tax_id);
CREATE INDEX IF NOT EXISTS idx_extracted_invoice_data_invoice_number ON extracted_invoice_data(invoice_number);
CREATE INDEX IF NOT EXISTS idx_extracted_invoice_data_confidence ON extracted_invoice_data(confidence);

CREATE INDEX IF NOT EXISTS idx_monthly_statement_entries_tenant_id ON monthly_statement_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monthly_statement_entries_statement_period ON monthly_statement_entries(statement_period);
CREATE INDEX IF NOT EXISTS idx_monthly_statement_entries_year ON monthly_statement_entries(year);
CREATE INDEX IF NOT EXISTS idx_monthly_statement_entries_month ON monthly_statement_entries(month);
CREATE INDEX IF NOT EXISTS idx_monthly_statement_entries_entry_type ON monthly_statement_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_monthly_statement_entries_entry_date ON monthly_statement_entries(entry_date);

-- Document processing indexes
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_confidence_score ON documents(confidence_score);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

CREATE INDEX IF NOT EXISTS idx_cloud_drive_configs_tenant_id ON cloud_drive_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cloud_drive_configs_provider ON cloud_drive_configs(provider);
CREATE INDEX IF NOT EXISTS idx_cloud_drive_configs_is_active ON cloud_drive_configs(is_active);

CREATE INDEX IF NOT EXISTS idx_raw_documents_tenant_id ON raw_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_raw_documents_processing_status ON raw_documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_raw_documents_cloud_config_id ON raw_documents(cloud_config_id);
CREATE INDEX IF NOT EXISTS idx_raw_documents_created_at ON raw_documents(created_at);

CREATE INDEX IF NOT EXISTS idx_multi_agent_results_tenant_id ON multi_agent_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_multi_agent_results_document_id ON multi_agent_results(document_id);
CREATE INDEX IF NOT EXISTS idx_multi_agent_results_confidence_score ON multi_agent_results(confidence_score);
CREATE INDEX IF NOT EXISTS idx_multi_agent_results_created_at ON multi_agent_results(created_at);

CREATE INDEX IF NOT EXISTS idx_field_provenance_tenant_id ON field_provenance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_field_provenance_document_id ON field_provenance(document_id);
CREATE INDEX IF NOT EXISTS idx_field_provenance_field_name ON field_provenance(field_name);
CREATE INDEX IF NOT EXISTS idx_field_provenance_model ON field_provenance(model);
CREATE INDEX IF NOT EXISTS idx_field_provenance_timestamp ON field_provenance(timestamp);

CREATE INDEX IF NOT EXISTS idx_line_item_provenance_tenant_id ON line_item_provenance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_line_item_provenance_document_id ON line_item_provenance(document_id);
CREATE INDEX IF NOT EXISTS idx_line_item_provenance_row_index ON line_item_provenance(row_index);
CREATE INDEX IF NOT EXISTS idx_line_item_provenance_model ON line_item_provenance(model);

CREATE INDEX IF NOT EXISTS idx_consensus_metadata_tenant_id ON consensus_metadata(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consensus_metadata_document_id ON consensus_metadata(document_id);
CREATE INDEX IF NOT EXISTS idx_consensus_metadata_agreement_level ON consensus_metadata(agreement_level);
CREATE INDEX IF NOT EXISTS idx_consensus_metadata_final_confidence ON consensus_metadata(final_confidence);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_tenant_id ON ai_chat_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_credentials_tenant_id ON webhook_credentials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_credentials_service_type ON webhook_credentials(service_type);
CREATE INDEX IF NOT EXISTS idx_webhook_credentials_is_active ON webhook_credentials(is_active);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status_date ON invoices(tenant_id, status, issue_date);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date_category ON expenses(tenant_id, expense_date, category);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_date_type ON payments(tenant_id, payment_date, type);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_tenant_account_date ON bank_transactions(tenant_id, bank_account_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_status_created ON documents(tenant_id, processing_status, created_at);

-- Log successful index creation
DO $$
BEGIN
    RAISE NOTICE '✅ Indexes and constraints created successfully';
END $$;




