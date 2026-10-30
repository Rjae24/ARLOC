# INFORME TÉCNICO INDIVIDUAL: Libro Diario

**Archivo auditado:** [`src/pages/contabilidad/LibroDiario.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/pages/contabilidad/LibroDiario.jsx)  
**Servicio asociado:** [`src/services/contabilidadService.js`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/services/contabilidadService.js)  
**Tablas en BD:** `public.asientos_contables` y `public.lineas_asiento`  
**Líneas actuales:** 370 líneas (Dentro del límite de 600)  

---

## 1. DESCRIPCIÓN Y PROPÓSITO DEL SUBMÓDULO

El Libro Diario es el registro cronológico principal de todas las transacciones financieras de la entidad. Cada asiento debe contener:
- Número de asiento correlativo único (ej. `AST-2026-0001`).
- Fecha de la operación.
- Glosa descriptiva o concepto de la transacción.
- Módulo de origen (`Ventas`, `Compras`, `Tesorería`, `Gastos`, `Ajuste`, `Nómina`, `Manual`).
- Dos o más líneas contables con cuentas del catálogo, montos en el **Debe** y en el **Haber** tanto en USD como en Bolívares (VES).
- Verificación estricta de balanceo (partida doble: $\sum Debe = \sum Haber$).

---

## 2. EVALUACIÓN: ¿TIENE SENTIDO O NO?

### ✅ ASPECTOS POSITIVOS (SÍ TIENE SENTIDO)
1. **Validación de Partida Doble en Céntimos:** El modal para crear asientos manuales verifica en tiempo real que los totales cuadren al céntimo antes de enviar la transacción.
2. **Función Transaccional Segura en PostgreSQL (`crear_asiento`):** La creación de asientos se delega a una función almacenada `rpc('crear_asiento')` en PostgreSQL, garantizando atomicidad (si falla una línea, toda la operación hace `ROLLBACK`).
3. **Manejo Dual de Monedas:** Las líneas almacenan tanto el monto original en divisas como el equivalente en Bolívares según la tasa registrada en ese momento.

### ❌ ASPECTOS NEGATIVOS Y DEFICIENCIAS GRAVES
1. **Solo muestra 3 asientos estáticos:**
   - Hay 1,353 ventas reales en la tienda que nunca aparecen aquí.
   - Si un usuario entra a ver la contabilidad del mes de Octubre, solo ve 1 venta de $1,160 USD del 15 de Octubre (`AST-2026-0002`), dando la impresión de que el negocio no tiene ventas ni actividad.
2. **Falta de Enlace al Documento de Origen:**
   - La tabla `asientos_contables` no tiene un campo `referencia_id` (o no lo expone en la interfaz) para vincular con la factura del POS, la orden de compra o el abono de CxC.
   - Si un asiento dice "Venta según Factura #001", no hay un botón o enlace para abrir la factura y ver los artículos vendidos o el cliente.
3. **Imposibilidad de Anular o Reversar Asientos:**
   - No existe un flujo de contra-asiento o reversión. Si un usuario comete un error en un asiento manual, no hay forma de anularlo formalmente con un asiento de ajuste (`ANULACION`), lo cual viola las normas de auditoría contable.
4. **Dependencia Total de Carga Manual:**
   - Como no hay automatización, el Libro Diario exige que una persona cargue a mano cada línea, lo cual en un comercio con 15 ventas diarias (450 ventas al mes) es completamente inviable.

---

## 3. CÓMO MEJORAR ESTE SUBMÓDULO (PLAN DE ACCIÓN)

1. **Generación Automática Retroactiva (Backfill):**
   - Ejecutar una función que convierta las 1,353 facturas existentes en asientos contables reales en el Libro Diario.
2. **Integración de Triggers Operativos:**
   - Al registrar una venta en POS $\rightarrow$ Asiento automático con `modulo = 'Ventas'`.
   - Al registrar un abono en CxC $\rightarrow$ Asiento automático con `modulo = 'Tesorería'` / `CxC`.
   - Al recibir una compra de proveedor $\rightarrow$ Asiento automático con `modulo = 'Compras'`.
3. **Botón y Modal de "Ver Documento Fuente":**
   - Cuando un asiento provenga de una venta, mostrar un botón `📄 Ver Factura` que abra el modal de la factura emitida con sus detalles de artículos.
4. **Acción de Reversión (Contra-asiento de Anulación):**
   - Permitir a los administradores generar un contra-asiento automático de anulación (invirtiendo el Debe y el Haber) con auditoría de quién y por qué se anuló.

