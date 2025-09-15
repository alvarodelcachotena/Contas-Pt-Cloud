-- Functions and Triggers for Contas-PT Cloud
-- This file creates useful database functions and triggers

-- Function to automatically calculate VAT amounts
CREATE OR REPLACE FUNCTION calculate_vat_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate VAT amount if not provided
    IF NEW.vat_amount IS NULL AND NEW.vat_rate IS NOT NULL AND NEW.amount IS NOT NULL THEN
        NEW.vat_amount := ROUND((NEW.amount * NEW.vat_rate / 100)::NUMERIC, 2);
    END IF;
    
    -- Calculate total amount if not provided
    IF NEW.total_amount IS NULL AND NEW.amount IS NOT NULL THEN
        NEW.total_amount := NEW.amount + COALESCE(NEW.vat_amount, 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update bank account balance
CREATE OR REPLACE FUNCTION update_bank_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update balance when new transaction is inserted
        UPDATE bank_accounts 
        SET balance = balance + NEW.amount 
        WHERE id = NEW.bank_account_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update balance when transaction amount changes
        UPDATE bank_accounts 
        SET balance = balance - OLD.amount + NEW.amount 
        WHERE id = NEW.bank_account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update balance when transaction is deleted
        UPDATE bank_accounts 
        SET balance = balance - OLD.amount 
        WHERE id = OLD.bank_account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(tenant_id_param INTEGER)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    year TEXT;
    prefix TEXT;
BEGIN
    year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    prefix := 'INV-' || year || '-';
    
    -- Get the next invoice number for this tenant and year
    SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices 
    WHERE tenant_id = tenant_id_param 
    AND number LIKE prefix || '%';
    
    RETURN prefix || LPAD(next_number::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate monthly totals
CREATE OR REPLACE FUNCTION calculate_monthly_totals(
    tenant_id_param INTEGER,
    year_param INTEGER,
    month_param INTEGER
)
RETURNS TABLE(
    total_invoices NUMERIC,
    total_expenses NUMERIC,
    total_payments NUMERIC,
    net_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(i.total_amount), 0) as total_invoices,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COALESCE(SUM(p.amount), 0) as total_payments,
        COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(e.amount), 0) + COALESCE(SUM(p.amount), 0) as net_amount
    FROM tenants t
    LEFT JOIN invoices i ON t.id = i.tenant_id 
        AND EXTRACT(YEAR FROM i.issue_date) = year_param 
        AND EXTRACT(MONTH FROM i.issue_date) = month_param
    LEFT JOIN expenses e ON t.id = e.tenant_id 
        AND EXTRACT(YEAR FROM e.expense_date) = year_param 
        AND EXTRACT(MONTH FROM e.expense_date) = month_param
    LEFT JOIN payments p ON t.id = p.tenant_id 
        AND EXTRACT(YEAR FROM p.payment_date) = year_param 
        AND EXTRACT(MONTH FROM p.payment_date) = month_param
    WHERE t.id = tenant_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get client summary
CREATE OR REPLACE FUNCTION get_client_summary(tenant_id_param INTEGER)
RETURNS TABLE(
    client_id INTEGER,
    client_name TEXT,
    total_invoiced NUMERIC,
    total_paid NUMERIC,
    outstanding_amount NUMERIC,
    last_invoice_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        COALESCE(SUM(i.total_amount), 0) as total_invoiced,
        COALESCE(SUM(p.amount), 0) as total_paid,
        COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(p.amount), 0) as outstanding_amount,
        MAX(i.issue_date) as last_invoice_date
    FROM clients c
    LEFT JOIN invoices i ON c.id = i.client_id AND i.tenant_id = tenant_id_param
    LEFT JOIN payments p ON i.id = p.invoice_id AND p.type = 'income'
    WHERE c.tenant_id = tenant_id_param
    GROUP BY c.id, c.name
    ORDER BY outstanding_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to validate Portuguese NIF
CREATE OR REPLACE FUNCTION validate_portuguese_nif(nif_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    nif_clean TEXT;
    check_digit INTEGER;
    sum_digits INTEGER := 0;
    i INTEGER;
    digit INTEGER;
BEGIN
    -- Remove spaces and dashes
    nif_clean := REGEXP_REPLACE(nif_param, '[^0-9]', '', 'g');
    
    -- Check if it's exactly 9 digits
    IF LENGTH(nif_clean) != 9 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if it's all digits
    IF nif_clean !~ '^[0-9]+$' THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate check digit
    FOR i IN 1..8 LOOP
        digit := CAST(SUBSTRING(nif_clean FROM i FOR 1) AS INTEGER);
        sum_digits := sum_digits + digit * (10 - i);
    END LOOP;
    
    check_digit := (11 - (sum_digits % 11)) % 10;
    
    -- Compare with the last digit
    RETURN check_digit = CAST(SUBSTRING(nif_clean FROM 9 FOR 1) AS INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Function to get document processing statistics
CREATE OR REPLACE FUNCTION get_document_stats(tenant_id_param INTEGER, days_back INTEGER DEFAULT 30)
RETURNS TABLE(
    total_documents INTEGER,
    completed_documents INTEGER,
    processing_documents INTEGER,
    failed_documents INTEGER,
    avg_confidence NUMERIC,
    total_processing_time_ms BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_documents,
        COUNT(*) FILTER (WHERE processing_status = 'completed') as completed_documents,
        COUNT(*) FILTER (WHERE processing_status = 'processing') as processing_documents,
        COUNT(*) FILTER (WHERE processing_status = 'failed') as failed_documents,
        ROUND(AVG(confidence_score)::NUMERIC, 2) as avg_confidence,
        SUM(COALESCE(file_size, 0)) as total_processing_time_ms
    FROM documents 
    WHERE tenant_id = tenant_id_param 
    AND created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
-- Trigger for automatic VAT calculation on invoices
CREATE TRIGGER trigger_calculate_vat_invoices
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_vat_amount();

-- Trigger for automatic VAT calculation on expenses
CREATE TRIGGER trigger_calculate_vat_expenses
    BEFORE INSERT OR UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION calculate_vat_amount();

-- Trigger for automatic bank balance updates
CREATE TRIGGER trigger_update_bank_balance
    AFTER INSERT OR UPDATE OR DELETE ON bank_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_balance();

-- Trigger to update document processing status
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update document status when multi-agent results are inserted
    IF TG_OP = 'INSERT' THEN
        UPDATE documents 
        SET processing_status = 'completed',
            confidence_score = NEW.confidence_score,
            extracted_data = NEW.extracted_data
        WHERE tenant_id = NEW.tenant_id 
        AND filename = NEW.document_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_status
    AFTER INSERT ON multi_agent_results
    FOR EACH ROW
    EXECUTE FUNCTION update_document_status();

-- Log successful function and trigger creation
DO $$
BEGIN
    RAISE NOTICE '✅ Functions and triggers created successfully';
END $$;




