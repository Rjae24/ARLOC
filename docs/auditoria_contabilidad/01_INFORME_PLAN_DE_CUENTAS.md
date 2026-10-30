# INFORME TÉCNICO INDIVIDUAL: Plan de Cuentas (PUC)

**Archivo auditado:** [`src/pages/contabilidad/PlanCuentas.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/pages/contabilidad/PlanCuentas.jsx)  
**Servicio asociado:** [`src/services/contabilidadService.js`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/services/contabilidadService.js)  
**Tabla en BD:** `public.plan_cuentas`  
**Líneas actuales:** 659 líneas (⚠️ Excede el umbral de 600 líneas)  

---

## 1. DESCRIPCIÓN Y PROPÓSITO DEL SUBMÓDULO

El Plan de Cuentas es el catálogo maestro que estructura todo el sistema contable de la empresa bajo la normativa NIIF para PYMES y principios de contabilidad generalmente aceptados. Permite:
- Visualizar la jerarquía de cuentas en formato de árbol (Padres y Cuentas de Movimiento).
- Crear nuevas cuentas contables auxiliares.
- Activar o desactivar cuentas.
- Filtrar por tipos de cuenta (Activo, Pasivo, Patrimonio, Ingreso, Costo, Gasto) y búsqueda por código/nombre.

---

## 2. EVALUACIÓN: ¿TIENE SENTIDO O NO?

### ✅ ASPECTOS POSITIVOS (SÍ TIENE SENTIDO)
1. **Estructura Jerárquica NIIF:** La base de datos contiene actualmente 47 cuentas estándar bien clasificadas:
   - `1` Activos (1.1 Corrientes -> 1.1.01 Efectivo -> 1.1.01.01 Caja General, 1.1.02 Bancos, 1.1.03 Cuentas por Cobrar, 1.1.04 Inventario).
   - `2` Pasivos (2.1 Corrientes -> 2.1.01 Proveedores, 2.1.02 IVA Débito, 2.1.03 Retenciones).
   - `3` Patrimonio (Capital suscrito, reservas, utilidades acumuladas).
   - `4` Ingresos (Ventas de mercancías, ingresos financieros).
   - `5` Costos (Costo de venta de mercancía).
   - `6` Gastos (Sueldos, alquileres, servicios, gastos operativos).
2. **Diferenciación entre Cuentas de Título y Cuentas de Movimiento:** La columna `es_padre` impide correctamente que se asienten transacciones en cuentas agregadas (como `1.1 Activos Corrientes`), obligando a asentar únicamente en cuentas auxiliares de último nivel (`1.1.01.01 Caja General`).
3. **Navegación Visual en Árbol:** El componente React implementa expansión y colapso de nodos recursivos mediante `CuentaTreeNode` con buena experiencia de usuario.

### ❌ ASPECTOS NEGATIVOS Y DEFICIENCIAS
1. **Infracción del Límite de 600 Líneas (659 líneas):** El archivo mezcla en un solo componente el árbol de cuentas, la lógica de búsqueda, el modal de creación de cuentas y los estilos inline.
2. **Falta de Mapeo de Cuentas de Enlace (Configuración Contable):** El sistema tiene el catálogo, pero **no tiene dónde definir** qué cuenta del plan corresponde a cada canal operativo. Por ejemplo:
   - ¿A qué cuenta contable debe ir una venta pagada por "Zelle"?
   - ¿A qué cuenta debe ir el crédito concedido en tienda?
   - Al no existir esta configuración, el sistema no sabe cómo automatizar asientos desde el POS.
3. **Validación de Código Débil:** El formulario de creación permite introducir cualquier string en `codigo`. Si un usuario escribe un código inconsistente como `1.1.01.99.00.ABC`, se descompagina la jerarquía visual del árbol. Debe validarse mediante expresiones regulares basadas en el código del padre seleccionado.
4. **Falta de Prevención al Desactivar Cuentas con Saldo:** Si una cuenta tiene movimientos en el Libro Diario o saldo en el Libro Mayor, el sistema actualmente permite desactivarla con un simple clic (`toggleCuentaActiva`), dejando saldos "fantasmas" huérfanos que descuadran el Balance de Comprobación.

---

## 3. CÓMO MEJORAR ESTE SUBMÓDULO (PLAN DE ACCIÓN)

1. **Modularización Inmediata (Clean Code):**
   - Extraer `CuentaTreeNode.jsx` a `src/components/contabilidad/planCuentas/CuentaTreeNode.jsx`.
   - Extraer el modal de nueva cuenta `CuentaModal.jsx` a `src/components/contabilidad/planCuentas/CuentaModal.jsx`.
   - Reducir `PlanCuentas.jsx` a menos de 250 líneas orquestadoras.
2. **Agregar Pestaña o Botón de "Mapeo de Automatización":**
   - Crear una interfaz administrativa para enlazar:
     - Método de Pago POS (Efectivo, Tarjeta, Pago Móvil, Zelle, Cashea) $\rightarrow$ Cuenta Contable Destino.
     - Tipo de Venta $\rightarrow$ Cuenta de Ingreso.
     - Impuestos $\rightarrow$ Cuenta de Débito Fiscal.
3. **Validación en Base de Datos de Cuentas con Movimiento:**
   - Antes de permitir desactivar o eliminar una cuenta contable, verificar mediante consulta en `lineas_asiento` que no existan asientos asociados.

