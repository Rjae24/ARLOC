import {
  HiOutlineReceiptPercent,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import { formatUSD } from '../../utils/formatters';

export default function TopBottomProductos({
  topProductos = [],
  productosPocoMovimiento = [],
  listaRanking = [],
  totalUSD = 0,
  fechaDesde,
  fechaHasta,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Products */}
      <div className="card print-avoid-break">
        <h3 className="card__title" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineReceiptPercent style={{ color: 'var(--primary)' }} />
            Top Productos Más Vendidos
          </span>
          <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span className="badge badge--primary" style={{ fontSize: '0.78rem' }}>
              Top {topProductos.length} de {listaRanking.length > 0 ? listaRanking.length : '—'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              período: {fechaDesde} al {fechaHasta}
            </span>
          </span>
        </h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Producto</th>
                <th style={{ textAlign: 'center' }}>Unidades</th>
                <th style={{ textAlign: 'right' }}>Total (USD)</th>
                <th style={{ textAlign: 'right' }}>% Aporte</th>
              </tr>
            </thead>
            <tbody>
              {topProductos.map((prod, idx) => {
                const pct = totalUSD > 0 ? ((prod.total_usd / totalUSD) * 100).toFixed(1) : 0;
                return (
                  <tr key={idx}>
                    <td style={{ color: idx < 3 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', textAlign: 'center' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td><strong>{prod.nombre}</strong></td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge--primary">{prod.cantidad} uds</span>
                    </td>
                    <td style={{ textAlign: 'right' }}><strong>{formatUSD(prod.total_usd)}</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <div style={{ width: '60px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', minWidth: '36px' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {listaRanking.length === 0 && (
                <tr>
                  <td colSpan="5" className="table__empty">
                    No hay ventas registradas en el período seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Products — Least Movement */}
      <div className="card print-avoid-break">
        <h3 className="card__title" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineExclamationTriangle style={{ color: '#F59E0B' }} />
            Productos con Menos Rotación
          </span>
          <span className="badge badge--warning" style={{ fontSize: '0.78rem' }}>
            {productosPocoMovimiento.length} productos
          </span>
        </h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th style={{ textAlign: 'center' }}>Unidades Vendidas</th>
                <th style={{ textAlign: 'right' }}>Total (USD)</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {productosPocoMovimiento.map((prod, idx) => (
                <tr key={idx}>
                  <td style={{ color: '#F59E0B', fontWeight: '700', textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <strong>{prod.nombre}</strong>
                    {prod.sku && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SKU: {prod.sku}</div>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${prod.cantidad === 0 ? 'badge--danger' : 'badge--warning'}`}>
                      {prod.cantidad} uds
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{formatUSD(prod.total_usd)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${prod.cantidad === 0 ? 'badge--danger' : 'badge--warning'}`}>
                      {prod.cantidad === 0 ? 'Sin ventas' : 'Baja rotación'}
                    </span>
                  </td>
                </tr>
              ))}
              {productosPocoMovimiento.length === 0 && (
                <tr>
                  <td colSpan="5" className="table__empty">
                    No hay datos de movimiento para este período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
