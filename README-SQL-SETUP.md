# 🗄️ Contas-PT Cloud Database Setup

Esta documentación explica cómo configurar la base de datos completa para Contas-PT Cloud en Supabase.

## 📋 Archivos SQL Incluidos

### 1. **01-enable-extensions.sql**
- Habilita todas las extensiones PostgreSQL necesarias
- **pgvector**: Para embeddings de IA y búsqueda de similitud
- **uuid-ossp**: Para generación de UUIDs
- **jsonb_plpython3u**: Para operaciones JSONB avanzadas
- **pg_trgm**: Para búsqueda de texto completo
- **unaccent**: Para búsqueda sin acentos
- **pgcrypto**: Para funciones de encriptación
- **tablefunc**: Para tablas pivot
- **pg_stat_statements**: Para monitoreo de rendimiento

### 2. **02-core-tables.sql**
- **Tablas de negocio principales:**
  - `tenants` - Soporte multi-tenant
  - `users` - Usuarios del sistema
  - `user_tenants` - Mapeo usuario-tenant con roles
  - `bank_accounts` - Cuentas bancarias
  - `clients` - Clientes
  - `invoices` - Facturas
  - `expenses` - Gastos
  - `payments` - Pagos
  - `bank_transactions` - Transacciones bancarias
  - `vat_rates` - Tasas de IVA portuguesas
  - `saft_exports` - Exportaciones SAF-T
  - `manager_approvals` - Aprobaciones de gerentes
  - `extracted_invoice_data` - Datos extraídos de facturas
  - `monthly_statement_entries` - Entradas de estados mensuales

### 3. **03-document-processing.sql**
- **Tablas de procesamiento de documentos:**
  - `documents` - Documentos del sistema
  - `cloud_drive_configs` - Configuraciones de almacenamiento en la nube
  - `raw_documents` - Documentos sin procesar
  - `multi_agent_results` - Resultados de procesamiento multi-agente
  - `field_provenance` - Metadatos de proveniencia a nivel de campo
  - `line_item_provenance` - Metadatos de proveniencia de líneas de detalle
  - `consensus_metadata` - Metadatos de consenso
  - `ai_chat_messages` - Mensajes del chat de IA
  - `webhook_credentials` - Credenciales de webhooks

### 4. **04-ai-rag-vectors.sql**
- **Tablas de IA y RAG:**
  - `rag_vectors` - Vectores de documentos para búsqueda de similitud
  - `documents_embedding` - Embeddings de documentos con columna vector
  - `rag_query_log` - Log de consultas RAG para auditoría
- **Índices vectoriales optimizados** para búsqueda de similitud

### 5. **05-indexes-and-constraints.sql**
- **Índices de rendimiento** para todas las tablas
- **Índices compuestos** para patrones de consulta comunes
- **Índices vectoriales** para búsqueda de similitud
- **Restricciones de integridad referencial**

### 6. **06-sample-data.sql**
- **Datos de ejemplo** para testing y desarrollo
- **Tenants de ejemplo** (DIAMOND NXT, GÉNERO SUMPTUOSO)
- **Usuarios de ejemplo** con roles
- **Clientes, facturas, gastos** de ejemplo
- **Configuraciones bancarias** de ejemplo
- **Datos de IVA** portugueses

### 7. **07-row-level-security.sql**
- **Políticas RLS** para aislamiento multi-tenant
- **Funciones de seguridad** para verificación de acceso
- **Políticas granulares** por tipo de operación
- **Aislamiento completo** entre tenants

### 8. **08-functions-and-triggers.sql**
- **Funciones útiles:**
  - Cálculo automático de IVA
  - Actualización automática de saldos bancarios
  - Generación de números de factura
  - Cálculo de totales mensuales
  - Resumen de clientes
  - Validación de NIF portugués
  - Estadísticas de documentos
- **Triggers automáticos** para mantener consistencia de datos

### 9. **09-complete-setup.sql**
- **Script principal** que ejecuta todos los archivos en orden
- **Transacción completa** para rollback en caso de error
- **Verificación final** del setup
- **Mensajes de progreso** detallados

## 🚀 Instalación

### Opción 1: Ejecutar script completo (Recomendado)
```sql
-- En Supabase SQL Editor
\i 09-complete-setup.sql
```

### Opción 2: Ejecutar archivos individualmente
```sql
-- En orden secuencial
\i 01-enable-extensions.sql
\i 02-core-tables.sql
\i 03-document-processing.sql
\i 04-ai-rag-vectors.sql
\i 05-indexes-and-constraints.sql
\i 06-sample-data.sql
\i 07-row-level-security.sql
\i 08-functions-and-triggers.sql
```

## 🔧 Verificación del Setup

### Verificar tablas creadas
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Verificar extensiones habilitadas
```sql
SELECT extname, extversion 
FROM pg_extension 
ORDER BY extname;
```

### Verificar datos de ejemplo
```sql
SELECT * FROM tenants;
SELECT * FROM users;
SELECT * FROM clients LIMIT 5;
```

### Verificar políticas RLS
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
ORDER BY tablename, policyname;
```

## 🏗️ Estructura de la Base de Datos

### Arquitectura Multi-Tenant
```
tenants (1) ←→ (N) user_tenants (N) ←→ (1) users
     ↓
(N) [bank_accounts, clients, invoices, expenses, payments, documents, etc.]
```

### Flujo de Procesamiento de Documentos
```
raw_documents → documents → multi_agent_results → field_provenance
     ↓              ↓              ↓                    ↓
cloud_sync    processing    consensus_metadata    line_item_provenance
```

### Sistema de Vectores RAG
```
documents → documents_embedding (vector) → rag_vectors → similarity_search
```

## 🔒 Seguridad

### Row-Level Security (RLS)
- **Aislamiento completo** entre tenants
- **Políticas granulares** por operación (SELECT, INSERT, UPDATE, DELETE)
- **Verificación de roles** (admin, user)
- **Funciones de seguridad** para verificación de acceso

### Funciones de Seguridad
- `get_current_user_tenant_id()` - Obtiene el tenant del usuario actual
- `is_user_admin()` - Verifica si el usuario es administrador
- `has_tenant_access(tenant_id)` - Verifica acceso a un tenant específico

## 📊 Características Principales

### Soporte Multi-Tenant
- **Aislamiento completo** de datos entre empresas
- **Roles granulares** (admin, user)
- **Políticas de acceso** por tenant

### Procesamiento de Documentos
- **Soporte para múltiples formatos** (PDF, imágenes)
- **Procesamiento multi-agente** con consenso
- **Tracking de proveniencia** a nivel de campo
- **Metadatos de procesamiento** completos

### IA y RAG
- **Embeddings vectoriales** para búsqueda semántica
- **Búsqueda de similitud** optimizada
- **Logging de consultas** para auditoría
- **Múltiples modelos** de IA soportados

### Gestión Financiera
- **Facturación completa** con IVA portugués
- **Gestión de gastos** y pagos
- **Reconciliación bancaria** automática
- **Exportaciones SAF-T** para auditoría fiscal

## 🚨 Consideraciones Importantes

### Antes de Ejecutar
1. **Verificar permisos** de administrador en Supabase
2. **Hacer backup** de la base de datos existente
3. **Revisar espacio** disponible en el proyecto
4. **Verificar límites** de extensiones del plan

### Después de Ejecutar
1. **Verificar todas las tablas** fueron creadas
2. **Probar políticas RLS** con diferentes usuarios
3. **Verificar funciones** y triggers funcionan correctamente
4. **Probar datos de ejemplo** con la aplicación

### Mantenimiento
- **Monitorear uso** de extensiones vectoriales
- **Revisar logs** de consultas RAG
- **Optimizar índices** según patrones de uso
- **Actualizar políticas** RLS según necesidades

## 🆘 Troubleshooting

### Error: Extension not available
```sql
-- Verificar extensiones disponibles
SELECT * FROM pg_available_extensions WHERE name = 'vector';

-- Contactar soporte de Supabase si no está disponible
```

### Error: Permission denied
```sql
-- Verificar rol del usuario
SELECT current_user, current_setting('role');

-- Ejecutar como superuser o contactar administrador
```

### Error: Table already exists
```sql
-- Los scripts usan CREATE TABLE IF NOT EXISTS
-- Si hay conflictos, revisar nombres de tablas existentes
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

## 📞 Soporte

Para problemas específicos con la configuración de la base de datos:

1. **Revisar logs** de Supabase
2. **Verificar permisos** del usuario
3. **Consultar documentación** de PostgreSQL
4. **Contactar equipo** de desarrollo

---

**Última actualización**: Enero 2025  
**Versión**: 1.0.0  
**Compatibilidad**: Supabase, PostgreSQL 15+

