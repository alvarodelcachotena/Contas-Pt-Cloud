// Script to create missing expenses for existing invoices
import https from 'https';
import { config } from 'dotenv';

config();

async function executeSQL(sql) {
    return new Promise((resolve, reject) => {
        const url = new URL(process.env.SUPABASE_URL);
        const postData = JSON.stringify({
            query: sql
        });

        const options = {
            hostname: url.hostname,
            port: 443,
            path: '/rest/v1/rpc/exec',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ data: result, error: null });
                } catch (e) {
                    resolve({ data: null, error: e.message });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function createMissingExpenses() {
    try {
        console.log('🔧 Creating missing expenses for existing invoices...');

        // Create expenses for invoices that don't have corresponding expenses
        const createExpensesSQL = `
      INSERT INTO expenses (
        tenant_id,
        vendor,
        amount,
        vat_amount,
        vat_rate,
        category,
        description,
        receipt_number,
        expense_date,
        is_deductible,
        invoice_id,
        supplier_id,
        created_at
      )
      SELECT 
        i.tenant_id,
        i.client_name,
        i.total_amount,
        i.vat_amount,
        i.vat_rate,
        'General',
        COALESCE(i.description, 'Gasto creado automáticamente desde factura'),
        i.number,
        i.issue_date,
        true,
        i.id,
        i.supplier_id,
        NOW()
      FROM invoices i
      LEFT JOIN expenses e ON e.invoice_id = i.id
      WHERE e.id IS NULL 
        AND i.payment_type != 'supplier_credit'
        AND i.tenant_id = 1
    `;

        console.log('📝 Creating missing expenses...');

        const { data, error } = await executeSQL(createExpensesSQL);

        if (error) {
            console.error('❌ Error creating expenses:', error);
        } else {
            console.log('✅ Successfully created missing expenses');
            console.log('📊 Result:', data);
        }

        // Verify the results
        console.log('🔍 Verifying results...');
        const verifySQL = `
      SELECT 
        COUNT(*) as total_invoices,
        (SELECT COUNT(*) FROM expenses WHERE tenant_id = 1) as total_expenses,
        (SELECT COUNT(*) FROM expenses WHERE tenant_id = 1 AND invoice_id IS NOT NULL) as linked_expenses
      FROM invoices 
      WHERE tenant_id = 1
    `;

        const { data: verifyData, error: verifyError } = await executeSQL(verifySQL);

        if (verifyError) {
            console.error('❌ Error verifying:', verifyError);
        } else {
            console.log('📊 Verification results:', verifyData);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createMissingExpenses();
