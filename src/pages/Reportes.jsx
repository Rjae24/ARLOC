import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatUSD, formatBs, formatFecha } from '../utils/formatters';
import { getEmpresaConfig } from '../utils/constants';
import toast from 'react-hot-toast';

import {
  HiOutlineDocumentChartBar,
  HiOutlineArrowDownTray,
  HiOutlinePrinter,
  HiOutlineCalendar,
  HiOutlineBanknotes,
  HiOutlineCreditCard,
  HiOutlineCube,
  HiOutlineUserGroup,
  HiOutlineNoSymbol,
  HiOutlineArrowTrendingUp,
  HiOutlineChartBar,
  HiOutlineBuildingLibrary,
} from 'react-icons/hi2';

import { procesarCierreCaja } from '../components/reportes/cierreCajaHelper';
import { exportarVentasExcel, exportarInventarioExcel } from '../components/reportes/ReporteExportUtils';
import CierreCajaCards from '../components/reportes/CierreCajaCards';
import CierreCajaTable from '../components/reportes/CierreCajaTable';
import ReporteVentasDetalladas from '../components/reportes/ReporteVentasDetalladas';
import TopBottomProductos from '../components/reportes/TopBottomProductos';
import RendimientoVendedores from '../components/reportes/RendimientoVendedores';
import InventarioValorizado from '../components/reportes/InventarioValorizado';
import DistribucionMetodosPago from '../components/reportes/DistribucionMetodosPago';

// ── Date preset helpers (HOY como prioridad) ──────────────────────
function getPreset(preset) {
  const now = new Date();
  const pad = d => d.toISOString().split('T')[0];
  switch (preset) {
    case 'hoy':
      return { desde: pad(now), hasta: pad(now) };
    case '7d': {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      return { desde: pad(d), hasta: pad(now) };
    }
    case '30d': {
      const d = new Date(now); d.setDate(d.getDate() - 29);
      return { desde: pad(d), hasta: pad(now) };
    }
    case 'mes': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { desde: pad(d), hasta: pad(now) };
    }
    case 'anio': {
      const d = new Date(now.getFullYear(), 0, 1);
      return { desde: pad(d), hasta: pad(now) };
    }
    default:
      return null;
  }
}

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ventas');
  
  // Solicitud del usuario: 'hoy' predeterminado
  const [activePreset, setActivePreset] = useState('hoy');
  const defaultPreset = getPreset('hoy');
  const [fechaDesde, setFechaDesde] = useState(defaultPreset.desde);
  const [fechaHasta, setFechaHasta] = useState(defaultPreset.hasta);

  const [pageInventario, setPageInventario] = useState(1);
  const [pageVendedores, setPageVendedores] = useState(1);
  const empresaConfig = getEmpresaConfig();

  // Data
  const [ventas, setVentas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [tasaActual, setTasaActual] = useState(null);

  useEffect(() => {
    loadReportes();
  }, [fechaDesde, fechaHasta]);

  async function loadReportes() {
    setLoading(true);
    try {
      const [
        { data: facturasData, error: fErr },
        { data: prodsData, error: pErr },
        { data: rateData },
      ] = await Promise.all([
        supabase
          .from('facturas')
          .select(`
            id, numero_factura, fecha_emision, estado, total_usd, total_bs, metodos_pago,
            clientes(nombre, documento_identidad),
            usuarios!facturas_vendedor_id_fkey(nombre_completo),
            detalles_factura(producto_nombre, cantidad, precio_unitario_usd, subtotal_usd)
          `)
          .gte('fecha_emision', `${fechaDesde}T00:00:00`)
          .lte('fecha_emision', `${fechaHasta}T23:59:59`)
          .order('fecha_emision', { ascending: false }),
        supabase
          .from('productos')
          .select('id, sku, nombre, precio_usd, stock, stock_minimo, categorias(nombre)')
          .eq('activo', true)
          .order('nombre'),
        supabase
          .from('tasas_cambio')
          .select('tasa_usd_bs')
          .order('fecha_registro', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (fErr) throw fErr;
      if (pErr) throw pErr;

      setVentas(facturasData || []);
      setInventario(prodsData || []);
      setTasaActual(rateData);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      toast.error('Error al cargar datos del reporte');
    } finally {
      setLoading(false);
    }
  }

  // ── Calculated Metrics ───────────────────────────────────────────
  const facturasEmitidas = ventas.filter(f => f.estado === 'emitida');
  const facturasAnuladas = ventas.filter(f => f.estado === 'anulada');

  const totalUSD = facturasEmitidas.reduce((s, f) => s + parseFloat(f.total_usd || 0), 0);
  const totalBs  = facturasEmitidas.reduce((s, f) => s + parseFloat(f.total_bs  || 0), 0);
  const ticketPromedio = facturasEmitidas.length > 0 ? totalUSD / facturasEmitidas.length : 0;
  const tasaBsRef = tasaActual?.tasa_usd_bs || 1;

  // Cierre de Caja (Arqueo Bodeguita)
  const cierreCaja = procesarCierreCaja(facturasEmitidas, tasaBsRef);

  // Breakdown para ranking de productos
  const rankingProductos = {};
  facturasEmitidas.forEach(f => {
    (f.detalles_factura || []).forEach(d => {
      const key = d.producto_nombre || 'Producto';
      if (!rankingProductos[key]) rankingProductos[key] = { cantidad: 0, total_usd: 0 };
      rankingProductos[key].cantidad += d.cantidad;
      rankingProductos[key].total_usd += parseFloat(d.subtotal_usd || (d.cantidad * (d.precio_unitario_usd || 0)));
    });
  });

  const listaRanking = Object.entries(rankingProductos)
    .map(([nombre, s]) => ({ nombre, ...s }))
    .sort((a, b) => b.cantidad - a.cantidad);
  const topProductos = listaRanking.slice(0, 10);

  const productosSinVentas = inventario
    .filter(p => !rankingProductos[p.nombre])
    .map(p => ({ nombre: p.nombre, sku: p.sku, cantidad: 0, total_usd: 0 }));

  const productosPocoMovimiento = [
    ...listaRanking.slice(-Math.min(10, listaRanking.length)).reverse(),
    ...productosSinVentas,
  ]
    .filter((p, idx, arr) => arr.findIndex(x => x.nombre === p.nombre) === idx)
    .slice(0, 10);

  // Breakdown por Métodos de Pago
  const metodosTotales = {};
  facturasEmitidas.forEach(f => {
    (f.metodos_pago || []).forEach(mp => {
      const key = mp.metodo || mp.label || 'Otro';
      if (!metodosTotales[key]) metodosTotales[key] = { total_usd: 0, total_bs: 0, transacciones: 0 };
      metodosTotales[key].total_usd += parseFloat(mp.monto_usd || 0);
      metodosTotales[key].total_bs  += parseFloat(mp.monto_bs  || 0);
      metodosTotales[key].transacciones += 1;
    });
  });

  const metodosOrdenados = Object.entries(metodosTotales)
    .map(([m, s]) => ({ metodo: m, ...s }))
    .sort((a, b) => b.total_usd - a.total_usd);
  const maxMetodoUSD = metodosOrdenados[0]?.total_usd || 1;

  // Rendimiento de vendedores
  const vendedoresTotales = {};
  facturasEmitidas.forEach(f => {
    const key = f.usuarios?.nombre_completo || 'Sin asignar';
    if (!vendedoresTotales[key]) vendedoresTotales[key] = { facturas: 0, total_usd: 0, total_bs: 0 };
    vendedoresTotales[key].facturas  += 1;
    vendedoresTotales[key].total_usd += parseFloat(f.total_usd || 0);
    vendedoresTotales[key].total_bs  += parseFloat(f.total_bs  || 0);
  });
  const listaVendedores = Object.entries(vendedoresTotales)
    .map(([nombre, s]) => ({ nombre, ...s }))
    .sort((a, b) => b.total_usd - a.total_usd);
  const maxVendedorUSD = listaVendedores[0]?.total_usd || 1;

  // Días del período seleccionado
  const diasPeriodo = Math.max(1, Math.round((new Date(fechaHasta) - new Date(fechaDesde)) / (1000 * 60 * 60 * 24)) + 1);

  // Inventario
  const valorInventarioUSD = inventario.reduce((s, p) => s + (p.stock * parseFloat(p.precio_usd || 0)), 0);
  const productosBajoStock = inventario.filter(p => p.stock <= p.stock_minimo);

  // Filtros de fecha
  function applyPreset(preset) {
    const range = getPreset(preset);
    if (!range) return;
    setActivePreset(preset);
    setFechaDesde(range.desde);
    setFechaHasta(range.hasta);
    setPageVendedores(1);
  }

  function handleManualDate(field, value) {
    setActivePreset(null);
    if (field === 'desde') setFechaDesde(value);
    else setFechaHasta(value);
  }

  function handleExportarExcel() {
    if (activeTab === 'inventario') {
      exportarInventarioExcel({ inventario, tasaBsRef });
    } else {
      exportarVentasExcel({
        facturasEmitidas,
        totalUSD,
        totalBs,
        fechaDesde,
        fechaHasta,
        cierreCaja,
        topProductos,
        listaVendedores,
      });
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Generando reportes...</p>
      </div>
    );
  }

  const PRESETS = [
    { id: 'hoy',  label: 'Hoy' },
    { id: '7d',   label: '7 días' },
    { id: '30d',  label: '30 días' },
    { id: 'mes',  label: 'Este mes' },
    { id: 'anio', label: 'Este año' },
  ];

  const TABS = [
    { id: 'ventas',     label: 'Ventas del Día',          icon: <HiOutlineArrowTrendingUp /> },
    { id: 'cierre',     label: 'Cierre de Caja (Arqueo)', icon: <HiOutlineBuildingLibrary /> },
    { id: 'vendedores', label: 'Por Vendedor',             icon: <HiOutlineUserGroup /> },
    { id: 'metodos',    label: 'Métodos de Pago',          icon: <HiOutlineChartBar /> },
    { id: 'inventario', label: 'Inventario Valorizado',    icon: <HiOutlineCube /> },
  ];

  return (
    <div className="page reportes-page">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="page__header no-print">
        <div>
          <h1 className="page__title">Reportes de Venta</h1>
          <p className="page__subtitle">Control de ventas, artículos despachados, arqueo diario y crédito/fiados</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn btn--primary"
            onClick={() => window.print()}
            title="Generar PDF del reporte"
            style={{ minHeight: '44px' }}
          >
            <HiOutlinePrinter /> Exportar PDF
          </button>
          <button
            className="btn btn--outline"
            onClick={handleExportarExcel}
            style={{ borderColor: '#10B981', color: '#10B981', fontWeight: 'bold', minHeight: '44px' }}
            title="Descargar libro Excel profesional (.xlsx)"
          >
            <HiOutlineArrowDownTray /> Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* ── Filtros y Pestañas ──────────────────────────────────── */}
      <div className="card no-print" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineCalendar style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              PERÍODO:
            </span>
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minHeight: '44px',
                  transition: 'all 0.15s ease',
                  borderColor: activePreset === p.id ? 'var(--primary)' : 'var(--border)',
                  background: activePreset === p.id ? 'var(--primary-bg)' : 'transparent',
                  color: activePreset === p.id ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Manual date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Desde</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => handleManualDate('desde', e.target.value)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                padding: '0.35rem 0.55rem',
                fontSize: '0.82rem',
                minHeight: '44px',
              }}
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Hasta</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => handleManualDate('hasta', e.target.value)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                padding: '0.35rem 0.55rem',
                fontSize: '0.82rem',
                minHeight: '44px',
              }}
            />
          </div>
        </div>

        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.9rem',
                borderRadius: '7px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: '44px',
                transition: 'all 0.2s ease',
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Printable Header ────────────────────────────────────── */}
      <div className="print-report-header">
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', margin: '0 0 2px' }}>
          {empresaConfig?.nombre || 'COMERCIALIZADORA ARLUC C.A.'}
        </h2>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
          RIF: {empresaConfig?.rif || 'J-500654642'}
        </div>
        <h3 style={{ fontSize: '14px', margin: '4px 0', color: '#000', textTransform: 'uppercase' }}>
          Reporte de Ventas ({activeTab === 'cierre' ? 'Cierre de Caja Diario' : 'Ventas y Artículos'})
        </h3>
        <p style={{ fontSize: '11px', color: '#555', margin: '4px 0' }}>
          Período: {formatFecha(fechaDesde)} al {formatFecha(fechaHasta)} | Generado: {formatFecha(new Date(), true)}
        </p>
        <hr style={{ margin: '10px 0', borderColor: '#000' }} />
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--primary"><HiOutlineBanknotes /></div>
          <div className="stat-card__content">
            <span className="stat-card__label">Facturación USD</span>
            <span className="stat-card__value">{formatUSD(totalUSD)}</span>
            <span className="stat-card__sub">{facturasEmitidas.length} facturas emitidas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--success"><HiOutlineCreditCard /></div>
          <div className="stat-card__content">
            <span className="stat-card__label">Facturación Bs</span>
            <span className="stat-card__value">{formatBs(totalBs)}</span>
            <span className="stat-card__sub">Al cambio de cada operación</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--info"><HiOutlineDocumentChartBar /></div>
          <div className="stat-card__content">
            <span className="stat-card__label">Ticket Promedio</span>
            <span className="stat-card__value">{formatUSD(ticketPromedio)}</span>
            <span className="stat-card__sub">Promedio por venta</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: facturasAnuladas.length > 0 ? 'rgba(239,68,68,0.3)' : undefined }}>
          <div className="stat-card__icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
            <HiOutlineNoSymbol />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Facturas Anuladas</span>
            <span className="stat-card__value" style={{ color: facturasAnuladas.length > 0 ? '#EF4444' : undefined }}>
              {facturasAnuladas.length}
            </span>
            <span className="stat-card__sub">
              {facturasAnuladas.length > 0
                ? `${formatUSD(facturasAnuladas.reduce((s, f) => s + parseFloat(f.total_usd || 0), 0))} anulados`
                : 'Sin anulaciones'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Pestaña 1: Ventas del Día y Detalle de Artículos ────────── */}
      {activeTab === 'ventas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Tabla detallada con Artículos, Métodos de Pago y Hora */}
          <ReporteVentasDetalladas ventas={facturasEmitidas} />

          {/* Ranking Top y Menor Movimiento */}
          <TopBottomProductos
            topProductos={topProductos}
            productosPocoMovimiento={productosPocoMovimiento}
            listaRanking={listaRanking}
            totalUSD={totalUSD}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
          />
        </div>
      )}

      {/* ── Pestaña 2: Cierre de Caja (Arqueo Bodega) ──────────────── */}
      {activeTab === 'cierre' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-bg) 0%, var(--bg-card) 100%)', borderColor: 'var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                  <HiOutlineBuildingLibrary style={{ color: 'var(--primary)' }} />
                  Cierre de Caja y Arqueo Diario
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Conciliación de dinero físico en gaveta, transferencias en bancos, Zelle y registro de fiados
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}>
                  Período: {formatFecha(fechaDesde)} al {formatFecha(fechaHasta)}
                </span>
                <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}>
                  Tasa Ref: {tasaBsRef.toFixed(2)} Bs/$
                </span>
                <span className="badge badge--success" style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}>
                  {facturasEmitidas.length} Facturas Emitidas
                </span>
              </div>
            </div>
          </div>

          <CierreCajaCards cierreCaja={cierreCaja} />
          <CierreCajaTable
            cierreCaja={cierreCaja}
            facturasEmitidas={facturasEmitidas}
            totalUSD={totalUSD}
            totalBs={totalBs}
          />
        </div>
      )}

      {/* ── Pestaña 3: Por Vendedor ────────────────────────────────── */}
      {activeTab === 'vendedores' && (
        <RendimientoVendedores
          listaVendedores={listaVendedores}
          totalUSD={totalUSD}
          maxVendedorUSD={maxVendedorUSD}
          pageVendedores={pageVendedores}
          setPageVendedores={setPageVendedores}
        />
      )}

      {/* ── Pestaña 4: Métodos de Pago ─────────────────────────────── */}
      {activeTab === 'metodos' && (
        <DistribucionMetodosPago
          metodosOrdenados={metodosOrdenados}
          totalUSD={totalUSD}
          totalBs={totalBs}
          maxMetodoUSD={maxMetodoUSD}
        />
      )}

      {/* ── Pestaña 5: Inventario Valorizado & Proyección ─────────── */}
      {activeTab === 'inventario' && (
        <InventarioValorizado
          inventario={inventario}
          rankingProductos={rankingProductos}
          diasPeriodo={diasPeriodo}
          valorInventarioUSD={valorInventarioUSD}
          tasaBsRef={tasaBsRef}
          productosBajoStock={productosBajoStock}
          pageInventario={pageInventario}
          setPageInventario={setPageInventario}
        />
      )}
    </div>
  );
}
