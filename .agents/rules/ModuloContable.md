# PROMPT TÉCNICO: Implementación Integral del Módulo Contable Automatizado

Actúa como un **Arquitecto de Software Full-Stack Senior y Especialista en Sistemas ERP/Contables**.

El objetivo es evolucionar el módulo de contabilidad existente en el proyecto (`src/pages/contabilidad/LibroDiario.jsx`, `src/pages/contabilidad/LibroMayor.jsx` y `src/services/contabilidadService.js`) hacia un **Sistema Contable Automatizado de Doble Partida (Double-Entry Bookkeeping)**, completamente integrado con los flujos ya existentes de POS (`POS.jsx`), Cuentas por Cobrar (`CuentasPorCobrar.jsx`, `CxCAbonoModal.jsx`), Inventario (`Inventario.jsx`), Órdenes de Compra (`OrdenesCompra.jsx`) y Tasa BCV (`bcvService.js`).

---

### 1. REGLAS DE NEGOCIO Y PRINCIPIOS CONTABLES

1. **Automatización en Tiempo Real:** Las transacciones operativas (ventas en POS, abonos CxC, recepción de órdenes de compra y consumo de inventario) deben generar asientos contables automáticos en segundo plano mediante funciones y triggers en Supabase/PostgreSQL.
2. **Inmutabilidad y Auditoría:** Los asientos en estado `ASENTADO` son estrictamente inmutables. No se permite `UPDATE` ni `DELETE`. Toda corrección o anulación de factura/abono debe emitir un contra-asiento de ajuste (`ANULACION`).
3. **Dualidad Monetaria Real (USD / Bs.):** Cada línea contable almacena montos en USD y su equivalente en Bolívares calculados con la tasa BCV oficial registrada en el momento de la transacción (`tasa_bcv`).
4. **Validación de Partida Doble:** Ningún asiento puede asentarse si $\sum Debe \neq \sum Haber$ (tanto en USD como en Bs.).

---

### 2. MODELO DE DATOS EN SUPABASE (POSTGRESQL + RLS)

Diseña y genera las migraciones SQL requeridas:

1. **`cuentas_contables` (Catálogo PUC):**
   - `id` (UUID, PK)
   - `codigo` (VARCHAR, ej. '1.1.01.01', índice único)
   - `nombre` (VARCHAR)
   - `naturaleza` ('DEUDORA' | 'ACREEDORA')
   - `tipo` ('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'COSTO', 'GASTO')
   - `nivel` (INT)
   - `acepta_movimiento` (BOOLEAN, true para cuentas auxiliares/detalle)
   - `parent_id` (FK autoreferencial)
   - `activa` (BOOLEAN, default true)

2. **`configuracion_contable` (Mapeo de automatización):**
   - `id` (UUID, PK)
   - `clave` (VARCHAR UNIQUE, ej.: `CTA_CAJA_GENERAL`, `CTA_BANCO_BS`, `CTA_CXC_CLIENTES`, `CTA_VENTAS_BASE`, `CTA_IVA_DEBITO`, `CTA_CXP_PROVEEDORES`, `CTA_INVENTARIO`, `CTA_COSTO_VENTAS`, `CTA_DIF_CAMBIARIO`)
   - `cuenta_id` (FK a `cuentas_contables`)
   - `descripcion` (TEXT)

3. **`periodos_contables`:**
   - `id` (UUID, PK), `nombre` (VARCHAR), `fecha_inicio` (DATE), `fecha_fin` (DATE), `estado` ('ABIERTO' | 'CERRADO')
   - Triggers que bloqueen altas o modificaciones de asientos si el periodo no está 'ABIERTO'.

4. **`asientos_contables`:**
   - `id` (UUID, PK)
   - `numero_asiento` (VARCHAR/SERIAL secuencial)
   - `periodo_id` (FK)
   - `fecha` (TIMESTAMP WITH TIME ZONE)
   - `concepto` (TEXT)
   - `origen` ('POS_VENTA', 'CXC_ABONO', 'COMPRA', 'COSTO_INVENTARIO', 'AJUSTE_MANUAL', 'ANULACION')
   - `referencia_id` (UUID nullable, enlace a factura, abono o compra)
   - `tasa_cambio` (NUMERIC(14, 4))
   - `estado` ('ASENTADO', 'ANULADO')
   - `created_by` (FK auth.users)

5. **`asiento_detalles`:**
   - `id` (UUID, PK)
   - `asiento_id` (FK a `asientos_contables`)
   - `cuenta_id` (FK a `cuentas_contables`)
   - `referencia_linea` (TEXT)
   - `debe_usd`, `haber_usd`, `debe_bs`, `haber_bs` (NUMERIC(18, 4))

---

### 3. DISPARADORES Y AUTOMATIZACIÓN (PL/PGSQL)

Crea los procedimientos almacenados y triggers en PostgreSQL:

1. **Trigger de Ventas en POS (`facturas`):**
   - Al registrarse una factura con estado `PAGADA`:
     - Débito: `CTA_CAJA_GENERAL` o `CTA_BANCO` (si es contado) o `CTA_CXC_CLIENTES` (si es crédito).
     - Crédito: `CTA_VENTAS_BASE` (monto neto sin impuestos).
     - Crédito: `CTA_IVA_DEBITO` (si aplica IVA).
   - Asiento paralelo de Costo de Ventas e Inventario (si aplica inventario perpetuo):
     - Débito: `CTA_COSTO_VENTAS`.
     - Crédito: `CTA_INVENTARIO`.

2. **Trigger de Abonos CxC (`abonos_cxc`):**
   - Al insertarse un abono de cliente:
     - Débito: Cuenta de destino (`CTA_CAJA_GENERAL` o `CTA_BANCO_BS`).
     - Crédito: `CTA_CXC_CLIENTES`.
     - Manejo de diferencial cambiario si la tasa de liquidación difiere de la tasa de emisión.

3. **Trigger de Compras / Proveedores (`ordenes_compra`):**
   - Al cambiar la orden a estado `RECIBIDA` o `COMPLETADA`:
     - Débito: `CTA_INVENTARIO` + `CTA_IVA_CREDITO`.
     - Crédito: `CTA_CXP_PROVEEDORES` o cuentas de tesorería.

4. **Trigger de Control de Calidad (Integridad):**
   - Trigger `BEFORE INSERT OR UPDATE` sobre `asientos_contables` que valide que las sumas de sus detalles cumplan estrictamente:
     $$\sum Debe_{USD} = \sum Haber_{USD} \quad \text{y} \quad \sum Debe_{Bs} = \sum Haber_{Bs}$$

---

### 4. ACTUALIZACIÓN DEL SERVICIO (`src/services/contabilidadService.js`)

Refactoriza e implementa las siguientes funciones:
- `getCuentasContables()`: Árbol completo del catálogo.
- `crearCuentaContable(data)` / `actualizarCuentaContable(id, data)`
- `getConfiguracionContable()` / `guardarConfiguracionContable(config)`
- `getAsientos(filtros)`: Filtros por fecha, origen, cuenta y búsqueda por concepto/referencia.
- `getAsientoById(id)`: Cabecera con todas sus líneas de detalle.
- `crearAsientoManual(asiento, detalles)`: Asientos manuales con validación previa de balance.
- `getLibroMayor(cuentaId, fechaInicio, fechaFin)`: Movimientos acumulados y cálculo de saldo inicial y final.
- `getBalanceComprobacion(fechaInicio, fechaFin)`: Sumas y saldos agrupados por cuenta.
- `getEstadoResultados(fechaInicio, fechaFin)`: P&L clasificado en Ingresos, Costos y Gastos.
- `getBalanceGeneral(fechaCorte)`: Estado de Situación Financiera clasificado.

---

### 5. INTERFAZ DE USUARIO (REACT + TAILWIND + LUCIDE)

Extiende la interfaz dentro de `src/pages/contabilidad/` y el menú lateral `sidebarConfig.js`:

1. **`LibroDiario.jsx` (Refactorizado):**
   - Tabla interactiva con opción de expandir/contraer las líneas del asiento.
   - Badge indicador del origen (`POS`, `CxC`, `Compras`, `Ajuste`) con enlace modal al documento de origen.
   - Toggle para alternar visualización entre **USD ($)** y **Bs.**
   - Botón para abrir el modal de nuevo asiento manual (solo para ajustes/reclasificaciones).

2. **`LibroMayor.jsx` (Refactorizado):**
   - Selector dinámico de cuenta contable con autocompletado.
   - Tarjetas de resumen: Saldo Inicial, Total Debe, Total Haber y Saldo Deudor/Acreedor.
   - Detalle cronológico de movimientos con saldo acumulado paso a paso.

3. **Nuevas Vistas a Crear:**
   - `PlanCuentas.jsx`: Visualizador en árbol interactivo del plan de cuentas con modal de creación de cuentas auxiliares.
   - `BalanceComprobacion.jsx`: Tabla ejecutiva de 4 columnas (Sumas Debe/Haber y Saldos Deudor/Acreedor), con verificador de cuadre global.
   - `EstadosFinancieros.jsx`: P&L (Estado de Resultados) y Balance General listos para exportar/imprimir con soporte de tema claro/oscuro.
   - `ConfiguracionContableModal.jsx`: Modal administrativo para mapear qué cuenta del plan corresponde a cada evento automático del sistema.

---

### ENTREGABLES:
1. Migración SQL completa para Supabase (`schema_contable.sql`), incluyendo catálogo inicial de cuentas base (NIIF), triggers automáticos y políticas RLS.
2. Archivo `src/services/contabilidadService.js` completamente implementado.
3. Componentes React para las vistas actualizadas y nuevas, manteniendo la consistencia con el diseño Tailwind y `ThemeContext` del proyecto.