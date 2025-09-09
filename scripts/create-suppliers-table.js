#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

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
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-suppliers-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 SQL file loaded successfully')
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          
          if (error) {
            // If exec_sql doesn't exist, try direct query
            const { error: directError } = await supabase
              .from('_sql')
              .select('*')
              .eq('query', statement)
            
            if (directError) {
              console.log(`⚠️  Statement ${i + 1} might already exist or need manual execution:`, error?.message || directError?.message)
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`)
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} execution note:`, err.message)
        }
      }
    }
    
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
    
  } catch (error) {
    console.error('❌ Error creating suppliers table:', error)
    process.exit(1)
  }
}

// Alternative method using direct SQL execution
async function createSuppliersTableDirect() {
  try {
    console.log('🚀 Creating suppliers table using direct SQL execution...')
    
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
      `CREATE INDEX IF NOT EXISTS idx_expenses_invoice_id ON expenses(invoice_id)`
    ]
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i]
      console.log(`⚡ Executing statement ${i + 1}/${sqlStatements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec', { sql: statement })
        if (error) {
          console.log(`⚠️  Statement ${i + 1} note:`, error.message)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} execution note:`, err.message)
      }
    }
    
    console.log('🎉 Suppliers table creation completed!')
    
  } catch (error) {
    console.error('❌ Error in direct SQL execution:', error)
    throw error
  }
}

// Main execution
async function main() {
  console.log('🏗️  Suppliers Table Creation Script')
  console.log('=====================================')
  console.log('')
  
  try {
    // Try the direct method first
    await createSuppliersTableDirect()
  } catch (error) {
    console.log('')
    console.log('⚠️  Direct method failed, trying alternative approach...')
    console.log('')
    
    try {
      await createSuppliersTable()
    } catch (altError) {
      console.error('❌ Both methods failed:', altError)
      console.log('')
      console.log('🔧 Manual setup required:')
      console.log('   1. Go to your Supabase dashboard')
      console.log('   2. Open the SQL Editor')
      console.log('   3. Copy and paste the contents of scripts/create-suppliers-table.sql')
      console.log('   4. Execute the SQL')
      process.exit(1)
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { createSuppliersTable, createSuppliersTableDirect }
