# ARLUC

Sistema integral de punto de venta (POS), facturación, inventario, clientes, proveedores, órdenes de compra y reportería avanzada con integración a Supabase y cálculo automático multimoneda (USD / Bs con tasa oficial BCV).

## Paleta de Colores y Temas

- **Tema Claro (Verde y Blanco):**
  - Colores principales: Verde Esmeralda (`#16A34A`), fondos blancos puros (`#FFFFFF` y `#F8FAFC`) con tipografía de alto contraste.
- **Tema Oscuro (Verde y Negro Grisáceo):**
  - Colores principales: Verde Vibrante (`#22C55E`), fondos en negro grisáceo (`#121519` y `#181C22`) con estética moderna de alto impacto.

Permite alternar entre ambos temas con un clic desde la barra lateral, cabecera móvil, pantalla de inicio de sesión o panel de configuración.

## Tecnologías

- **Frontend:** React 19 + Vite + Vanilla CSS & Tailwind CSS Tokens
- **Backend / Base de Datos:** Supabase (PostgreSQL, Row Level Security & Auth)
- **Reportería & Exportación:** Recharts, SheetJS (XLSX), JsBarcode
- **Multimoneda:** Integración en tiempo real con tasa oficial del Banco Central de Venezuela (BCV)

El módulo de Inventario incluye reportes de salidas por ventas, proyección de existencias y alertas de rotación, con filtros por periodo y exportación a Excel o PDF.
