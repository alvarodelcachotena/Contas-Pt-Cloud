# Solución al Error de pgvector en Supabase

## 🚨 Error Actual
```
ERROR: 42704: type "vector" does not exist
LINE 11: embedding VECTOR(1536)
```

## 🔍 Causa del Problema
El error ocurre porque la extensión `pgvector` no está habilitada en tu proyecto de Supabase. Esta extensión es necesaria para usar el tipo de dato `VECTOR` que se requiere para las funcionalidades de IA y búsqueda semántica.

## ✅ Soluciones Disponibles

### Opción 1: Habilitar pgvector (Recomendado)
1. **Ve a tu proyecto Supabase** en [supabase.com](https://supabase.com)
2. **Navega a Database → Extensions**
3. **Busca "pgvector"** en la lista
4. **Haz clic en "Enable"**
5. **Espera** a que se active (puede tomar unos minutos)
6. **Ejecuta** el archivo original: `09-complete-setup.sql`

### Opción 2: Usar Versión Alternativa (Sin pgvector)
Si no puedes habilitar pgvector o quieres una solución temporal:

1. **Ejecuta** el archivo alternativo: `09-complete-setup-no-pgvector.sql`
2. **Nota**: Las funcionalidades de vectores estarán limitadas
3. **Los embeddings se almacenarán como JSONB** en lugar de VECTOR

## 📁 Archivos Alternativos Creados

- `01-enable-extensions-basic.sql` - Extensiones básicas (sin pgvector)
- `04-ai-rag-vectors-no-pgvector.sql` - Tablas AI/RAG sin pgvector
- `09-complete-setup-no-pgvector.sql` - Setup completo alternativo

## 🔄 Migración Futura a pgvector

Una vez que habilites pgvector, puedes migrar a la versión completa:

1. **Habilita pgvector** en Supabase Dashboard
2. **Ejecuta** el archivo original: `09-complete-setup.sql`
3. **Los datos existentes se mantendrán** (las tablas se crean con `IF NOT EXISTS`)

## 📊 Diferencias entre Versiones

| Característica | Con pgvector | Sin pgvector |
|----------------|---------------|---------------|
| Tipo de embedding | `VECTOR(1536)` | `JSONB` |
| Búsqueda por similitud | ✅ Completa | ⚠️ Limitada |
| Índices vectoriales | ✅ Optimizados | ❌ No disponibles |
| Rendimiento | ✅ Máximo | ⚠️ Básico |

## 🚀 Próximos Pasos Recomendados

1. **Intenta habilitar pgvector** en Supabase Dashboard
2. **Si no es posible**, usa la versión alternativa
3. **Una vez que pgvector esté disponible**, migra a la versión completa

## 📞 Soporte

Si continúas teniendo problemas:
1. Verifica que tu proyecto Supabase tenga acceso a extensiones
2. Contacta al soporte de Supabase si pgvector no aparece en la lista
3. Usa la versión alternativa mientras tanto

---

**Nota**: La versión sin pgvector es completamente funcional para la mayoría de casos de uso, solo las funcionalidades avanzadas de IA estarán limitadas.

