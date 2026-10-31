import { useState, useMemo } from 'react';
import Pagination from '../common/Pagination';
import {
  HiOutlineCube,
  HiOutlineBanknotes,
  HiOutlineExclamationTriangle,
  HiOutlineShoppingCart,
  HiOutlineArrowTrendingUp,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { formatUSD, formatBs } from '../../utils/formatters';

export default function InventarioValorizado({
  inventario = [],
  rankingProductos = {},
  diasPeriodo = 1,
  valorInventarioUSD = 0,
  tasaBsRef = 1,
  productosBajoStock = [],
  pageInventario = 1,
  setPageInventario,
}) {
  const [activeSubTab, setActiveSubTab] = useState('existencias'); // 'existencias' | 'proyeccion'
  const [diasProyeccion, setDiasProyeccion] = useState(7); // Días a abastecer (default: 1 semana para bodeguita)
  const [filtroSoloFaltantes, setFiltroSoloFaltantes] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [pageProyeccion, setPageProyeccion] = useState(1);
  const pageSize = 15;

  // ── Cálculo de la Proyección de Compras y Reposición ──────────────
  const proyeccionInventario = useMemo(() => {
    return inventario.map(prod => {
      const vendidos = rankingProductos[prod.nombre]?.cantidad || 0;
      const stock = Number(prod.stock || 0);
      const stockMin = Number(prod.stock_minimo || 0);
      const precioUSD = parseFloat(prod.precio_usd || 0);

      // Ritmo de venta diario (en el período seleccionado)
      const ritmoDiario = diasPeriodo > 0 && vendidos > 0 ? vendidos / diasPeriodo : 0;

      // Demanda proyectada para los próximos N días
      const demandaProyectada = ritmoDiario * diasProyeccion;

      // Días de autonomía o cobertura con el stock actual
      const diasCobertura = ritmoDiario > 0 ? stock / ritmoDiario : null;

      // Stock proyectado al final de los días
      const stockProyectadoFinal = Math.max(0, stock - demandaProyectada);

      // Cantidad sugerida a comprar:
      // Abastecer la demanda proyectada + asegurar que no baje del stock mínimo
      let sugeridoComprar = 0;
      if (stock <= stockMin || stock < demandaProyectada + stockMin) {
        // Necesitamos cubrir la demanda proyectada y quedar al menos con el stock mínimo
        sugeridoComprar = Math.ceil(Math.max(0, (demandaProyectada + stockMin) - stock));
      }

      const costoEstimadoUSD = sugeridoComprar * precioUSD;
      const costoEstimadoBs  = costoEstimadoUSD * tasaBsRef;

      // Nivel de urgencia
      let urgencia = 'optimo'; // 'agotado' | 'critico' | 'comprar' | 'optimo'
      if (stock <= 0) {
        urgencia = 'agotado';
      } else if (stock <= stockMin || (diasCobertura !== null && diasCobertura <= 2)) {
        urgencia = 'critico';
      } else if (sugeridoComprar > 0 || (diasCobertura !== null && diasCobertura <= diasProyeccion)) {
        urgencia = 'comprar';
      }

      return {
        ...prod,
        stock,
        stockMin,
        precioUSD,
        vendidos,
        ritmoDiario,
        demandaProyectada,
        diasCobertura,
        stockProyectadoFinal,
        sugeridoComprar,
        costoEstimadoUSD,
        costoEstimadoBs,
        urgencia,
      };
    }).sort((a, b) => {
      // Priorizar los agotados y críticos primero
      const orden = { agotado: 0, critico: 1, comprar: 2, optimo: 3 };
      if (orden[a.urgencia] !== orden[b.urgencia]) {
        return orden[a.urgencia] - orden[b.urgencia];
      }
      return b.sugeridoComprar - a.sugeridoComprar;
    });
  }, [inventario, rankingProductos, diasPeriodo, diasProyeccion, tasaBsRef]);

  // Totales de la proyección
  const productosAComprar = proyeccionInventario.filter(p => p.sugeridoComprar > 0);
  const inversionTotalUSD = productosAComprar.reduce((s, p) => s + p.costoEstimadoUSD, 0);
  const inversionTotalBs  = inversionTotalUSD * tasaBsRef;
  const totalUnidadesAComprar = productosAComprar.reduce((s, p) => s + p.sugeridoComprar, 0);

  // Filtrado para la tabla de proyección
  const proyeccionFiltrada = proyeccionInventario.filter(p => {
    const matchTxt = `${p.sku || ''} ${p.nombre} ${p.categorias?.nombre || ''}`.toLowerCase().includes(busqueda.toLowerCase());
    if (!matchTxt) return false;
    if (filtroSoloFaltantes) return p.sugeridoComprar > 0;
    return true;
  });

  const pagedProyeccion = proyeccionFiltrada.slice((pageProyeccion - 1) * pageSize, pageProyeccion * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Subpestañas Superiores ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeSubTab === 'existencias' ? 'btn--primary' : 'btn--outline'}`}
          onClick={() => setActiveSubTab('existencias')}
          style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <HiOutlineCube /> Existencias y Valoración
        </button>
        <button
          className={`btn ${activeSubTab === 'proyeccion' ? 'btn--primary' : 'btn--outline'}`}
          onClick={() => setActiveSubTab('proyeccion')}
          style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <HiOutlineShoppingCart /> Proyección de Compras y Reposición
          {productosAComprar.length > 0 && (
            <span className="badge" style={{ background: '#EF4444', color: '#fff', marginLeft: '4px' }}>
              {productosAComprar.length} por comprar
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VISTA 1: PROYECCIÓN DE COMPRAS SEGÚN VENTAS Y STOCK
      ══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'proyeccion' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header explicativo y controles de proyección */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, var(--bg-card) 100%)', borderLeft: '4px solid #EF4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                  <HiOutlineArrowTrendingUp style={{ color: '#EF4444' }} />
                  Proyección Inteligente de Reposición para Bodega
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Calcula exactamente qué productos debes comprar analizando tu ritmo de ventas y stock actual.
                </p>
              </div>

              {/* Selector de Días a Abastecer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Abastecer para:
                </span>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {[
                    { dias: 3, label: '3 Días' },
                    { dias: 7, label: '1 Semana (7d)' },
                    { dias: 15, label: 'Quincena (15d)' },
                    { dias: 30, label: '1 Mes (30d)' },
                  ].map(p => (
                    <button
                      key={p.dias}
                      onClick={() => { setDiasProyeccion(p.dias); setPageProyeccion(1); }}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: '44px',
                        transition: 'all 0.15s ease',
                        borderColor: diasProyeccion === p.dias ? '#EF4444' : 'var(--border)',
                        background: diasProyeccion === p.dias ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        color: diasProyeccion === p.dias ? '#EF4444' : 'var(--text-secondary)',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tarjetas resumen de compra proyectada */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
            <div className="stat-card" style={{ borderTop: '3px solid #EF4444' }}>
              <div className="stat-card__icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                <HiOutlineShoppingCart />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Artículos a Reponer</span>
                <span className="stat-card__value" style={{ color: '#EF4444' }}>
                  {productosAComprar.length}
                </span>
                <span className="stat-card__sub">{totalUnidadesAComprar} unidades en total</span>
              </div>
            </div>

            <div className="stat-card" style={{ borderTop: '3px solid #F59E0B' }}>
              <div className="stat-card__icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                <HiOutlineBanknotes />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Inversión Estimada USD</span>
                <span className="stat-card__value" style={{ color: '#F59E0B' }}>
                  {formatUSD(inversionTotalUSD)}
                </span>
                <span className="stat-card__sub">A precio base de compra/venta</span>
              </div>
            </div>

            <div className="stat-card" style={{ borderTop: '3px solid #3B82F6' }}>
              <div className="stat-card__icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
                <HiOutlineCube />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Inversión en Bolívares</span>
                <span className="stat-card__value">
                  {formatBs(inversionTotalBs)}
                </span>
                <span className="stat-card__sub">Tasa Ref: {tasaBsRef.toFixed(2)} Bs/$</span>
              </div>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtro Rápido */}
          <div className="card" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
                <HiOutlineMagnifyingGlass style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar producto a reponer..."
                  value={busqueda}
                  onChange={e => { setBusqueda(e.target.value); setPageProyeccion(1); }}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    padding: '0.4rem 0.65rem',
                    fontSize: '0.85rem',
                    width: '100%',
                    minHeight: '44px',
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={filtroSoloFaltantes}
                  onChange={e => { setFiltroSoloFaltantes(e.target.checked); setPageProyeccion(1); }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '600', color: filtroSoloFaltantes ? '#EF4444' : 'var(--text-secondary)' }}>
                  Mostrar solo lo que falta comprar ({productosAComprar.length})
                </span>
              </label>
            </div>
          </div>

          {/* Tabla de Proyección de Reposición */}
          <div className="card">
            <h3 className="card__title" style={{ justifyContent: 'space-between' }}>
              <span>Lista de Compras Proyectadas (Próximos {diasProyeccion} días)</span>
              <span className="badge badge--primary" style={{ fontSize: '0.78rem' }}>
                {proyeccionFiltrada.length} productos analizados
              </span>
            </h3>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Producto</th>
                    <th style={{ textAlign: 'center' }}>Stock Actual</th>
                    <th style={{ textAlign: 'center' }}>Mínimo</th>
                    <th style={{ textAlign: 'center' }}>Salidas ({diasPeriodo}d)</th>
                    <th style={{ textAlign: 'center' }}>Ritmo / Día</th>
                    <th style={{ textAlign: 'center' }}>Cobertura</th>
                    <th style={{ textAlign: 'center' }}>Comprar Sugerido</th>
                    <th style={{ textAlign: 'right' }}>Costo Est. (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProyeccion.map(p => {
                    const badgeUrgencia = () => {
                      if (p.urgencia === 'agotado') {
                        return <span className="badge badge--danger" style={{ fontWeight: 'bold' }}>AGOTADO</span>;
                      }
                      if (p.urgencia === 'critico') {
                        return <span className="badge badge--danger">CRÍTICO</span>;
                      }
                      if (p.urgencia === 'comprar') {
                        return <span className="badge badge--warning">REPONER</span>;
                      }
                      return <span className="badge badge--success">ÓPTIMO</span>;
                    };

                    return (
                      <tr key={p.id} style={{ background: p.sugeridoComprar > 0 ? 'rgba(239, 68, 68, 0.02)' : undefined }}>
                        <td>{badgeUrgencia()}</td>
                        <td>
                          <strong>{p.nombre}</strong>
                          {p.sku && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${p.stock <= p.stockMin ? 'badge--danger' : 'badge--success'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {p.stockMin}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge--primary">{p.vendidos}</span>
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {p.ritmoDiario > 0 ? `${p.ritmoDiario.toFixed(1)}/día` : '0'}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                          {p.diasCobertura !== null ? (
                            <span style={{ color: p.diasCobertura <= 3 ? '#EF4444' : p.diasCobertura <= 7 ? '#F59E0B' : 'var(--text-primary)', fontWeight: 'bold' }}>
                              {p.diasCobertura.toFixed(0)} días
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Sin salidas</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {p.sugeridoComprar > 0 ? (
                            <span
                              className="badge"
                              style={{
                                background: '#EF4444',
                                color: '#fff',
                                fontWeight: '900',
                                fontSize: '0.85rem',
                                padding: '4px 8px',
                              }}
                            >
                              + {p.sugeridoComprar} uds
                            </span>
                          ) : (
                            <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.8rem' }}>
                              <HiOutlineCheckCircle /> Cubierto
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: p.costoEstimadoUSD > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {p.costoEstimadoUSD > 0 ? formatUSD(p.costoEstimadoUSD) : '—'}
                        </td>
                      </tr>
                    );
                  })}

                  {proyeccionFiltrada.length === 0 && (
                    <tr>
                      <td colSpan="9" className="table__empty">
                        No se encontraron productos para los criterios de proyección.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {proyeccionFiltrada.length > pageSize && (
              <Pagination
                currentPage={pageProyeccion}
                totalItems={proyeccionFiltrada.length}
                pageSize={pageSize}
                onPageChange={setPageProyeccion}
              />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VISTA 2: EXISTENCIAS Y VALORACIÓN (ORIGINAL)
      ══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'existencias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="stat-card">
              <div className="stat-card__icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
                <HiOutlineCube />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Valor USD</span>
                <span className="stat-card__value">{formatUSD(valorInventarioUSD)}</span>
                <span className="stat-card__sub">{inventario.length} productos activos</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
                <HiOutlineBanknotes />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Valor Bs (tasa actual)</span>
                <span className="stat-card__value">{formatBs(valorInventarioUSD * tasaBsRef)}</span>
                <span className="stat-card__sub">Tasa: {tasaBsRef.toFixed(2)} Bs/$</span>
              </div>
            </div>

            <div className="stat-card" style={{ borderColor: productosBajoStock.length > 0 ? 'rgba(239,68,68,0.3)' : undefined }}>
              <div className="stat-card__icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                <HiOutlineExclamationTriangle />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Stock Crítico</span>
                <span className="stat-card__value" style={{ color: productosBajoStock.length > 0 ? '#EF4444' : undefined }}>
                  {productosBajoStock.length}
                </span>
                <span className="stat-card__sub">artículos bajo el mínimo</span>
              </div>
            </div>
          </div>

          {/* Critical stock alert */}
          {productosBajoStock.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid #EF4444', background: 'rgba(239,68,68,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <HiOutlineExclamationTriangle style={{ color: '#EF4444', fontSize: '1.25rem' }} />
                <h4 style={{ margin: 0, color: '#EF4444' }}>Alerta Stock Crítico ({productosBajoStock.length} artículos)</h4>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {productosBajoStock.map(p => (
                  <span key={p.id} className="badge badge--danger">
                    {p.nombre} ({p.stock}/{p.stock_minimo})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Products table */}
          <div className="card">
            <h3 className="card__title">Valoración de Existencias</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'right' }}>Precio USD</th>
                    <th style={{ textAlign: 'center' }}>Stock</th>
                    <th style={{ textAlign: 'right' }}>Valor USD</th>
                    <th style={{ textAlign: 'right' }}>Valor Bs</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.slice((pageInventario - 1) * 20, pageInventario * 20).map(p => {
                    const vUSD = p.stock * parseFloat(p.precio_usd || 0);
                    const vBs = vUSD * tasaBsRef;
                    const bajo = p.stock <= p.stock_minimo;
                    return (
                      <tr key={p.id}>
                        <td><code>{p.sku}</code></td>
                        <td><strong>{p.nombre}</strong></td>
                        <td>{p.categorias?.nombre || 'General'}</td>
                        <td style={{ textAlign: 'right' }}>{formatUSD(p.precio_usd)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${bajo ? 'badge--danger' : 'badge--success'}`}>{p.stock}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}><strong>{formatUSD(vUSD)}</strong></td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{formatBs(vBs)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pageInventario}
              totalItems={inventario.length}
              pageSize={20}
              onPageChange={setPageInventario}
            />
          </div>
        </div>
      )}
    </div>
  );
}
