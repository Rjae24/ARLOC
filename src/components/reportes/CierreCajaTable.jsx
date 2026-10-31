import { HiOutlineShieldCheck } from 'react-icons/hi2';
import { formatUSD, formatBs } from '../../utils/formatters';

export default function CierreCajaTable({ cierreCaja, facturasEmitidas, totalUSD, totalBs }) {
  return (
    <div className="card">
      <h3 className="card__title" style={{ marginBottom: '1rem' }}>
        <HiOutlineShieldCheck style={{ marginRight: '0.5rem', color: 'var(--success)' }} />
        Cuadro de Conciliación de Fondos del Cierre
      </h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Canal / Destino de los Fondos</th>
              <th style={{ textAlign: 'center' }}>Operaciones</th>
              <th style={{ textAlign: 'right' }}>Monto en Moneda de Origen</th>
              <th style={{ textAlign: 'right' }}>Contravalor Referencial</th>
              <th style={{ textAlign: 'right' }}>Estado / Ubicación</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>💵 Efectivo Dólares (USD)</strong></td>
              <td style={{ textAlign: 'center' }}>{cierreCaja.efectivoUSD.transacciones}</td>
              <td style={{ textAlign: 'right' }}>
                <strong style={{ color: '#22C55E' }}>{formatUSD(cierreCaja.totalEfectivoUSD)}</strong>
              </td>
              <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                {formatBs(cierreCaja.efectivoUSD.total_bs)}
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="badge badge--success">Físico en Gaveta</span>
              </td>
            </tr>

            <tr>
              <td><strong>💵 Efectivo Bolívares (Bs)</strong></td>
              <td style={{ textAlign: 'center' }}>{cierreCaja.efectivoBs.transacciones}</td>
              <td style={{ textAlign: 'right' }}>
                <strong style={{ color: '#F59E0B' }}>{formatBs(cierreCaja.totalEfectivoBs)}</strong>
              </td>
              <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                {formatUSD(cierreCaja.efectivoBs.total_usd)}
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="badge badge--success">Físico en Gaveta</span>
              </td>
            </tr>

            <tr>
              <td><strong>💳 Punto de Venta (Tarjetas de Débito)</strong></td>
              <td style={{ textAlign: 'center' }}>{cierreCaja.puntoVenta.transacciones}</td>
              <td style={{ textAlign: 'right' }}>
                <strong style={{ color: '#A78BFA' }}>{formatBs(cierreCaja.puntoVenta.total_bs)}</strong>
              </td>
              <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                {formatUSD(cierreCaja.puntoVenta.total_usd)}
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="badge badge--primary">Banco en Bolívares</span>
              </td>
            </tr>

            <tr>
              <td><strong>📲 Pago Móvil Interbancario</strong></td>
              <td style={{ textAlign: 'center' }}>{cierreCaja.pagoMovil.transacciones}</td>
              <td style={{ textAlign: 'right' }}>
                <strong style={{ color: '#A78BFA' }}>{formatBs(cierreCaja.pagoMovil.total_bs)}</strong>
              </td>
              <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                {formatUSD(cierreCaja.pagoMovil.total_usd)}
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="badge badge--primary">Banco en Bolívares</span>
              </td>
            </tr>

            {cierreCaja.transferencia.total_bs > 0 && (
              <tr>
                <td><strong>🏛️ Transferencias Bancarias</strong></td>
                <td style={{ textAlign: 'center' }}>{cierreCaja.transferencia.transacciones}</td>
                <td style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#A78BFA' }}>{formatBs(cierreCaja.transferencia.total_bs)}</strong>
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {formatUSD(cierreCaja.transferencia.total_usd)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="badge badge--primary">Banco en Bolívares</span>
                </td>
              </tr>
            )}

            {cierreCaja.totalZelleUSD > 0 && (
              <tr>
                <td><strong>🌐 Zelle</strong></td>
                <td style={{ textAlign: 'center' }}>{cierreCaja.zelle.transacciones}</td>
                <td style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#60A5FA' }}>{formatUSD(cierreCaja.totalZelleUSD)}</strong>
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {formatBs(cierreCaja.zelle.total_bs)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="badge badge--info">Banco Internacional</span>
                </td>
              </tr>
            )}

            {cierreCaja.totalCreditoUSD > 0 && (
              <tr style={{ background: 'rgba(239,68,68,0.05)' }}>
                <td><strong>📝 Crédito / Fiado Otorgado</strong></td>
                <td style={{ textAlign: 'center' }}>{cierreCaja.credito.transacciones}</td>
                <td style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#EF4444' }}>{formatUSD(cierreCaja.totalCreditoUSD)}</strong>
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {formatBs(cierreCaja.totalCreditoBs)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="badge badge--danger">Cuentas por Cobrar</span>
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <td><strong>TOTAL COBRADO EN CAJA Y BANCOS (LÍQUIDO)</strong></td>
              <td style={{ textAlign: 'center' }}><strong>{facturasEmitidas.length} facturas</strong></td>
              <td style={{ textAlign: 'right' }}>
                <strong style={{ color: 'var(--success)', fontSize: '1.05rem' }}>
                  {formatUSD(cierreCaja.totalRecaudadoUSD)}
                </strong>
              </td>
              <td style={{ textAlign: 'right' }}>
                <strong>{formatBs(cierreCaja.totalRecaudadoBs)}</strong>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="badge badge--success">En Posesión</span>
              </td>
            </tr>
            <tr style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
              <td><strong style={{ color: 'var(--primary)' }}>TOTAL FACTURACIÓN (INCLUYENDO FIADOS/CRÉDITO)</strong></td>
              <td style={{ textAlign: 'center' }}><strong>{facturasEmitidas.length} facturas</strong></td>
              <td style={{ textAlign: 'right' }}>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{formatUSD(totalUSD)}</strong>
              </td>
              <td style={{ textAlign: 'right' }}>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{formatBs(totalBs)}</strong>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="badge badge--primary">Total Período</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

