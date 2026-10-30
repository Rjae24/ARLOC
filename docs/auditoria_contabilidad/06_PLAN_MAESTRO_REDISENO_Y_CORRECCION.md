# PLAN MAESTRO: Rediseño, Corrección y Automatización Integral de la Contabilidad

**ERP ARLUC — Módulo de Contabilidad General**  
**Fecha:** 29 de Octubre de 2026  
**Documento:** Plan de Implementación de Ingeniería de Software  
**Basado en:** Informes 00 a 05 de Auditoría Contable  

---

## 🎯 OBJETIVO GENERAL
Transformar el módulo de Contabilidad General de un cascarón con datos estáticos y componentes monolíticos a un **Sistema Contable Automatizado de Doble Partida (Double-Entry Bookkeeping)**, 100% conectado en tiempo real con las ventas (POS), los cobros (CxC), las compras de proveedores y el inventario, cumpliendo estrictamente con:
1. **Regla de 600 líneas de Clean Code** (modularización en componentes atómicos/moleculares con SRP).
2. **Ergonomía Mobile-First Responsive** (touch targets $\ge 44\text{px}$, tablas deslizables, layouts fluidos).
3. **Dualidad Monetaria Real** (USD y Bs. al tipo de cambio histórico de cada asiento).
4. **Cálculos Escalables** (agrupaciones directas en BD/PostgreSQL para no saturar la memoria del cliente).

---

## 🧩 ESTRUCTURA DEL PLAN POR SUBMÓDULO

```
                             [ARQUITECTURA CONTABLE ARLUC]
                                           │
   ┌───────────────────────────────────────┴───────────────────────────────────────┐
   ▼                                                                               ▼
[CAPA DE DATOS Y AUTOMATIZACIÓN]                                       [CAPA DE PRESENTACIÓN CLEAN CODE]
• Mapeo Contable de Canales                                            • PlanCuentas.jsx (< 250 líneas)
• Backfill Retroactivo (1,353 ventas)                                  • LibroDiario.jsx (< 280 líneas)
• Triggers / Service Hooks (POS + CxC + Compras)                       • LibroMayor.jsx (< 250 líneas)
• Saldo anterior acumulado por fecha                                   • BalanceComprobacion.jsx (< 250 líneas)
• Optimización SQL de agregaciones                                     • EstadosFinancieros.jsx (< 220 líneas)
```

---

## 📌 FASE 1: REDISEÑO DEL PLAN DE CUENTAS (PUC)
*Basado en el Informe 01: [`01_INFORME_PLAN_DE_CUENTAS.md`](01_INFORME_PLAN_DE_CUENTAS.md)*

### 1. Diagnóstico a corregir
- Archivo actual [`PlanCuentas.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/pages/contabilidad/PlanCuentas.jsx) tiene **659 líneas** (excede las 600).
- Falta la interfaz de **Mapeo de Cuentas de Enlace** (para que el sistema sepa a qué cuenta mandar Efectivo USD, Banco Bs, Zelle, Cashea, Cuentas por Cobrar, Ventas Netas y Débito IVA).
- Riesgo de desactivar cuentas que ya tienen saldo o movimientos históricos.

### 2. Plan de Modularización (Clean Code)
Dividir `PlanCuentas.jsx` en módulos con responsabilidades únicas:
- [`src/components/contabilidad/planCuentas/CuentaTreeNode.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/components/contabilidad/planCuentas/CuentaTreeNode.jsx): Nodo recursivo del árbol, con su indentación, badges de tipo y acciones (~120 líneas).
- [`src/components/contabilidad/planCuentas/CuentaModal.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/components/contabilidad/planCuentas/CuentaModal.jsx): Formulario de creación/edición con selector de padre y validación de código contable (~140 líneas).
- [`src/components/contabilidad/planCuentas/ConfiguracionMapeoModal.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/components/contabilidad/planCuentas/ConfiguracionMapeoModal.jsx): Modal para asignar qué cuenta contable corresponde a cada método de pago y tipo de transacción (~150 líneas).
- [`src/pages/contabilidad/PlanCuentas.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/pages/contabilidad/PlanCuentas.jsx): Orquestador limpio que solo maneja estado, búsqueda y tabs (~180 líneas).

### 3. Matriz de Cuentas Puente Predefinidas
| Clave de Configuración | Cuenta Contable Sugerida | Código | Tipo / Naturaleza |
|---|---|---|---|
| `CTA_CAJA_USD` | Caja General (Efectivo Divisas) | `1.1.01.01` | Activo / Deudora |
| `CTA_BANCO_BS` | Banco Nacional (Punto de Venta / Pago Móvil) | `1.1.02.01` | Activo / Deudora |
| `CTA_BANCO_USD` | Banco Internacional (Zelle) | `1.1.02.02` | Activo / Deudora |
| `CTA_CXC_CLIENTES` | Cuentas por Cobrar Clientes (Crédito Tienda) | `1.1.03.01` | Activo / Deudora |
| `CTA_CASHEA_POR_COBRAR`| Cashea Financiamiento por Liquidar | `1.1.03.02` | Activo / Deudora |
| `CTA_INVENTARIO` | Inventario de Mercancía | `1.1.04.01` | Activo / Deudora |
| `CTA_IVA_CREDITO` | Crédito Fiscal IVA (Compras) | `1.1.05.01` | Activo / Deudora |
| `CTA_CXP_PROVEEDORES`| Cuentas por Pagar Proveedores | `2.1.01.01` | Pasivo / Acreedora |
| `CTA_IVA_DEBITO` | Débito Fiscal IVA (Ventas) | `2.1.02.01` | Pasivo / Acreedora |
| `CTA_VENTAS_BASE` | Ventas de Mercancías | `4.1.01.01` | Ingreso / Acreedora |
| `CTA_COSTO_VENTAS` | Costo de Ventas | `5.1.01.01` | Costo / Deudora |

---

## 📌 FASE 2: REDISEÑO DEL LIBRO DIARIO Y AUTOMATIZACIÓN DE ASIENTOS
*Basado en el Informe 02: [`02_INFORME_LIBRO_DIARIO.md`](02_INFORME_LIBRO_DIARIO.md)*

### 1. Diagnóstico a corregir
- Solo existen 3 asientos viejos. No hay asientos automáticos de ventas, abonos ni compras.
- No hay enlace al documento origen (factura/abono) ni contra-asiento de anulación.
- Dependencia del ingreso manual de asientos.

### 2. Plan de Acción y Automatización
1. **Script de Contabilización Retroactiva (Backfill Histórico):**
   - Recorrer las **1,353 facturas reales** ya emitidas en los últimos 90 días.
   - Por cada factura, generar automáticamente su asiento contable correlativo (`AST-AAAA-XXXX`):
     - **Debe:** Caja General (si pagó en efectivo USD), Banco Nacional (si pagó en Punto o Pago Móvil), Zelle (si pagó digital), o Cuentas por Cobrar (si fue crédito directo). Si fue mixto, una línea de débito por cada método.
     - **Haber:** `4.1.01.01 Ventas de Mercancías` por el monto total facturado.
     - **Fecha:** La fecha exacta de emisión de la factura.
     - **Tasa:** La tasa de cambio oficial de la transacción.
     - **Glosa:** `Venta según Factura #{numero_factura} - Cliente: {nombre_cliente}`.
     - **Módulo:** `Ventas`.
2. **Generación Automática en el POS (`POS.jsx`):**
   - En la función `completarVenta()`, tras insertar en `facturas` y `detalles_factura`, invocar un hook `generarAsientoVenta(factura, metodosPago)` que inserte el asiento contable en la misma transacción o en segundo plano garantizado.
3. **Generación Automática en Cobranzas (`CxCAbonoModal.jsx`):**
   - Al registrar un abono de CxC:
     - **Debe:** Caja o Banco según el método seleccionado en el modal.
     - **Haber:** `1.1.03.01 Cuentas por Cobrar Clientes`.
     - **Módulo:** `Tesorería` / `CxC`.
4. **Enlace a Documento Fuente en la UI:**
   - En [`LibroDiario.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/pages/contabilidad/LibroDiario.jsx), añadir un botón interactivo `📄 Ver Documento` en cada fila que tenga origen `Ventas` o `Compras`, abriendo el detalle de la factura.
5. **Contra-Asiento de Anulación:**
   - Botón `Reversar Asiento` para administradores que genere un asiento con las cuentas invertidas y glosa `ANULACIÓN: Reversa de {numero_asiento}`.

---

## 📌 FASE 3: REDISEÑO DEL LIBRO MAYOR (SALDO ANTERIOR Y ESCALABILIDAD)
*Basado en el Informe 03: [`03_INFORME_LIBRO_MAYOR.md`](03_INFORME_LIBRO_MAYOR.md)*

### 1. Diagnóstico a corregir
- Archivo en **585 líneas** (riesgo inminente de exceder el límite).
- 41 cuentas vacías por falta de asientos.
- **Falta grave de Saldo Anterior:** Al filtrar un mes (ej. Octubre), no calcula el saldo acumulado antes del día 1 del mes, falseando el saldo de cierre del período.

### 2. Plan de Modularización y Mejoras
1. **Modularización:**
   - [`src/components/contabilidad/mayor/MayorHeaderFiltros.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/components/contabilidad/mayor/MayorHeaderFiltros.jsx): Selector de cuentas con búsqueda rápida y selector de fechas (~110 líneas).
   - [`src/components/contabilidad/mayor/MayorCards.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/components/contabilidad/mayor/MayorCards.jsx): Tarjetas KPI de Saldo Inicial, Débitos, Créditos y Saldo Actual en USD y Bs (~90 líneas).
   - [`src/components/contabilidad/mayor/MayorTable.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/components/contabilidad/mayor/MayorTable.jsx): Tabla cronológica de movimientos con paginación (~130 líneas).
   - [`src/pages/contabilidad/LibroMayor.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/pages/contabilidad/LibroMayor.jsx): Orquestador reducido a ~180 líneas.
2. **Cálculo de Saldo Inicial / Anterior:**
   - Si se especifica `fechaDesde`, calcular la suma de movimientos con `fecha < fechaDesde` e insertarlo como la primera fila destacada:
     ```
     [01/10/2026] -- SALDO ANTERIOR DEL PERÍODO -- Saldo: $X USD / Bs. Y
     ```
3. **Paginación en el Mayor:**
   - Paginación de 20 movimientos por página para evitar que cuentas de alta rotación (como Caja o Ventas con más de 1,000 líneas) hagan lento el renderizado.

---

## 📌 FASE 4: REDISEÑO DEL BALANCE DE COMPROBACIÓN
*Basado en el Informe 04: [`04_INFORME_BALANCE_COMPROBACION.md`](04_INFORME_BALANCE_COMPROBACION.md)*

### 1. Diagnóstico a corregir
- Las cifras actuales son ficticias ($1,160 en caja y $0 en CxC).
- Descarga en memoria del cliente todas las filas de `lineas_asiento` mediante un bucle JavaScript, lo cual es inviable con miles de líneas contables.
- Solo lista cuentas auxiliares sin subtotales jerárquicos de grupo.

### 2. Plan de Acción y Optimización
1. **Alimentación Real:** Con la FASE 2, el Balance pasará de reportar $17,000 a reportar el volumen total real comercial y financiero de ARLUC.
2. **Optimización de Cómputo:**
   - En lugar de traer miles de objetos al cliente, realizar la agregación directamente mediante una consulta agrupada o RPC que devuelva únicamente las 47 filas de cuentas con sus totales ya sumados.
3. **Selector de Nivel de Visualización:**
   - Opción para ver:
     - *Nivel 1: Resumen Ejecutivo por Grupos* (Activo, Pasivo, Patrimonio, etc.).
     - *Nivel 2: Cuentas Mayorizadas* (Caja y Equivalentes, Bancos, etc.).
     - *Nivel 3: Detalle Auxiliar Completo* (Cuentas operativas de 4 columnas).

---

## 📌 FASE 5: REDISEÑO DE ESTADOS FINANCIEROS (P&L Y BALANCE GENERAL)
*Basado en el Informe 05: [`05_INFORME_ESTADOS_FINANCIEROS.md`](05_INFORME_ESTADOS_FINANCIEROS.md)*

### 1. Diagnóstico a corregir
- Archivo monolítico de **877 líneas** (violación grave del límite de 600 líneas).
- P&L reporta solo $1,000 de ventas y $0 de costo de ventas.
- El Balance General lista todos los activos en una sola lista plana sin separar Corrientes de No Corrientes.

### 2. Plan de Modularización (Clean Code)
Dividir `EstadosFinancieros.jsx` en subcomponentes desacoplados:
- [`src/components/contabilidad/estados/EstadoResultadosView.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/components/contabilidad/estados/EstadoResultadosView.jsx): Desglose de Ingresos, Costos, Utilidad Bruta, Gastos Operativos y Utilidad Neta, con porcentajes de margen (~200 líneas).
- [`src/components/contabilidad/estados/BalanceGeneralView.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/components/contabilidad/estados/BalanceGeneralView.jsx): Clasificación en Activo Corriente / No Corriente, Pasivo Corriente / No Corriente y Patrimonio con Utilidad del Ejercicio (~220 líneas).
- [`src/components/contabilidad/estados/EstadosHeader.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/components/contabilidad/estados/EstadosHeader.jsx): Selector de tabs, rango de fechas, toggle de moneda (USD/VES) y botones de exportación (~120 líneas).
- [`src/pages/contabilidad/EstadosFinancieros.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/pages/contabilidad/EstadosFinancieros.jsx): Orquestador reducido a ~150 líneas.

### 3. Estimación del Costo de Ventas
- Si el inventario no tiene costo de reposición detallado en cada factura histórica, implementar una política contable estándar basada en el margen de comercialización o vincular los precios de costo de los productos del inventario para reflejar el costo de la mercancía vendida en el P&L.

---

## 📅 CRONOGRAMA DE EJECUCIÓN PROPUESTO

| Etapa | Alcance Técnico | Impacto para el Usuario |
|---|---|---|
| **Paso 1** | **Backfill Retroactivo de las 1,353 Ventas** | Inmediato: El Libro Diario, Mayor, Balances y P&L se llenan de datos reales de los 3 meses. |
| **Paso 2** | **Conexión en Tiempo Real de POS y CxC** | Cada nueva venta o cobro genera su asiento contable automático sin trabajo manual. |
| **Paso 3** | **Modularización de `EstadosFinancieros.jsx` (877 lín)** | Cumplimiento estricto de Clean Code (< 600 líneas) y separación de vistas. |
| **Paso 4** | **Modularización de `PlanCuentas.jsx` (659 lín)** | Separación del árbol recursivo y modal de creación; pantalla en < 200 líneas. |
| **Paso 5** | **Optimización de `LibroMayor.jsx` y `BalanceComprobacion.jsx`** | Saldo inicial anterior por fecha, paginación y alto rendimiento. |

