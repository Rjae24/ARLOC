-- ==============================================================================
-- SCHEMA COMPLETO DE BASE DE DATOS (ESTRUCTURA LIMPIA SIN DATOS) - ARLUC PRIME
-- ==============================================================================
-- Este script crea la estructura exacta de tablas, índices, llaves foráneas,
-- columnas generadas, triggers, funciones y políticas RLS para desplegar una
-- nueva instancia en Supabase lista para producción.
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLAS BASE
-- ==============================================================================

-- CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROVEEDORES
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    rif VARCHAR(50) UNIQUE,
    telefono VARCHAR(50),
    email VARCHAR(100),
    direccion TEXT,
    contacto_nombre VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTOS E INVENTARIO
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio_usd NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0 CONSTRAINT productos_stock_check CHECK (stock >= 0),
    stock_minimo INT NOT NULL DEFAULT 5,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    documento_identidad VARCHAR(50) UNIQUE,
    telefono VARCHAR(50),
    email VARCHAR(100),
    direccion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USUARIOS Y PERFILES DE ACCESO
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'vendedor',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TASAS DE CAMBIO (BCV / OFICIAL)
CREATE TABLE IF NOT EXISTS public.tasas_cambio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tasa_usd_bs NUMERIC(14, 4) NOT NULL,
    fecha_registro DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    registrado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FACTURAS / VENTAS
CREATE TABLE IF NOT EXISTS public.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_factura VARCHAR(100) UNIQUE NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tasa_id UUID REFERENCES public.tasas_cambio(id) ON DELETE SET NULL,
    subtotal_usd NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    descuento_usd NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_usd NUMERIC(14, 2) NOT NULL,
    total_bs NUMERIC(18, 2) NOT NULL,
    metodos_pago JSONB NOT NULL DEFAULT '[]'::jsonb,
    estado VARCHAR(50) NOT NULL DEFAULT 'emitida',
    fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DETALLES DE FACTURA
CREATE TABLE IF NOT EXISTS public.detalles_factura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    producto_nombre VARCHAR(200) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario_usd NUMERIC(14, 2) NOT NULL,
    subtotal_usd NUMERIC(14, 2) GENERATED ALWAYS AS (cantidad * precio_unitario_usd) STORED
);

-- ÓRDENES DE COMPRA
CREATE TABLE IF NOT EXISTS public.ordenes_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden VARCHAR(100) UNIQUE NOT NULL,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    registrado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_usd NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    notas TEXT,
    fecha_orden DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_recepcion DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DETALLES DE ÓRDENES DE COMPRA
CREATE TABLE IF NOT EXISTS public.detalles_orden_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario_usd NUMERIC(14, 2) NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL
);

-- ==============================================================================
-- 3. MÓDULO CONTABLE INTEGRAL (DOBLE PARTIDA)
-- ==============================================================================

-- CATÁLOGO DEL PLAN DE CUENTAS (PUC)
CREATE TABLE IF NOT EXISTS public.plan_cuentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- ACTIVO, PASIVO, PATRIMONIO, INGRESO, COSTO, GASTO
    naturaleza VARCHAR(20) NOT NULL DEFAULT 'DEUDORA', -- DEUDORA, ACREEDORA
    es_padre BOOLEAN NOT NULL DEFAULT false,
    cuenta_padre_id UUID REFERENCES public.plan_cuentas(id) ON DELETE CASCADE,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASIENTOS CONTABLES (LIBRO DIARIO)
CREATE TABLE IF NOT EXISTS public.asientos_contables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(100) UNIQUE NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    glosa TEXT NOT NULL,
    modulo VARCHAR(50) NOT NULL DEFAULT 'Manual',
    registrado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_debe NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    total_haber NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    balanceado BOOLEAN GENERATED ALWAYS AS (ROUND(total_debe, 2) = ROUND(total_haber, 2)) STORED,
    tasa_cambio NUMERIC(14, 4) NOT NULL DEFAULT 1.0000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LÍNEAS DE ASIENTO (PARTIDA DOBLE Y MULTIMONEDA)
CREATE TABLE IF NOT EXISTS public.lineas_asiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asiento_id UUID NOT NULL REFERENCES public.asientos_contables(id) ON DELETE CASCADE,
    cuenta_id UUID NOT NULL REFERENCES public.plan_cuentas(id) ON DELETE RESTRICT,
    debe NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    haber NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    debe_ves NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    haber_ves NUMERIC(18, 2) NOT NULL DEFAULT 0.00
);

-- ==============================================================================
-- 4. ÍNDICES DE RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON public.productos(sku);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON public.facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON public.facturas(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_detalles_factura_factura ON public.detalles_factura(factura_id);
CREATE INDEX IF NOT EXISTS idx_asientos_fecha ON public.asientos_contables(fecha);
CREATE INDEX IF NOT EXISTS idx_lineas_asiento_cuenta ON public.lineas_asiento(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_lineas_asiento_asiento ON public.lineas_asiento(asiento_id);

-- ==============================================================================
-- 5. FUNCIONES Y PROCEDIMIENTOS ALMACENADOS
-- ==============================================================================

-- GENERAR CORRELATIVO SECUENCIAL DE FACTURA
CREATE OR REPLACE FUNCTION public.generar_numero_factura()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_correlativo INT;
    v_prefijo TEXT;
BEGIN
    v_prefijo := 'ARLUC-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-';
    SELECT COALESCE(MAX(SUBSTRING(numero_factura FROM '[0-9]+$')::INT), 0) + 1
    INTO v_correlativo
    FROM public.facturas
    WHERE numero_factura LIKE v_prefijo || '%';
    
    RETURN v_prefijo || LPAD(v_correlativo::TEXT, 4, '0');
END;
$$;

-- TRIGGER PARA DESCONTAR INVENTARIO TRAS VENTA
CREATE OR REPLACE FUNCTION public.fn_descontar_stock_venta()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.producto_id IS NOT NULL THEN
        UPDATE public.productos
        SET stock = stock - NEW.cantidad
        WHERE id = NEW.producto_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_descontar_stock ON public.detalles_factura;
CREATE TRIGGER trg_descontar_stock
AFTER INSERT ON public.detalles_factura
FOR EACH ROW EXECUTE FUNCTION public.fn_descontar_stock_venta();

-- FUNCIÓN DE SEGURIDAD PARA VERIFICAR SI UN USUARIO ES ADMINISTRADOR
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'admin' AND activo = true
  );
$$;

-- ==============================================================================
-- 6. POLÍTICAS DE SEGURIDAD RLS (ROW LEVEL SECURITY - ZERO TRUST)
-- ==============================================================================
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalles_factura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasas_cambio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalles_orden_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asientos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineas_asiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_cuentas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

-- POLÍTICAS
CREATE POLICY "usuarios_select_auth" ON public.usuarios FOR SELECT TO authenticated USING (activo = true OR id = auth.uid() OR public.es_admin());
CREATE POLICY "usuarios_mod_admin" ON public.usuarios FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

CREATE POLICY "productos_select_auth" ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "productos_mod_admin" ON public.productos FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

CREATE POLICY "categorias_select_auth" ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "categorias_mod_admin" ON public.categorias FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

CREATE POLICY "clientes_select_auth" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "clientes_insert_auth" ON public.clientes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "clientes_update_auth" ON public.clientes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "clientes_delete_admin" ON public.clientes FOR DELETE TO authenticated USING (public.es_admin());

CREATE POLICY "facturas_select_auth" ON public.facturas FOR SELECT TO authenticated USING (true);
CREATE POLICY "facturas_insert_auth" ON public.facturas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "facturas_update_auth" ON public.facturas FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
-- INMUTABILIDAD FISCAL: SIN POLÍTICA DELETE EN FACTURAS NI DETALLES

CREATE POLICY "detalles_select_auth" ON public.detalles_factura FOR SELECT TO authenticated USING (true);
CREATE POLICY "detalles_insert_auth" ON public.detalles_factura FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tasas_select_auth" ON public.tasas_cambio FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasas_insert_auth" ON public.tasas_cambio FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tasas_mod_admin" ON public.tasas_cambio FOR UPDATE TO authenticated USING (public.es_admin());

CREATE POLICY "proveedores_select_auth" ON public.proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "proveedores_all_admin" ON public.proveedores FOR ALL TO authenticated USING (public.es_admin());

CREATE POLICY "ordenes_select_auth" ON public.ordenes_compra FOR SELECT TO authenticated USING (true);
CREATE POLICY "ordenes_mod_auth" ON public.ordenes_compra FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "detalles_ordenes_all" ON public.detalles_orden_compra FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "plan_cuentas_select_auth" ON public.plan_cuentas FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_cuentas_mod_admin" ON public.plan_cuentas FOR ALL TO authenticated USING (public.es_admin());

CREATE POLICY "asientos_select_auth" ON public.asientos_contables FOR SELECT TO authenticated USING (true);
CREATE POLICY "asientos_insert_auth" ON public.asientos_contables FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "lineas_select_auth" ON public.lineas_asiento FOR SELECT TO authenticated USING (true);
CREATE POLICY "lineas_insert_auth" ON public.lineas_asiento FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
-- INMUTABILIDAD CONTABLE: SIN POLÍTICA DELETE EN ASIENTOS NI LÍNEAS

