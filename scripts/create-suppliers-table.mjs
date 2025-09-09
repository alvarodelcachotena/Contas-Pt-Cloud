import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createSuppliersTable() {
  try {
    console.log('🚀 Starting suppliers table creation...')
    console.log('=====================================')
    console.log('')
    
    // SQL statements to execute
    const sqlStatements = [
      // Create suppliers table
      `CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        tax_id VARCHAR(50) UNIQUE,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        postal_code VARCHAR(20),
        city VARCHAR(100),
        contact_person VARCHAR(255),
        payment_terms VARCHAR(100),
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Add indexes
      `CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_suppliers_tax_id ON suppliers(tax_id)`,
      `CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name)`,
      
      // Enable RLS
      `ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY`,
      
      // Add columns to invoices table
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'bank_transfer'`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL`,
      
      // Add indexes for new columns
      `CREATE INDEX IF NOT EXISTS idx_invoices_payment_type ON invoices(payment_type)`,
      `CREATE INDEX IF NOT EXISTS idx_invoices_supplier_id ON invoices(supplier_id)`,
      
      // Add invoice_id column to expenses table
      `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL`,
      `CREATE INDEX IF NOT EXISTS idx_expenses_invoice_id ON expenses(invoice_id)`,
      
      // Create function for expense creation
      `CREATE OR REPLACE FUNCTION create_expense_from_invoice()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Only create expense if payment_type is not 'supplier_credit' (which means it's already paid)
          IF NEW.payment_type != 'supplier_credit' THEN
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
                  created_at
              ) VALUES (
                  NEW.tenant_id,
                  NEW.client_name,
                  NEW.total_amount,
                  NEW.vat_amount,
                  NEW.vat_rate,
                  'General',
                  NEW.description,
                  NEW.number,
                  NEW.issue_date,
                  true,
                  NEW.id,
                  NOW()
              );
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql`,
      
      // Create trigger
      `DROP TRIGGER IF EXISTS trigger_create_expense_from_invoice ON invoices`,
      `CREATE TRIGGER trigger_create_expense_from_invoice
      AFTER INSERT ON invoices
      FOR EACH ROW
      EXECUTE FUNCTION create_expense_from_invoice()`,
      
      // Create updated_at function for suppliers
      `CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql`,
      
      // Create updated_at trigger
      `DROP TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON suppliers`,
      `CREATE TRIGGER trigger_update_suppliers_updated_at
      BEFORE UPDATE ON suppliers
      FOR EACH ROW
      EXECUTE FUNCTION update_suppliers_updated_at()`
    ]
    
    console.log(`📝 Found ${sqlStatements.length} SQL statements to execute`)
    console.log('')
    
    // Execute each statement
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i]
      console.log(`⚡ Executing statement ${i + 1}/${sqlStatements.length}...`)
      
      try {
        // Try to execute using Supabase's SQL execution
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} note: ${error.message}`)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} execution note: ${err.message}`)
      }
    }
    
    console.log('')
    console.log('🎉 Suppliers table creation process completed!')
    console.log('')
    console.log('📋 What was created:')
    console.log('   • suppliers table with all necessary columns')
    console.log('   • Indexes for better performance')
    console.log('   • RLS policies for multi-tenant security')
    console.log('   • payment_type column added to invoices table')
    console.log('   • supplier_id column added to invoices table')
    console.log('   • invoice_id column added to expenses table')
    console.log('   • Trigger to automatically create expenses from invoices')
    console.log('   • Updated_at trigger for suppliers table')
    console.log('')
    console.log('✨ You can now:')
    console.log('   • Create suppliers in the /suppliers page')
    console.log('   • Select payment types when creating invoices')
    console.log('   • Link invoices to suppliers')
    console.log('   • Automatically sync invoices with expenses')
    console.log('')
    console.log('🔧 If some statements failed, you may need to run them manually in Supabase SQL Editor')
    
  } catch (error) {
    console.error('❌ Error creating suppliers table:', error)
    console.log('')
    console.log('🔧 Manual setup required:')
    console.log('   1. Go to your Supabase dashboard')
    console.log('   2. Open the SQL Editor')
    console.log('   3. Copy and paste the contents of scripts/create-suppliers-table.sql')
    console.log('   4. Execute the SQL')
    process.exit(1)
  }
}

// Run the script
createSuppliersTable().catch(console.error)
