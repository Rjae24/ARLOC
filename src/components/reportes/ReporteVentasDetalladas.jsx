import { useState } from 'react';
import { formatUSD, formatBs, formatFecha } from '../../utils/formatters';
import Pagination from '../common/Pagination';
import {
  HiOutlineDocumentText,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineCreditCard,
} from 'react-icons/hi2';

export default function ReporteVentasDetalladas({ ventas = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filtroMetodo, setFiltroMetodo] = useState('todos');
  const pageSize = 15;

  // Filtrado opcional por método de pago
  const ventasFiltradas = ventas.filter(f => {
    if (filtroMetodo === 'todos') return true;
    if (filtroMetodo === 'credito') {
      return (f.metodos_pago || []).some(m => {
        const id = (m.metodo_id || m.id || m.metodo || '').toLowerCase();
        return id.includes('credito') || id.includes('fiado');
      });
    }
    return (f.metodos_pago || []).some(m => {
      const id = (m.metodo_id || m.id || m.metodo || '').toLowerCase();
      return id.includes(filtroMetodo);
    });
  });

  const totalPages = Math.ceil(ventasFiltradas.length / pageSize);
  const pagedVentas = ventasFiltradas.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleRow(id) {
    setExpandedRow(prev => (prev === id ? null : id));
  }

  function getBadgeMetodo(mp) {
    const m = (mp.metodo || mp.label || 'Otro').toLowerCase();
    if (m.includes('efectivo') && m.includes('usd')) {
      return <span key={mp.metodo} className="badge badge--success">💵 USD: {formatUSD(mp.monto_usd)}</span>;
    }
    if (m.includes('efectivo') && m.includes('bs')) {
      return <span key={mp.metodo} className="badge badge--warning">💵 Bs: {formatBs(mp.monto_bs)}</span>;
    }
    if (m.includes('punto')) {
      return <span key={mp.metodo} className="badge badge--primary">💳 Punto: {formatBs(mp.monto_bs)}</span>;
    }
    if (m.includes('pago')) {
      return <span key={mp.metodo} className="badge badge--primary">📲 Pago Móvil: {formatBs(mp.monto_bs)}</span>;
    }
    if (m.includes('zelle')) {
      return <span key={mp.metodo} className="badge badge--info">🌐 Zelle: {formatUSD(mp.monto_usd)}</span>;
    }
    if (m.includes('credito') || m.includes('fiado')) {
      return (
        <span
          key={mp.metodo}
          className="badge"
          style={{ background: '#DC2626', color: '#fff', fontWeight: 'bold' }}
          title="Venta a Crédito / Fiado (Reflejada en CxC)"
        >
          📝 Crédito/Fiado: {formatUSD(mp.monto_usd)}
        </span>
      );
    }
    return <span key={mp.metodo} className="badge badge--secondary">{mp.metodo}: {formatUSD(mp.monto_usd)}</span>;
  }

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <h3 className="card__title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineDocumentText style={{ color: 'var(--primary)', fontSize: '1.25rem' }} />
            Ventas Realizadas (Artículos, Método de Pago y Hora Exacta)
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Haz clic en cualquier fila para ver el desglose completo de productos vendidos y precios unitarios.
          </p>
        </div>

        {/* Filtro rápido */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filtrar pago:</span>
          <select
            value={filtroMetodo}
            onChange={e => { setFiltroMetodo(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              minHeight: '44px',
            }}
          >
            <option value="todos">Todos los métodos</option>
            <option value="efectivo">Efectivo (USD / Bs)</option>
            <option value="punto">Punto de Venta</option>
            <option value="pago">Pago Móvil</option>
            <option value="zelle">Zelle</option>
            <option value="credito">Crédito / Fiados</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Factura</th>
              <th>Fecha y Hora</th>
              <th>Cliente</th>
              <th>Método de Pago</th>
              <th style={{ textAlign: 'right' }}>Total USD</th>
              <th style={{ textAlign: 'right' }}>Total Bs</th>
            </tr>
          </thead>
          <tbody>
            {pagedVentas.map(f => {
              const isOpen = expandedRow === f.id;
              const tieneCredito = (f.metodos_pago || []).some(m => {
                const id = (m.metodo_id || m.id || m.metodo || '').toLowerCase();
                return id.includes('credito') || id.includes('fiado');
              });

              return (
                <tr
                  key={f.id}
                  style={{
                    cursor: 'pointer',
                    background: isOpen ? 'var(--bg-elevated)' : tieneCredito ? 'rgba(239, 68, 68, 0.04)' : undefined,
                  }}
                  onClick={() => toggleRow(f.id)}
                >
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isOpen ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ color: 'var(--primary)' }}>{f.numero_factura}</strong>
                      {tieneCredito && (
                        <span className="badge" style={{ background: '#DC2626', color: '#fff', fontSize: '0.65rem', padding: '2px 5px' }}>
                          Fiado
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                      <HiOutlineClock style={{ color: 'var(--text-muted)' }} />
                      <span>{formatFecha(f.fecha_emision, true)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {f.clientes?.nombre || 'Consumidor Final'}
                    </div>
                    {f.clientes?.documento_identidad && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {f.clientes.documento_identidad}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {(f.metodos_pago || []).map((mp, i) => (
                        <span key={i}>{getBadgeMetodo(mp)}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '0.92rem' }}>{formatUSD(f.total_usd)}</strong>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {formatBs(f.total_bs)}
                  </td>
                </tr>
              );
            })}

            {/* Fila expandida con los artículos detallados */}
            {pagedVentas.map(f => {
              if (expandedRow !== f.id) return null;
              const detalles = f.detalles_factura || [];
              return (
                <tr key={`${f.id}-details`} style={{ background: 'var(--bg-elevated)' }}>
                  <td colSpan="7" style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        <HiOutlineShoppingBag /> Artículos vendidos en esta factura:
                      </div>
                      {detalles.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
                          {detalles.map((d, dIdx) => (
                            <div
                              key={dIdx}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'var(--bg-elevated)',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                fontSize: '0.8rem',
                              }}
                            >
                              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                {d.producto_nombre}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                <span>{d.cantidad} un. x {formatUSD(d.precio_unitario_usd)}</span>
                                <strong style={{ color: 'var(--primary)' }}>{formatUSD(d.subtotal_usd || (d.cantidad * d.precio_unitario_usd))}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          No se encontraron detalles de artículos para esta factura.
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {ventasFiltradas.length === 0 && (
              <tr>
                <td colSpan="7" className="table__empty">
                  No se encontraron ventas para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {ventasFiltradas.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalItems={ventasFiltradas.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

