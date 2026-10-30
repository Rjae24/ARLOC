# INFORME TÉCNICO INDIVIDUAL: Estados Financieros

**Archivo auditado:** [`src/pages/contabilidad/EstadosFinancieros.jsx`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/pages/contabilidad/EstadosFinancieros.jsx)  
**Servicio asociado:** [`src/services/contabilidadService.js`](file:///c:/Users/pc/Documents/proyectos/ARLUC/src/services/contabilidadService.js)  
**Función principal:** `fetchEstadosFinancieros({ fechaDesde, fechaHasta })`  
**Líneas actuales:** 877 líneas (🚨 Infracción severa del umbral de 600 líneas)  

---

## 1. DESCRIPCIÓN Y PROPÓSITO DEL SUBMÓDULO

Estados Financieros es el módulo cumbre de la contabilidad empresarial donde se sintetiza la salud económica del negocio. Ofrece dos estados financieros oficiales bajo NIIF:
1. **Estado de Resultados (P&L - Ganancias y Pérdidas):**
   - Ingresos Operacionales menos Costo de Ventas = **Utilidad Bruta**.
   - Menos Gastos Operativos (Administrativos, Ventas, Generales) = **Utilidad Neta del Ejercicio**.
2. **Balance General (Estado de Situación Financiera):**
   - **Activos** (Corrientes y No Corrientes).
   - **Pasivos** (Corrientes y No Corrientes).
   - **Patrimonio** (Capital Social, Utilidades Anteriores y la Utilidad del Ejercicio del P&L).
   - Verificación de la Ecuación Contable Fundamental:
     $$\text{Activo} = \text{Pasivo} + \text{Patrimonio}$$

---

## 2. EVALUACIÓN: ¿TIENE SENTIDO O NO?

### ✅ ASPECTOS POSITIVOS (SÍ TIENE SENTIDO)
1. **Conexión Contable Correcta entre Ambos Estados:**
   - En `contabilidadService.js` (línea 418), la utilidad neta calculada en el Estado de Resultados se traslada e integra automáticamente a la sección de Patrimonio del Balance General:
     ```javascript
     const totalPatrimonioCent = totalPatrimonioBaseCent + utilidadNetaCent;
     ```
   - Esto es contabilidad pura y formal: el Balance General no puede cuadrar si no incorpora la utilidad o pérdida del período.
2. **Selector de Moneda en Tiempo Real (USD / VES):**
   - Permite alternar la presentación de las cifras entre Dólares y Bolívares sin recargar la página.
3. **Formato Imprimible:**
   - Incluye cabecera institucional, fecha de corte, firmas de contador y administrador, adaptado para impresión física o guardado en PDF.

### ❌ ASPECTOS NEGATIVOS Y DEFICIENCIAS CRÍTICAS
1. **Números Desconectados de la Realidad Comercial:**
   - **Ingresos Reportados:** Muestra solo **$1,000.00 USD** de ventas (provenientes del único asiento `AST-2026-0002`).
   - Las 1,353 ventas reales del sistema que suman decenas de miles de dólares no se ven reflejadas.
   - **Costo de Ventas:** Aparece en **$0.00 USD**, por lo que la utilidad bruta da un irreal 100% de margen. Esto sucede porque el sistema no emite asientos contables de costo de inventario al vender productos.
   - **Utilidad Neta Falsa:** Como no hay gastos operativos registrados ni costos, la utilidad neta dice $1,000 USD de pura ganancia, lo cual es ficticio.
2. **Archivo Monolítico Masivo (877 líneas):**
   - Viola flagrantemente el principio de responsabilidad única (SRP) y la regla de no exceder las 600 líneas.
   - En un solo archivo coexisten:
     - El componente del Estado de Resultados (con 6 tablas anidadas).
     - El componente del Balance General (con desglose de Activos, Pasivos, Patrimonio).
     - El encabezado de filtros por fecha y tabs.
     - Lógica de exportación y estilos CSS inline extensos.
3. **Falta de Desglose Corriente / No Corriente en el Balance:**
   - La interfaz agrupa todos los activos en una sola lista plana, sin separar `Activos Corrientes` (Caja, Banco, Clientes, Inventario) de `Activos No Corrientes` (Mobiliario, Equipos de Sonido, Vehículos). Lo mismo ocurre con los pasivos.

---

## 3. CÓMO MEJORAR ESTE SUBMÓDULO (PLAN DE ACCIÓN)

1. **Modularización Obligatoria e Inmediata:**
   Dividir `EstadosFinancieros.jsx` en módulos de menos de 250 líneas:
   - `src/components/contabilidad/estados/EstadoResultadosView.jsx` (P&L)
   - `src/components/contabilidad/estados/BalanceGeneralView.jsx` (Situación Financiera)
   - `src/components/contabilidad/estados/EstadosHeader.jsx` (Tabs, fechas y moneda)
   - `EstadosFinancieros.jsx` queda como un orquestador limpio de ~120 líneas.
2. **Cálculo de Costo de Ventas Real:**
   - Cada producto en inventario tiene su `precio_costo` o costo promedio ponderado.
   - Al registrarse una venta, además del asiento de ingresos, debe asentarse el costo:
     - Debe: `5.1.01.01 Costo de Ventas`
     - Haber: `1.1.04.01 Inventario de Mercancía`
   - Con esto, el Estado de Resultados reflejará el margen bruto real de la comercializadora.
3. **Carga Histórica de Asientos de Ventas:**
   - Al sincronizar las 1,353 facturas generadas, el Estado de Resultados mostrará las ventas reales mes a mes (Agosto, Septiembre y Octubre de 2026), mostrando la curva de ingresos real del negocio.
4. **Agrupación Jerárquica por Naturaleza Corriente/No Corriente:**
   - Presentar el Balance General con subgrupos estándar: Activos Corrientes, Activos Fijos/No Corrientes, Pasivos a Corto Plazo y Pasivos a Largo Plazo.

