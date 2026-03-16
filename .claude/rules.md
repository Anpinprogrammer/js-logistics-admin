# Reglas de Desarrollo del Proyecto

## Stack Tecnológico
- **Frontend:** ReactJS (Functional Components con Hooks).
- **Lenguaje:** TypeScript (Strict Mode).
- **Estilos:** Tailwind CSS.
- **Estado:** [Zustand / Context API - elige uno].
- **Backend Relacionado:** Node.js (Patrón MVC).

## Estándares de Código
- **Componentes:** Usar siempre Named Exports. Un archivo por componente.
- **TypeScript:** - Preferir `interface` sobre `type` para definiciones de objetos y props.
  - Prohibido el uso de `any`. Si un tipo es desconocido, usar `unknown`.
  - Los tipos globales deben ir en `src/types/`.
- **Naming:** - Componentes: PascalCase (ej. `ShipmentCard.tsx`).
  - Funciones y variables: camelCase.
  - Archivos de utilidad: kebab-case.
- **Arquitectura:** Mantener la lógica de negocio en `src/hooks/` o `src/services/`, no dentro del JSX del componente.

## Flujo de Trabajo
- Antes de crear una función nueva, verifica si existe una similar en `src/utils/`.
- Cada vez que crees un componente en `src/components/features/`, genera automáticamente su archivo de pruebas unitarias `.test.tsx` en la misma carpeta.
- No instales librerías nuevas sin preguntar primero.