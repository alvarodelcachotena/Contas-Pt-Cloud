# 🧪 **Cómo Probar el Dashboard Conectado**

## ✅ **Problemas Resueltos**

1. **Error de Hidratación** → Corregido en `app/layout.tsx`
2. **7 Recuadros Conectados** → Todos funcionando con base de datos
3. **Datos de Teste** → SQL completo con datos realistas

## 🎯 **Los 7 Recuadros del Dashboard**

| # | Recuadro | Métrica | Tabla | Valor Esperado |
|---|----------|---------|-------|----------------|
| 1 | 🧾 **Faturas** | `totalInvoices` | `invoices` | **5** |
| 2 | 💸 **Despesas** | `totalExpenses` | `expenses` | **6** |
| 3 | 📄 **Documentos** | `totalDocuments` | `documents` + `raw_documents` | **11** |
| 4 | 👥 **Clientes** | `totalClients` | `clients` | **3** |
| 5 | 💚 **Receita Total** | `totalRevenue` | `invoices` (pagas) | **€12,177.00** |
| 6 | 🔴 **Despesas Total** | `totalExpenseAmount` | `expenses` | **€4,150.00** |
| 7 | 💰 **Lucro Líquido** | `netProfit` | Calculado | **€8,027.00** |

## 🚀 **Pasos para Probar**

### **Paso 1: Ejecutar Setup de Base de Datos**
```sql
-- Ejecutar en Supabase SQL Editor
\i 09-complete-setup-no-pgvector.sql
```

### **Paso 2: Insertar Datos de Teste**
```sql
-- Ejecutar en Supabase SQL Editor
\i scripts/test-dashboard-data-complete.sql
```

### **Paso 3: Verificar Inserción**
```sql
-- Verificar que los datos se insertaron correctamente
SELECT COUNT(*) as total_invoices FROM invoices WHERE tenant_id = 1;
SELECT COUNT(*) as total_expenses FROM expenses WHERE tenant_id = 1;
SELECT COUNT(*) as total_documents FROM documents WHERE tenant_id = 1;
SELECT COUNT(*) as total_raw_documents FROM raw_documents WHERE tenant_id = 1;
SELECT COUNT(*) as total_clients FROM clients WHERE tenant_id = 1;
```

### **Paso 4: Acceder al Dashboard**
- Navegar a `/dashboard`
- Verificar que los números coincidan con los esperados
- Comprobar actualización automática (30 segundos)

## 📊 **Datos de Teste Incluidos**

### **Empresa de Teste**
- **Nombre**: TechSolutions Portugal Lda
- **NIF**: 500123456
- **Dirección**: Rua das Flores, 123, Lisboa

### **Clientes**
1. **Empresa A Lda** - Porto
2. **Startup B Lda** - Braga  
3. **Consultoria C Lda** - Coimbra

### **Faturas (5 total)**
- **4 Pagas**: €12,177.00 total
- **1 Pendente**: €1,107.00
- **Total**: €13,284.00

### **Despesas (6 total)**
- **Total**: €4,150.00
- Categorías: Serviços, Equipamentos, Marketing, Seguros

### **Documentos**
- **8 Processados**: Faturas y despesas ya procesadas
- **3 Pendentes**: Documentos aguardando processamento
- **Total**: 11 documentos

## 🔍 **Verificación de Métricas**

### **Contadores Principales**
```sql
-- Verificar contadores
SELECT 
  (SELECT COUNT(*) FROM invoices WHERE tenant_id = 1) as total_invoices,
  (SELECT COUNT(*) FROM expenses WHERE tenant_id = 1) as total_expenses,
  (SELECT COUNT(*) FROM documents WHERE tenant_id = 1) + 
  (SELECT COUNT(*) FROM raw_documents WHERE tenant_id = 1) as total_documents,
  (SELECT COUNT(*) FROM clients WHERE tenant_id = 1) as total_clients;
```

### **Cálculos Financieros**
```sql
-- Verificar receita (faturas pagas)
SELECT SUM(total_amount) as total_revenue 
FROM invoices 
WHERE tenant_id = 1 AND status = 'paid';

-- Verificar despesas
SELECT SUM(amount) as total_expenses 
FROM expenses 
WHERE tenant_id = 1;

-- Calcular lucro
SELECT 
  (SELECT SUM(total_amount) FROM invoices WHERE tenant_id = 1 AND status = 'paid') -
  (SELECT SUM(amount) FROM expenses WHERE tenant_id = 1) as net_profit;
```

## 🎉 **Resultado Esperado**

Después de ejecutar el script, tu dashboard debería mostrar:

- **🧾 Faturas**: 5
- **💸 Despesas**: 6  
- **📄 Documentos**: 11 (8 ✓ + 3 ⏳)
- **👥 Clientes**: 3
- **💚 Receita Total**: €12,177.00
- **🔴 Despesas Total**: €4,150.00
- **💰 Lucro Líquido**: €8,027.00

## 🚨 **Solución de Problemas**

### **Si los números no coinciden:**
1. Verificar que el script se ejecutó completamente
2. Comprobar que no hay errores en la consola
3. Verificar que el tenant_id es 1
4. Revisar logs de la API `/api/dashboard/metrics`

### **Si hay errores de conexión:**
1. Verificar variables de entorno en `.env`
2. Comprobar que Supabase esté funcionando
3. Verificar que las tablas existan

## ✅ **Confirmación de Funcionamiento**

Una vez que todo esté funcionando, verás:
- **Datos reales** en todos los recuadros
- **Actualización automática** cada 30 segundos
- **Cálculos correctos** de receita, despesas y lucro
- **Status de processamento** con barra de progreso

---

**¡Ahora tu dashboard está completamente conectado y funcionando con datos reales!** 🚀
