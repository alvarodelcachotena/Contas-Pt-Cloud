# 🔧 SOLUCIÓN PARA LA VISTA DE CLIENTS

## 🚨 **PROBLEMAS IDENTIFICADOS:**

1. **Error de columna**: `ERROR: 42703: column "tax_id" of relation "clients" does not exist`
2. **Esquema incompleto**: La tabla `clients` no tiene todas las columnas que espera el frontend
3. **API con error**: Falta `SUPABASE_SERVICE_ROLE_KEY` en el `.env`
4. **Tabla vacía**: No hay datos de prueba para mostrar

## 💡 **SOLUCIÓN PASO A PASO:**

### **PASO 1: Corregir la tabla clients en Supabase**

Ve a tu proyecto Supabase **contas-pt-cloud** y ejecuta este SQL:

```sql
-- Agregar columnas faltantes
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Verificar la estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### **PASO 2: Insertar datos de prueba**

Ejecuta este SQL para insertar clientes de prueba:

```sql
-- Insertar tenant y user si no existen
INSERT INTO tenants (id, name, nif, address) 
VALUES (1, 'Contas-PT Cloud', '123456789', 'Lisboa, Portugal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role) 
VALUES (1, 'admin@contas-pt.com', 'hash_placeholder', 'Admin User', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_tenants (user_id, tenant_id, role) 
VALUES (1, 1, 'admin')
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Insertar clientes de prueba
INSERT INTO clients (tenant_id, name, email, phone, address, tax_id, postal_code, city, is_active) VALUES
(1, 'João Silva', 'joao.silva@empresa.pt', '+351 912 345 678', 'Rua das Flores, 123', '123456789', '1000-001', 'Lisboa', true),
(1, 'Maria Santos', 'maria.santos@consultoria.pt', '+351 923 456 789', 'Avenida da Liberdade, 456', '987654321', '4000-001', 'Porto', true),
(1, 'Pedro Costa', 'pedro.costa@tech.pt', '+351 934 567 890', 'Rua do Comércio, 789', '456789123', '3000-001', 'Coimbra', true),
(1, 'Ana Oliveira', 'ana.oliveira@design.pt', '+351 945 678 901', 'Travessa dos Artistas, 321', '789123456', '2000-001', 'Santarém', true),
(1, 'Carlos Ferreira', 'carlos.ferreira@engenharia.pt', '+351 956 789 012', 'Largo da Universidade, 654', '321654987', '5000-001', 'Braga', true)
ON CONFLICT DO NOTHING;
```

### **PASO 3: Verificar que funciona**

1. **Recarga la página** `/clients`
2. **Deberías ver 5 clientes** en la tabla
3. **Prueba el botón "Novo Cliente"** para crear un nuevo cliente
4. **Prueba la búsqueda** por nombre, email o NIF

## 🎯 **FUNCIONALIDADES IMPLEMENTADAS:**

✅ **Lista de clientes** con datos de Supabase  
✅ **Búsqueda** por nombre, email o NIF  
✅ **Crear nuevo cliente** con formulario completo  
✅ **Validación de NIF** (9 dígitos)  
✅ **Tabla responsive** con información completa  
✅ **Integración completa** con base de datos  

## 📋 **COLUMNAS DE LA TABLA CLIENTS:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL | ID único del cliente |
| `tenant_id` | INTEGER | ID del tenant (multi-tenancy) |
| `name` | TEXT | Nombre del cliente |
| `email` | TEXT | Email del cliente |
| `phone` | TEXT | Teléfono del cliente |
| `address` | TEXT | Dirección completa |
| `tax_id` | TEXT | NIF portugués (9 dígitos) |
| `postal_code` | TEXT | Código postal |
| `city` | TEXT | Ciudad |
| `is_active` | BOOLEAN | Si el cliente está activo |
| `created_at` | TIMESTAMP | Fecha de creación |

## 🚀 **PRÓXIMOS PASOS:**

1. **Ejecutar los scripts SQL** en Supabase
2. **Probar la funcionalidad** de crear y buscar clientes
3. **Verificar que los datos** se guardan correctamente
4. **Personalizar** según tus necesidades específicas

## 🔍 **ARCHIVOS MODIFICADOS:**

- ✅ `app/api/clients/route.ts` - API corregida
- ✅ `scripts/fix-clients-table.sql` - Script para corregir tabla
- ✅ `scripts/insert-test-clients.sql` - Datos de prueba
- ✅ `README-FIX-CLIENTS.md` - Esta documentación

## 📞 **SI TIENES PROBLEMAS:**

1. **Verifica que ejecutaste** los scripts SQL en Supabase
2. **Revisa la consola** del navegador para errores
3. **Verifica que la tabla** tiene todas las columnas necesarias
4. **Confirma que hay datos** en la tabla `clients`

---

**¡Con estos cambios, la vista de clients debería funcionar perfectamente!** 🎉



