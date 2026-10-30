# Carpeta de Auditoría: Módulo de Contabilidad General

Esta carpeta contiene la inspección técnica exhaustiva realizada al módulo de **Contabilidad General** del ERP ARLUC, respondiendo al diagnóstico de por qué no se observan datos reales del sistema, si el diseño actual tiene sentido y cómo sincronizarlo con la operación diaria del negocio.

---

## 📑 Índice de Informes Generados

| # | Archivo de Auditoría | Submódulo / Alcance | Estado Actual | Veredicto |
|---|---|---|---|---|
| **00** | [**Diagnóstico General de Integración**](00_DIAGNOSTICO_GENERAL_INTEGRACION.md) | Arquitectura Global y Conexión con Ventas/POS/CxC | Desconexión Total (Solo 3 asientos mockeados en BD) | 🔴 Requiere Automatización |
| **01** | [**Plan de Cuentas (PUC)**](01_INFORME_PLAN_DE_CUENTAS.md) | `PlanCuentas.jsx` (Catálogo NIIF de 47 cuentas) | 659 líneas (Excede 600) | 🟡 Estructura Sólida, falta mapeo de enlace |
| **02** | [**Libro Diario**](02_INFORME_LIBRO_DIARIO.md) | `LibroDiario.jsx` (Registro cronológico de asientos) | 370 líneas (OK) | 🔴 Carga manual obligada, sin asientos de POS |
| **03** | [**Libro Mayor**](03_INFORME_LIBRO_MAYOR.md) | `LibroMayor.jsx` (Saldos individuales por cuenta) | 585 líneas (Cerca límite) | 🟡 41 cuentas vacías por falta de asientos |
| **04** | [**Balance de Comprobación**](04_INFORME_BALANCE_COMPROBACION.md) | `BalanceComprobacion.jsx` (Sumas y saldos 4 col.) | 436 líneas (OK) | 🔴 Matemáticamente correcto, cifras irreales |
| **05** | [**Estados Financieros**](05_INFORME_ESTADOS_FINANCIEROS.md) | `EstadosFinancieros.jsx` (P&L y Balance General) | 877 líneas (Excede 600) | 🔴 P&L reporta $1,000 mientras ventas son miles |
| **06** | [**PLAN MAESTRO DE REDISEÑO Y CORRECCIÓN**](06_PLAN_MAESTRO_REDISENO_Y_CORRECCION.md) | Estrategia Integral, Automatización y Modularización | 5 Fases de Implementación | 🚀 Hoja de Ruta de Ingeniería |

---

## 🎯 Síntesis del Diagnóstico en 3 Puntos

1. **¿Qué está pasando ahí?**
   En la base de datos de Supabase existen **1,353 facturas de ventas reales** y **70 abonos de crédito**, pero en las tablas contables (`asientos_contables` y `lineas_asiento`) **solo existen 3 asientos de prueba antiguos**. Las pantallas de contabilidad leen exclusivamente esa tabla de asientos, por lo que nunca ven las ventas reales.

2. **¿Tiene sentido o no?**
   - **La matemática contable:** SÍ tiene sentido. El cálculo de partida doble en céntimos, la dualidad monetaria (USD y Bs) y el catálogo NIIF están muy bien formulados conceptualmente.
   - **El flujo operacional:** NO tiene sentido. Obliga a transcribir a mano cientos de operaciones cuando deberían automatizarse mediante triggers en Postgres o servicios en segundo plano al cobrar una venta o recibir un abono.

3. **¿Cómo solucionarlo?**
   - **Paso 1 (Inmediato):** Ejecutar una rutina de contabilización retroactiva (Backfill) que tome las 1,353 ventas históricas y genere sus asientos de partida doble automáticamente (Caja/Bancos a Ventas/IVA/CxC).
   - **Paso 2 (Tiempo Real):** Conectar el Punto de Venta (`POS.jsx`) y el modal de abonos (`CxCAbonoModal.jsx`) para que cada transacción genere su asiento contable de forma transparente.
   - **Paso 3 (Clean Code):** Modularizar `EstadosFinancieros.jsx` (877 líneas) y `PlanCuentas.jsx` (659 líneas) para respetar el umbral de 600 líneas.

