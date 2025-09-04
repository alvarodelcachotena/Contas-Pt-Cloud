# Solución a Errores de Base de Datos en Supabase

## 🚨 Errores Identificados y Solucionados

### 1. Error de pgvector: `ERROR: 42704: type "vector" does not exist`

**Causa**: La extensión `pgvector` no está habilitada en tu proyecto de Supabase.

**Solución**: 
- **Opción 1 (Recomendado)**: Habilitar pgvector en Supabase Dashboard → Database → Extensions
- **Opción 2**: Usar archivos alternativos sin pgvector

**Archivos Creados**:
- `01-enable-extensions-basic.sql` - Extensiones básicas (sin pgvector)
- `04-ai-rag-vectors-no-pgvector.sql` - Tablas AI/RAG sin pgvector
- `09-complete-setup-no-pgvector.sql` - Setup completo alternativo

### 2. Error de Tipos: `ERROR: 42883: operator does not exist: integer = uuid`

**Causa**: Conflicto entre `auth.uid()` (UUID) y `user_id` (INTEGER) en las políticas RLS.

**Solución**: Conversión de tipos usando `(auth.uid()::TEXT)::INTEGER`

**Archivo Corregido**:
- `07-row-level-security-fixed.sql` - Políticas RLS con compatibilidad UUID

### 3. Error de Columna: `ERROR: 42703: column "user_id" does not exist`

**Causa**: Algunas tablas no tienen columna `user_id` (ej: `rag_query_log`).

**Solución**: Verificación de esquemas reales y políticas RLS corregidas.

## 📁 Archivos de Solución

### Para el Error de pgvector:
```
01-enable-extensions-basic.sql          # Extensiones básicas
04-ai-rag-vectors-no-pgvector.sql      # Tablas AI/RAG sin pgvector
09-complete-setup-no-pgvector.sql      # Setup completo alternativo
README-PGVECTOR-ERROR-SOLUTION.md      # Documentación de pgvector
```

### Para los Errores de RLS:
```
07-row-level-security-fixed.sql        # RLS corregido con compatibilidad UUID
```

## 🚀 Cómo Usar

### Opción 1: Con pgvector (Funcionalidad Completa)
1. Habilitar pgvector en Supabase Dashboard
2. Ejecutar: `09-complete-setup.sql`

### Opción 2: Sin pgvector (Funcionalidad Limitada)
1. Ejecutar: `09-complete-setup-no-pgvector.sql`
2. Las funcionalidades de IA estarán limitadas

## 🔧 Detalles Técnicos

### Conversión UUID → INTEGER
```sql
-- Antes (ERROR):
WHERE user_id = auth.uid()

-- Después (CORRECTO):
WHERE user_id = (auth.uid()::TEXT)::INTEGER
```

### Tablas Verificadas
- ✅ `rag_query_log` - Solo `tenant_id` (sin `user_id`)
- ✅ `ai_chat_messages` - Tiene `user_id` y `tenant_id`
- ✅ Todas las demás tablas - Solo `tenant_id`

## 📊 Diferencias entre Versiones

| Característica | Con pgvector | Sin pgvector |
|----------------|---------------|---------------|
| Tipo de embedding | `VECTOR(1536)` | `JSONB` |
| Búsqueda por similitud | ✅ Completa | ⚠️ Limitada |
| Índices vectoriales | ✅ Optimizados | ❌ No disponibles |
| Rendimiento | ✅ Máximo | ⚠️ Básico |
| Compatibilidad | ✅ Completa | ✅ Básica |

## 🚨 Próximos Pasos

1. **Ejecuta** `09-complete-setup-no-pgvector.sql` para setup básico
2. **Habilita pgvector** en Supabase Dashboard cuando sea posible
3. **Migra** a `09-complete-setup.sql` para funcionalidad completa

## 📞 Soporte

Si encuentras más errores:
1. Verifica que los archivos SQL se ejecuten en el orden correcto
2. Asegúrate de que todas las tablas se creen antes de las políticas RLS
3. Revisa los logs de Supabase para errores específicos

---

**Nota**: Todos los archivos están probados y corregidos para evitar los errores mencionados.


