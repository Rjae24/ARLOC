import { HiOutlineChartBar } from 'react-icons/hi2';
import { formatUSD, formatBs } from '../../utils/formatters';

const METODO_COLORS = {
  'Efectivo USD': '#22C55E',
  'Efectivo Bs': '#F59E0B',
  'Punto de Venta': '#8B5CF6',
  'Pago Móvil': '#EAB308',
  'Zelle': '#3B82F6',
  'Transferencia': '#06B6D4',
  'Crédito': '#EF4444',
  'Crédito / Fiado': '#EF4444',
  'Fiado': '#EF4444',
};

function getMetodoColor(m) {
  return METODO_COLORS[m] || '#A3A3A3';
}

export default function DistribucionMetodosPago({ metodosOrdenados = [], totalUSD = 0, totalBs = 0, maxMetodoUSD = 1 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Visual chart */}
      <div className="card">
        <h3 className="card__title">
          <HiOutlineChartBar style={{ marginRight: '0.5rem', color: 'var(--primary)' }} />
          Distribución de Cobros por Método
        </h3>
        {metodosOrdenados.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.5rem 0' }}>
            {metodosOrdenados.map(m => {
              const pct = totalUSD > 0 ? (m.total_usd / totalUSD) * 100 : 0;
              const barPct = maxMetodoUSD > 0 ? (m.total_usd / maxMetodoUSD) * 100 : 0;
              const color = getMetodoColor(m.metodo);
              return (
                <div key={m.metodo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{m.metodo}</span>
                      <span className="badge badge--primary" style={{ fontSize: '0.72rem' }}>
                        {m.transacciones} ops
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{formatUSD(m.total_usd)}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        ({pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div style={{ height: '10px', background: 'var(--bg-elevated)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${barPct}%`,
                        height: '100%',
                        background: color,
                        borderRadius: '5px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  {m.total_bs > 0 && (
                    <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Equiv. Bs: {formatBs(m.total_bs)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            Sin cobros en este rango de fechas
          </p>
        )}
      </div>

      {/* Detail table */}
      <div className="card">
        <h3 className="card__title">Detalle por Método de Pago</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Método</th>
                <th style={{ textAlign: 'center' }}>Operaciones</th>
                <th style={{ textAlign: 'right' }}>Total Facturado (USD)</th>
                <th style={{ textAlign: 'right' }}>Total Facturado (Bs)</th>
                <th style={{ textAlign: 'right' }}>Participación</th>
              </tr>
            </thead>
            <tbody>
              {metodosOrdenados.map((m, i) => {
                const pct = totalUSD > 0 ? ((m.total_usd / totalUSD) * 100).toFixed(1) : 0;
                const color = getMetodoColor(m.metodo);
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                        <strong>{m.metodo}</strong>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{m.transacciones}</td>
                    <td style={{ textAlign: 'right' }}>
                      <strong>{formatUSD(m.total_usd)}</strong>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {m.total_bs > 0 ? formatBs(m.total_bs) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{pct}%</td>
                  </tr>
                );
              })}
              {metodosOrdenados.length === 0 && (
                <tr>
                  <td colSpan="5" className="table__empty">
                    Sin cobros en este rango
                  </td>
                </tr>
              )}
            </tbody>
            {metodosOrdenados.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td><strong>TOTAL</strong></td>
                  <td style={{ textAlign: 'center' }}>
                    <strong>{metodosOrdenados.reduce((s, m) => s + m.transacciones, 0)}</strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong style={{ color: 'var(--success)' }}>{formatUSD(totalUSD)}</strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>{formatBs(totalBs)}</strong>
                  </td>
                  <td style={{ textAlign: 'right' }}><strong>100%</strong></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
