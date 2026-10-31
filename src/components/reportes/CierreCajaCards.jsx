import {
  HiOutlineBanknotes,
  HiOutlineCreditCard,
  HiOutlineDevicePhoneMobile,
  HiOutlineClipboardDocumentCheck,
} from 'react-icons/hi2';
import { formatUSD, formatBs } from '../../utils/formatters';

export default function CierreCajaCards({ cierreCaja }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
      {/* 1. GAVETA: EFECTIVO FÍSICO */}
      <div className="card" style={{ borderTop: '4px solid #22C55E', background: 'rgba(34,197,94,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            <HiOutlineBanknotes />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#22C55E' }}>
              1. Efectivo Físico (Gaveta)
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dinero en caja para conteo</span>
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '0.6rem', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Dólares en Billetes (USD)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#22C55E', marginTop: '2px' }}>
            {formatUSD(cierreCaja.totalEfectivoUSD)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {cierreCaja.efectivoUSD.transacciones} operaciones
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bolívares en Billetes (Bs)</div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#F59E0B', marginTop: '2px' }}>
            {formatBs(cierreCaja.totalEfectivoBs)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {cierreCaja.efectivoBs.transacciones} operaciones
          </div>
        </div>
      </div>

      {/* 2. BANCO NACIONAL: BOLÍVARES */}
      <div className="card" style={{ borderTop: '4px solid #8B5CF6', background: 'rgba(139,92,246,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            <HiOutlineCreditCard />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#8B5CF6' }}>
              2. Bancos en Bolívares
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Punto de Venta y Pago Móvil</span>
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '0.6rem', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Bancos Nacionales (Bs)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#A78BFA', marginTop: '2px' }}>
            {formatBs(cierreCaja.totalBancoBs)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Contravalor: {formatUSD(cierreCaja.totalBancoUSD_equiv)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.5rem', background: 'var(--bg-elevated)', borderRadius: '6px' }}>
            <span>💳 <strong>Punto de Venta:</strong></span>
            <span style={{ fontWeight: 'bold' }}>{formatBs(cierreCaja.puntoVenta.total_bs)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.5rem', background: 'var(--bg-elevated)', borderRadius: '6px' }}>
            <span>📲 <strong>Pago Móvil:</strong></span>
            <span style={{ fontWeight: 'bold' }}>{formatBs(cierreCaja.pagoMovil.total_bs)}</span>
          </div>
          {cierreCaja.transferencia.total_bs > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.5rem', background: 'var(--bg-elevated)', borderRadius: '6px' }}>
              <span>🏛️ <strong>Transferencia:</strong></span>
              <span style={{ fontWeight: 'bold' }}>{formatBs(cierreCaja.transferencia.total_bs)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. BANCO DIGITAL: ZELLE */}
      <div className="card" style={{ borderTop: '4px solid #3B82F6', background: 'rgba(59,130,246,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            <HiOutlineDevicePhoneMobile />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3B82F6' }}>
              3. Zelle / Digital (USD)
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pagos digitales en divisas</span>
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '0.6rem', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Recibido en Zelle</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#60A5FA', marginTop: '2px' }}>
            {formatUSD(cierreCaja.totalZelleUSD)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {cierreCaja.zelle.transacciones} operaciones
          </div>
        </div>
      </div>

      {/* 4. CRÉDITOS Y FIADOS (BODEGUITA) */}
      <div className="card" style={{ borderTop: '4px solid #EF4444', background: 'rgba(239,68,68,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            <HiOutlineClipboardDocumentCheck />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#EF4444' }}>
              4. Crédito / Fiados
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cuentas por cobrar a clientes</span>
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '0.6rem', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: '#EF4444', textTransform: 'uppercase', fontWeight: 'bold' }}>Saldo Fiado en el Período</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#F87171', marginTop: '2px' }}>
            {formatUSD(cierreCaja.totalCreditoUSD)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Ref. {formatBs(cierreCaja.totalCreditoBs)} | {cierreCaja.credito.transacciones} créditos otorgados
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.4rem', borderTop: '1px dotted var(--border)' }}>
          * Este monto forma parte de la venta pero queda en pendiente de cobro en <strong>Cuentas por Cobrar</strong>.
        </div>
      </div>
    </div>
  );
}

