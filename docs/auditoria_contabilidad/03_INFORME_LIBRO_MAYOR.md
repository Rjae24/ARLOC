# INFORME TÉCNICO INDIVIDUAL: Libro Mayor

**Archivo auditado:** [`src/pages/contabilidad/LibroMayor.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/pages/contabilidad/LibroMayor.jsx)  
**Servicio asociado:** [`src/services/contabilidadService.js`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/services/contabilidadService.js)  
**Funciones principales:** `fetchCuentasOperativas()`, `fetchMovimientosCuenta(cuentaId)`  
**Líneas actuales:** 585 líneas (Al límite del umbral de 600 líneas)  

---

## 1. DESCRIPCIÓN Y PROPÓSITO DEL SUBMÓDULO

El Libro Mayor agrupa y clasifica todos los movimientos contables cuenta por cuenta individualmente (las tradicionales "T" contables). Permite:
- Seleccionar cualquier cuenta operativa del catálogo PUC (ej. `1.1.01.01 Caja General` o `4.1.01.01 Ventas de Mercancías`).
- Ver su saldo acumulado progresivo línea a línea cronológicamente.
- Conocer el saldo deudor o saldo acreedor final según la naturaleza contable de la cuenta:
  - Cuentas de Activo, Costo y Gasto: aumentan por el Debe, disminuyen por el Haber (Naturaleza Deudora).
  - Cuentas de Pasivo, Patrimonio e Ingreso: aumentan por el Haber, disminuyen por el Debe (Naturaleza Acreedora).
- Exportar los movimientos en formato CSV o imprimir el libro de la cuenta.

---

## 2. EVALUACIÓN: ¿TIENE SENTIDO O NO?

### ✅ ASPECTOS POSITIVOS (SÍ TIENE SENTIDO)
1. **Lógica de Saldo Acumulado Impecable:** La función auxiliar `agregarSaldoAcumulado` respeta rigurosamente si la cuenta es deudora o acreedora:
   ```javascript
   saldoAcumuladoCentimos += esDeudora
     ? debeCentimos - haberCentimos
     : haberCentimos - debeCentimos;
   ```
2. **Cálculo en Céntimos Enteros:** Evita los clásicos descuadres de centavos por redondeo flotante.
3. **Selector con Búsqueda y Autocompletado:** El selector de cuentas permite filtrar rápidamente por código o nombre.

### ❌ ASPECTOS NEGATIVOS Y DEFICIENCIAS
1. **41 de las 47 cuentas aparecen vacías sin movimientos:**
   - Al solo haber 3 asientos en el sistema, casi todas las cuentas de ingresos, gastos, bancos y clientes aparecen en $0.00.
   - La cuenta `1.1.03.01 Cuentas por Cobrar Clientes` aparece con saldo $0.00, a pesar de que el negocio tiene más de $15,000 en créditos otorgados activos en la calle.
   - La cuenta `4.1.01.01 Ventas de Mercancías` solo tiene $1,000 de saldo (1 sola venta), ignorando por completo los $40,000+ facturados en los últimos 3 meses.
2. **Falta de Saldo Inicial por Período:**
   - Si un usuario filtra por rango de fechas (por ejemplo: "Desde el 15 de Octubre hasta el 29 de Octubre"), el sistema **no calcula el saldo anterior/inicial acumulado antes de esa fecha**.
   - En contabilidad formal, si filtras un mes, la primera línea obligatoria del Libro Mayor debe ser: *"Saldo Inicial al 01/10/2026 = $X"*. De lo contrario, el saldo final del mes calculado es falso.
3. **Tamaño del Archivo (585 líneas):** Está a solo 15 líneas de violar el límite obligatorio de 600 líneas del proyecto, acumulando filtros, cards de resumen, tabla de movimientos, exportadores CSV y modales de impresión en un único archivo.

---

## 3. CÓMO MEJORAR ESTE SUBMÓDULO (PLAN DE ACCIÓN)

1. **Implementar Saldo Anterior (Arraste de Saldo por Fecha):**
   - Al filtrar por `fechaDesde`, realizar una subconsulta que sume los movimientos con `fecha < fechaDesde` para mostrar una fila inicial destacada:
     `[Saldo Anterior al DD/MM/AAAA]: Debe: $X | Haber: $Y | Saldo: $Z`.
2. **Conexión con las Ventas Reales:**
   - Una vez activada la generación automática de asientos de ventas, la cuenta `1.1.01.01 Caja General` reflejará el dinero en efectivo real, `1.1.02.01 Bancos` reflejará las transferencias y puntos de venta reales, y `4.1.01.01 Ventas` reflejará el ingreso real por rubro.
3. **Modularización Preventiva:**
   - Extraer la tarjeta de resumen (`MayorSummaryCards.jsx`) y la tabla de movimientos (`MayorTable.jsx`) a componentes dedicados en `src/components/contabilidad/mayor/` para reducir el archivo a unas 220 líneas.

