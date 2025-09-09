// Script to add supplier_id column to expenses table
// This script uses fetch to make HTTP requests to Supabase

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

async function addSupplierIdToExpenses() {
    try {
        console.log('🔧 Adding supplier_id column to expenses table...');

        const sqlStatements = [
            "ALTER TABLE expenses ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL",
            "CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON expenses(supplier_id)",
            "ALTER TABLE expenses ADD COLUMN IF NOT EXISTS document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL",
            "CREATE INDEX IF NOT EXISTS idx_expenses_document_id ON expenses(document_id)"
        ];

        for (const sql of sqlStatements) {
            console.log(`📝 Executing: ${sql}`);

            try {
                const { data, error } = await executeSQL(sql);

                if (error) {
                    console.error(`❌ Error executing SQL: ${sql}`, error);
                } else {
                    console.log(`✅ Success: ${sql}`);
                }
            } catch (err) {
                console.error(`❌ Exception executing SQL: ${sql}`, err.message);
            }
        }

        console.log('✅ Completed adding columns to expenses table');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

addSupplierIdToExpenses();
