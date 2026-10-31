import Pagination from '../common/Pagination';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import { formatUSD, formatBs } from '../../utils/formatters';

export default function RendimientoVendedores({
  listaVendedores = [],
  totalUSD = 0,
  maxVendedorUSD = 1,
  pageVendedores = 1,
  setPageVendedores,
}) {
  const vendedoresPage = listaVendedores.slice((pageVendedores - 1) * 20, pageVendedores * 20);

  return (
    <div className="card">
      <h3 className="card__title">
        <HiOutlineUserGroup style={{ marginRight: '0.5rem', color: 'var(--primary)' }} />
        Rendimiento por Vendedor
      </h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Vendedor</th>
              <th style={{ textAlign: 'center' }}>Facturas</th>
              <th style={{ textAlign: 'right' }}>Total USD</th>
              <th style={{ textAlign: 'right' }}>Total Bs</th>
              <th style={{ textAlign: 'right' }}>Ticket Promedio</th>
              <th>Participación</th>
            </tr>
          </thead>
          <tbody>
            {vendedoresPage.map((v, idx) => {
              const pct = totalUSD > 0 ? ((v.total_usd / totalUSD) * 100).toFixed(1) : 0;
              const barWidth = maxVendedorUSD > 0 ? ((v.total_usd / maxVendedorUSD) * 100).toFixed(1) : 0;
              const ticket = v.facturas > 0 ? v.total_usd / v.facturas : 0;
              const rank = (pageVendedores - 1) * 20 + idx + 1;
              return (
                <tr key={v.nombre}>
                  <td style={{ color: rank <= 3 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', textAlign: 'center' }}>
                    {rank}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--primary-bg)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.82rem',
                          flexShrink: 0,
                        }}
                      >
                        {v.nombre.charAt(0).toUpperCase()}
                      </div>
                      <strong>{v.nombre}</strong>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge--primary">{v.facturas}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong>{formatUSD(v.total_usd)}</strong>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {formatBs(v.total_bs)}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {formatUSD(ticket)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', minWidth: '80px' }}>
                        <div
                          style={{
                            width: `${barWidth}%`,
                            height: '100%',
                            background: 'var(--primary)',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: '38px' }}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {listaVendedores.length === 0 && (
              <tr>
                <td colSpan="7" className="table__empty">
                  No hay datos de vendedores en este período
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={pageVendedores}
        totalItems={listaVendedores.length}
        pageSize={20}
        onPageChange={setPageVendedores}
      />
    </div>
  );
}

