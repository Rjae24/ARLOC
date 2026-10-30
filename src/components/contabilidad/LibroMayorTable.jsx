import { useState, useMemo } from 'react';
import { HiOutlineBookOpen, HiOutlineArrowPath, HiOutlineClock } from 'react-icons/hi2';
import Pagination from '../common/Pagination';

const MOVIMIENTOS_PER_PAGE = 25;

export default function LibroMayorTable({
  cuentaActiva,
  movimientosFiltrados,
  saldoAnteriorUSD = 0,
  saldoAnteriorBs = 0,
  tieneSaldoAnterior = false,
  fechaDesde = '',
  loadingMovs,
  totalDebe,
  totalHaber,
  totalDebeVes,
  totalHaberVes,
  saldoFinal,
  saldoFinalVes,
  formatMoney,
  formatBolivares,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Paginación en cliente para navegación fluida
  const totalPages = Math.ceil(movimientosFiltrados.length / MOVIMIENTOS_PER_PAGE) || 1;
  const pageSafe = Math.min(currentPage, totalPages);

  const paginatedMovimientos = useMemo(() => {
    const from = (pageSafe - 1) * MOVIMIENTOS_PER_PAGE;
    return movimientosFiltrados.slice(from, from + MOVIMIENTOS_PER_PAGE);
  }, [movimientosFiltrados, pageSafe]);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {cuentaActiva ? (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span
              style={{
                fontFamily: 'monospace',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '1.1rem',
                padding: '0.2rem 0.5rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '6px',
              }}
            >
              {cuentaActiva.codigo}
            </span>
            <strong style={{ fontSize: '1.15rem' }}>{cuentaActiva.nombre}</strong>
            <span className="badge badge--primary">{cuentaActiva.tipo}</span>
            <span className="badge badge--info">Naturaleza: {cuentaActiva.naturaleza}</span>
          </div>
        ) : (
          <span>Seleccione una cuenta contable</span>
        )}

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Total Movimientos: <strong>{movimientosFiltrados.length}</strong>
        </div>
      </div>

      {loadingMovs ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <HiOutlineArrowPath className="spin" style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
          <p>Consultando movimientos de la cuenta en Supabase...</p>
        </div>
      ) : movimientosFiltrados.length === 0 && !tieneSaldoAnterior ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <HiOutlineBookOpen style={{ fontSize: '2.5rem', opacity: 0.4, marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 600 }}>No hay movimientos registrados para esta cuenta</p>
          <p style={{ fontSize: '0.85rem' }}>
            Los asientos registrados en el Libro Diario aparecerán automáticamente aquí.
          </p>
        </div>
      ) : (
        <>
          <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0, minWidth: '1250px' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Fecha</th>
                  <th style={{ width: '150px' }}>Asiento</th>
                  <th style={{ width: '100px' }}>Módulo</th>
                  <th>Concepto / Glosa</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Debe (USD)</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Haber (USD)</th>
                  <th style={{ width: '145px', textAlign: 'right' }}>Debe (Bs.)</th>
                  <th style={{ width: '145px', textAlign: 'right' }}>Haber (Bs.)</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Saldo (USD)</th>
                  <th style={{ width: '160px', textAlign: 'right' }}>Saldo (Bs.)</th>
                </tr>
              </thead>
              <tbody>
                {/* FILA DE SALDO ANTERIOR DEL PERÍODO (Si aplica filtro de fechaDesde) */}
                {tieneSaldoAnterior && pageSafe === 1 && (
                  <tr
                    style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      borderBottom: '2px solid var(--border)',
                      fontWeight: 600,
                    }}
                  >
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--primary)' }}>
                      <HiOutlineClock style={{ display: 'inline', marginRight: '0.25rem' }} />
                      {fechaDesde}
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>INICIAL</td>
                    <td>
                      <span className="badge badge--info" style={{ fontSize: '0.75rem' }}>
                        Apertura
                      </span>
                    </td>
                    <td style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>
                      Saldo acumulado anterior al inicio del período
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: saldoAnteriorUSD >= 0 ? 'var(--primary)' : '#EF4444',
                      }}
                    >
                      {formatMoney(saldoAnteriorUSD)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: saldoAnteriorBs >= 0 ? 'var(--primary)' : '#EF4444',
                      }}
                    >
                      {formatBolivares(saldoAnteriorBs)}
                    </td>
                  </tr>
                )}

                {paginatedMovimientos.map((m) => {
                  const debe = Number(m.debe || 0);
                  const haber = Number(m.haber || 0);
                  const debeVes = Number(m.debe_ves || 0);
                  const haberVes = Number(m.haber_ves || 0);
                  const asiento = m.asientos_contables;

                  return (
                    <tr key={m.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{asiento?.fecha || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                        {asiento?.numero || '—'}
                      </td>
                      <td>
                        <span className="badge badge--secondary" style={{ fontSize: '0.75rem' }}>
                          {asiento?.modulo || 'Manual'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px' }}>{asiento?.glosa || '—'}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: debe > 0 ? 600 : 400,
                          color: debe > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}
                      >
                        {debe > 0 ? formatMoney(debe) : '—'}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: haber > 0 ? 600 : 400,
                          color: haber > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}
                      >
                        {haber > 0 ? formatMoney(haber) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: debeVes > 0 ? 600 : 400, color: debeVes > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {debeVes > 0 ? formatBolivares(debeVes) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: haberVes > 0 ? 600 : 400, color: haberVes > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {haberVes > 0 ? formatBolivares(haberVes) : '—'}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: m.saldoAcumulado >= 0 ? 'var(--primary)' : '#EF4444',
                        }}
                      >
                        {formatMoney(m.saldoAcumulado)}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: m.saldoAcumuladoVes >= 0 ? 'var(--primary)' : '#EF4444',
                        }}
                      >
                        {formatBolivares(m.saldoAcumuladoVes)}
                      </td>
                    </tr>
                  );
                })}

                {/* Fila Totales */}
                <tr
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    fontWeight: 700,
                    borderTop: '2px solid var(--border)',
                  }}
                >
                  <td colSpan="4" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    Total Movimientos ({movimientosFiltrados.length}):
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatMoney(totalDebe)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--info)' }}>{formatMoney(totalHaber)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatBolivares(totalDebeVes)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--info)' }}>{formatBolivares(totalHaberVes)}</td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: saldoFinal >= 0 ? '#22C55E' : '#EF4444',
                      fontSize: '1.05rem',
                    }}
                  >
                    {formatMoney(saldoFinal)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: saldoFinalVes >= 0 ? '#22C55E' : '#EF4444',
                      fontSize: '1.05rem',
                    }}
                  >
                    {formatBolivares(saldoFinalVes)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Paginador */}
          {totalPages > 1 && (
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)' }}>
              <Pagination
                currentPage={pageSafe}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={movimientosFiltrados.length}
                itemsPerPage={MOVIMIENTOS_PER_PAGE}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
