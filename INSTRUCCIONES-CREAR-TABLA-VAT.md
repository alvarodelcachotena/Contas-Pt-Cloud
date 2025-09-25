# Instrucciones para Crear la Tabla whatsapp_vat_data

## Problema
La vista de IVA está mostrando un error porque la tabla `whatsapp_vat_data` no existe en la base de datos.

## Solución
Necesitas crear la tabla manualmente en tu dashboard de Supabase.

## Pasos

### 1. Ir al Dashboard de Supabase
1. Abre tu proyecto en [supabase.com](https://supabase.com)
2. Ve a la sección **SQL Editor**

### 2. Ejecutar el SQL
Copia y pega el siguiente SQL en el editor:

```sql
-- Tabla para almacenar datos de IVA procesados por WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_vat_data (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    period VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Datos de la factura/gasto
    vendor_name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL, -- Porcentaje de IVA (23, 6, 13, etc.)
    vat_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Metadatos
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('invoice', 'expense')),
    processing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    whatsapp_message_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_whatsapp_vat_data_tenant_period ON whatsapp_vat_data(tenant_id, period);
CREATE INDEX IF NOT EXISTS idx_whatsapp_vat_data_document_type ON whatsapp_vat_data(document_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_vat_data_processing_date ON whatsapp_vat_data(processing_date);

-- Comentarios para documentación
COMMENT ON TABLE whatsapp_vat_data IS 'Datos de IVA procesados desde WhatsApp';
COMMENT ON COLUMN whatsapp_vat_data.period IS 'Período en formato YYYY-MM';
COMMENT ON COLUMN whatsapp_vat_data.vat_rate IS 'Porcentaje de IVA aplicado (23, 6, 13, etc.)';
COMMENT ON COLUMN whatsapp_vat_data.document_type IS 'Tipo de documento: invoice o expense';
COMMENT ON COLUMN whatsapp_vat_data.whatsapp_message_id IS 'ID del mensaje de WhatsApp original';
```

### 3. Ejecutar el SQL
1. Haz clic en **Run** para ejecutar el SQL
2. Deberías ver un mensaje de éxito

### 4. Verificar
Después de crear la tabla:
1. Ve a la vista de IVA en tu aplicación
2. Deberías ver "0 declaraciones" en lugar del error
3. Los botones de eliminación funcionarán correctamente

## Estructura de la Tabla

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | Clave primaria |
| `tenant_id` | INTEGER | ID del tenant |
| `period` | VARCHAR(7) | Período en formato YYYY-MM |
| `invoice_id` | INTEGER | Referencia a la factura |
| `expense_id` | INTEGER | Referencia al gasto |
| `document_id` | INTEGER | Referencia al documento |
| `vendor_name` | TEXT | Nombre del proveedor/cliente |
| `amount` | DECIMAL(12,2) | Importe base |
| `vat_rate` | DECIMAL(5,2) | Porcentaje de IVA |
| `vat_amount` | DECIMAL(12,2) | Importe de IVA |
| `total_amount` | DECIMAL(12,2) | Importe total |
| `document_type` | VARCHAR(20) | Tipo: 'invoice' o 'expense' |
| `processing_date` | DATE | Fecha de procesamiento |
| `whatsapp_message_id` | TEXT | ID del mensaje de WhatsApp |

## Funcionalidad
Una vez creada la tabla:
- ✅ La vista de IVA mostrará datos reales
- ✅ Los cálculos de IVA serán precisos
- ✅ Los botones de eliminación funcionarán
- ✅ Los datos de WhatsApp se guardarán automáticamente

