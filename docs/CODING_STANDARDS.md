# Estándares de Código y Buenas Prácticas

## 📋 **General**

### **Naming Conventions**
- **Archivos**: `kebab-case` (ej: `user-profile.tsx`)
- **Componentes**: `PascalCase` (ej: `UserProfile`)
- **Funciones**: `camelCase` (ej: `getUserProfile`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `MAX_RETRY_ATTEMPTS`)
- **Interfaces**: `PascalCase` con prefijo `I` opcional (ej: `UserProfile` o `IUserProfile`)

### **Estructura de Archivos**
```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de UI base
│   └── layout/         # Componentes de layout
├── lib/                # Utilidades y servicios
├── shared/             # Tipos, esquemas y utilidades compartidas
├── server/             # Lógica del servidor
│   ├── agents/         # Agentes de procesamiento
│   ├── controllers/    # Controladores de API
│   └── auth/           # Autenticación y autorización
└── app/                # Páginas y rutas de Next.js
```

## 🔧 **TypeScript**

### **Configuración**
- Usar `strict: true` en `tsconfig.json`
- Evitar `any` - usar tipos específicos o `unknown`
- Usar interfaces para objetos y tipos para uniones/primitivos

### **Ejemplos**
```typescript
// ✅ Bueno
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'user' | 'guest';

// ❌ Evitar
const user: any = { id: 1, name: 'John' };
```

### **Imports y Exports**
```typescript
// ✅ Usar imports específicos
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/shared/types';

// ✅ Usar barrel exports
export * from './types';
export { Button } from './Button';

// ❌ Evitar imports con *
import * as utils from './utils';
```

## ⚛️ **React**

### **Componentes**
- Usar componentes funcionales con hooks
- Mantener componentes pequeños (< 100 líneas)
- Usar `React.memo` para optimización cuando sea necesario

### **Hooks**
- Usar hooks personalizados para lógica reutilizable
- Seguir las reglas de hooks
- Usar `useCallback` y `useMemo` apropiadamente

### **Ejemplo**
```typescript
// ✅ Bueno
const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const { data, isLoading } = useUserData(user.id);
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

// ❌ Evitar
const UserProfile = (props) => {
  // Lógica compleja en el componente
  // Múltiples responsabilidades
};
```

## 🎨 **CSS y Styling**

### **Tailwind CSS**
- Usar clases de Tailwind para estilos
- Crear componentes reutilizables para patrones comunes
- Usar `@apply` para estilos complejos

### **Ejemplo**
```typescript
// ✅ Bueno
const Button: React.FC<ButtonProps> = ({ variant = 'primary', children }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
};
```

## 🗄️ **Base de Datos**

### **Esquemas**
- Usar Drizzle ORM para esquemas
- Definir tipos TypeScript para todas las tablas
- Usar migraciones para cambios de esquema

### **Ejemplo**
```typescript
// ✅ Bueno
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

## 🔐 **Seguridad**

### **Autenticación**
- Usar sesiones seguras
- Validar inputs del usuario
- Implementar rate limiting
- Usar HTTPS en producción

### **Validación**
```typescript
// ✅ Usar Zod para validación
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().min(18).max(120),
});

type ValidatedUser = z.infer<typeof userSchema>;
```

## 📝 **Documentación**

### **Comentarios**
- Documentar funciones complejas
- Usar JSDoc para APIs públicas
- Mantener README actualizado

### **Ejemplo**
```typescript
/**
 * Calcula la puntuación de confianza basada en múltiples factores
 * @param features - Características del documento para análisis
 * @param model - Modelo de ML entrenado
 * @returns Puntuación de confianza entre 0 y 1
 */
export function calculateConfidenceScore(
  features: CalibrationFeatures,
  model: MLModel
): number {
  // Implementación...
}
```

## 🧪 **Testing**

### **Estructura**
- Tests unitarios para utilidades
- Tests de integración para APIs
- Tests de componentes para UI crítica

### **Ejemplo**
```typescript
// ✅ Bueno
describe('calculateConfidenceScore', () => {
  it('should return confidence between 0 and 1', () => {
    const features = createMockFeatures();
    const model = createMockModel();
    
    const result = calculateConfidenceScore(features, model);
    
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});
```

## 🚀 **Performance**

### **Optimizaciones**
- Usar `React.memo` para componentes costosos
- Implementar lazy loading para rutas
- Optimizar imágenes con Next.js Image
- Usar CDN para assets estáticos

### **Monitoreo**
- Implementar métricas de performance
- Usar herramientas de profiling
- Monitorear bundle size

## 🔄 **Git y Workflow**

### **Commits**
- Usar mensajes descriptivos
- Seguir convención de commits
- Hacer commits pequeños y frecuentes

### **Branches**
- `main` - código de producción
- `develop` - desarrollo activo
- `feature/*` - nuevas características
- `hotfix/*` - correcciones urgentes

### **Ejemplo de Commit**
```
feat: implement ML-based confidence calibration

- Add ConfidenceCalibrator class with ML model
- Implement consensus data collection
- Add feature toggles for ML scoring
- Create comprehensive documentation

Closes #123
```

## 📊 **Métricas de Calidad**

### **Objetivos**
- **Coverage**: > 80%
- **Complexity**: < 10 por función
- **Lines**: < 500 por archivo
- **Duplication**: < 3%

### **Herramientas**
- ESLint para linting
- Prettier para formateo
- Husky para pre-commit hooks
- TypeScript para type checking

## 🎯 **Revisión de Código**

### **Checklist**
- [ ] Código compila sin errores
- [ ] Tests pasan
- [ ] Linting pasa
- [ ] Formateo es consistente
- [ ] Documentación está actualizada
- [ ] No hay código comentado
- [ ] Nombres son descriptivos
- [ ] Funciones son pequeñas y enfocadas

### **Feedback**
- Ser constructivo y específico
- Sugerir alternativas cuando sea posible
- Reconocer buenas prácticas
- Mantener discusiones técnicas

---

**Recuerda**: Los estándares de código son herramientas para mejorar la calidad y mantenibilidad del código. Sé consistente pero también pragmático.


