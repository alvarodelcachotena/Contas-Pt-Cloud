#!/bin/bash

# Script para crear la tabla de fornecedores usando psql
# Asegúrate de tener psql instalado y configurado

echo "🏗️  Creando tabla de fornecedores..."
echo "====================================="
echo ""

# Verificar que las variables de entorno estén configuradas
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas"
    echo "   Asegúrate de tener un archivo .env con estas variables"
    exit 1
fi

# Extraer información de conexión de SUPABASE_URL
# Formato: https://your-project.supabase.co
DB_HOST=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/\.supabase\.co//')
DB_NAME="postgres"
DB_USER="postgres"
DB_PORT="5432"

echo "🔗 Conectando a: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Crear archivo temporal con el SQL
TEMP_SQL=$(mktemp)
cat > "$TEMP_SQL" << 'EOF'
-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
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
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tax_id ON suppliers(tax_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Add RLS policies for suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Policy for suppliers: users can only see suppliers from their tenant
CREATE POLICY "Users can view suppliers from their tenant" ON suppliers
    FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can insert suppliers for their tenant" ON suppliers
    FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can update suppliers from their tenant" ON suppliers
    FOR UPDATE USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can delete suppliers from their tenant" ON suppliers
    FOR DELETE USING (tenant_id = get_current_tenant_id());

-- Add payment_type column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'bank_transfer';
-- payment_type can be: 'bank_transfer', 'card', 'supplier_credit'

-- Add supplier_id column to invoices table to link with suppliers
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_invoices_payment_type ON invoices(payment_type);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_id ON invoices(supplier_id);

-- Update invoices table to sync with expenses
-- We'll create a trigger to automatically create expense records when invoices are created
CREATE OR REPLACE FUNCTION create_expense_from_invoice()
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create expenses from invoices
DROP TRIGGER IF EXISTS trigger_create_expense_from_invoice ON invoices;
CREATE TRIGGER trigger_create_expense_from_invoice
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION create_expense_from_invoice();

-- Add invoice_id column to expenses table to track the relationship
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL;

-- Create index for invoice_id in expenses
CREATE INDEX IF NOT EXISTS idx_expenses_invoice_id ON expenses(invoice_id);

-- Update the updated_at timestamp function for suppliers
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for suppliers updated_at
DROP TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON suppliers;
CREATE TRIGGER trigger_update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();
EOF

echo "📄 SQL preparado en archivo temporal"
echo ""

# Intentar ejecutar con psql
echo "⚡ Ejecutando SQL..."
if command -v psql &> /dev/null; then
    # Usar psql si está disponible
    PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$TEMP_SQL"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ ¡Tabla de fornecedores creada exitosamente!"
    else
        echo ""
        echo "❌ Error ejecutando SQL con psql"
        echo "🔧 Ejecuta manualmente el contenido de: $TEMP_SQL"
    fi
else
    echo "⚠️  psql no está instalado"
    echo "🔧 Ejecuta manualmente el contenido de: $TEMP_SQL"
    echo ""
    echo "📋 Contenido del archivo SQL:"
    echo "=============================="
    cat "$TEMP_SQL"
fi

# Limpiar archivo temporal
rm "$TEMP_SQL"

echo ""
echo "🎉 Proceso completado!"
echo ""
echo "📋 Lo que se creó:"
echo "   • Tabla suppliers con todas las columnas necesarias"
echo "   • Índices para mejor rendimiento"
echo "   • Políticas RLS para seguridad multi-tenant"
echo "   • Columna payment_type añadida a la tabla invoices"
echo "   • Columna supplier_id añadida a la tabla invoices"
echo "   • Columna invoice_id añadida a la tabla expenses"
echo "   • Trigger para crear automáticamente expenses desde invoices"
echo "   • Trigger updated_at para la tabla suppliers"
echo ""
echo "✨ Ahora puedes:"
echo "   • Crear fornecedores en la página /suppliers"
echo "   • Seleccionar tipos de pago al crear facturas"
echo "   • Vincular facturas con fornecedores"
echo "   • Sincronizar automáticamente facturas con despesas"
