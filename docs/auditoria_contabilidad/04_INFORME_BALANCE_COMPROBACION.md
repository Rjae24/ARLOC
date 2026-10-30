# INFORME TÉCNICO INDIVIDUAL: Balance de Comprobación

**Archivo auditado:** [`src/pages/contabilidad/BalanceComprobacion.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/pages/contabilidad/BalanceComprobacion.jsx)  
**Servicio asociado:** [`src/services/contabilidadService.js`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/services/contabilidadService.js)  
**Función principal:** `fetchBalanceComprobacion({ fechaDesde, fechaHasta })`  
**Líneas actuales:** 436 líneas (Dentro del límite de 600)  

---

## 1. DESCRIPCIÓN Y PROPÓSITO DEL SUBMÓDULO

El Balance de Comprobación (o Balance de Sumas y Saldos) es la herramienta fundamental de control contable antes de emitir los estados financieros. Su función es verificar que la contabilidad esté matemáticamente cuadrada en dos niveles:
1. **Cuadre de Sumas:** El Total de los débitos registrados debe ser exactamente igual al Total de los créditos ($\sum Debe = \sum Haber$).
2. **Cuadre de Saldos:** La suma de todos los saldos deudores debe ser exactamente igual a la suma de todos los saldos acreedores ($\sum SaldoDeudor = \sum SaldoAcreedor$).

Permite:
- Visualizar las cuentas con movimiento en 4 columnas financieras: *Sumas Debe*, *Sumas Haber*, *Saldo Deudor* y *Saldo Acreedor*.
- Verificar con badges de color si el balance está cuadrado (`✓ Cuadrado`) o descuadrado (`⚠️ Descuadrado`).
- Filtrar por rangos de fecha y exportar a CSV o imprimir.

---

## 2. EVALUACIÓN: ¿TIENE SENTIDO O NO?

### ✅ ASPECTOS POSITIVOS (SÍ TIENE SENTIDO)
1. **Estructura Clásica de 4 Columnas:** Cumple a la perfección con la norma contable venezolana y NIIF.
2. **Validación Automática de Cuadre:** El banner superior detecta inmediatamente si hay un solo céntimo de diferencia entre sumas o entre saldos.
3. **Manejo Dual en Bolívares y Dólares:** Calcula los saldos tanto en USD como en VES (Bolívares) basándose en las líneas contables históricas.

### ❌ ASPECTOS NEGATIVOS Y DEFICIENCIAS
1. **Los saldos son totalmente ajenos a la realidad del negocio:**
   - Como solo hay 3 asientos en la base de datos, el balance reporta:
     - Total Débitos: **$17,088.00 USD**
     - Total Créditos: **$17,088.00 USD**
     - Saldo en Caja General: apenas **$1,160.00 USD**
     - Saldo en Banco: **$10,000.00 USD** (un número redondo ficticio de apertura)
     - Cuentas por Cobrar: **$0.00 USD** (cuando el negocio tiene decenas de clientes con crédito activo).
   - **Conclusión:** Para la administración y la gerencia de ARLUC, este reporte actualmente es inservible para la toma de decisiones porque no incluye ninguna de las operaciones reales del día a día.
2. **Cuello de Botella de Rendimiento (Descarga completa de líneas en memoria):**
   - En `contabilidadService.js` líneas 181-198:
     ```javascript
     let query = supabase.from('lineas_asiento').select(`
       id, cuenta_id, debe, haber, debe_ves, haber_ves,
       asientos_contables ( fecha )
     `);
     const { data: lineas, error } = await query;
     ```
   - Esto descarga **todas las filas individuales de la tabla `lineas_asiento`** al navegador del cliente y luego ejecuta un bucle `for` en JavaScript para agruparlas.
   - Con 3 asientos (9 líneas) funciona rápido. Con 2,000 facturas (6,000 líneas contables), la aplicación se tornará lenta y consumirá gigabytes de transferencia innecesaria.
3. **Falta de Vista de Cuentas Mayorizadas (Padres):**
   - Solo muestra cuentas de movimiento aisladas. No muestra los subtotales por grupo mayor (`1.1 Activo Corriente`, `1 Activo Total`, etc.), lo que dificulta una lectura ejecutiva rápida.

---

## 3. CÓMO MEJORAR ESTE SUBMÓDULO (PLAN DE ACCIÓN)

1. **Alimentación Continua desde Ventas, Pagos y Compras:**
   - La solución número uno para que este reporte tenga sentido es que cada venta en POS y abono en CxC genere su asiento. Con ello, las sumas y saldos reflejarán el flujo de caja verídico de la empresa.
2. **Optimización con Vista Agregada o RPC en PostgreSQL:**
   - Reemplazar la descarga masiva de líneas por una función en la base de datos:
     ```sql
     CREATE OR REPLACE FUNCTION balance_comprobacion(fecha_desde DATE, fecha_hasta DATE)
     RETURNS TABLE (...)
     AS $$
       SELECT c.codigo, c.nombre, c.tipo, c.naturaleza,
              SUM(l.debe) AS total_debe, SUM(l.haber) AS total_haber,
              SUM(l.debe_ves) AS total_debe_ves, SUM(l.haber_ves) AS total_haber_ves
       FROM plan_cuentas c
       JOIN lineas_asiento l ON l.cuenta_id = c.id
       JOIN asientos_contables a ON a.id = l.asiento_id
       WHERE (fecha_desde IS NULL OR a.fecha >= fecha_desde)
         AND (fecha_hasta IS NULL OR a.fecha <= fecha_hasta)
       GROUP BY c.id;
     $$ LANGUAGE sql;
     ```
   - Esto reduce el tiempo de respuesta de segundos a milisegundos y hace la app 100% escalable.
3. **Selector de Nivel de Detalle:**
   - Permitir alternar entre: *Solo Cuentas de Movimiento* o *Balance Jerárquico con Totales de Grupo*.

