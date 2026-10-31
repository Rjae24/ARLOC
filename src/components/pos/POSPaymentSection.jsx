import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';
import { METODOS_PAGO } from '../../utils/constants';
import { formatUSD, formatBs } from '../../utils/formatters';

export default function POSPaymentSection({
  totalUSD,
  totalBs,
  tasaHoy,
  carrito,
  clienteSeleccionado,
  metodosPago,
  loading,
  tieneCredito,
  montoCredito,
  totalPagadoEnTienda,
  restante,
  onAgregarMetodoPago,
  onActualizarMetodoPago,
  onQuitarMetodoPago,
  onEmitirFactura,
  onLimpiarCaja,
}) {
  const tieneContenido = carrito.length > 0 || !!clienteSeleccionado;

  return (
    <div className="pos-summary">
      <div className="card">
        <h3 className="card__title">Total y Cobro</h3>

        {/* Totales Bivaluta en USD y Bs */}
        <div className="pos-totals">
          <div className="pos-totals__row pos-totals__row--total">
            <span>Total USD</span>
            <span>{formatUSD(totalUSD)}</span>
          </div>
          {tasaHoy && (
            <div className="pos-totals__row pos-totals__row--bs">
              <span>Total Bs</span>
              <span>{formatBs(totalBs)}</span>
            </div>
          )}
        </div>

        {/* Métodos de Pago Integrados Directamente */}
        <div className="pos-payment" style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Método de Pago</h4>
            {metodosPago.length === 0 && (
              <button
                type="button"
                className="btn btn--ghost btn--xs"
                onClick={() => onAgregarMetodoPago('efectivo_usd')}
                style={{ color: 'var(--primary)', fontWeight: 'bold' }}
              >
                + Elegir método
              </button>
            )}
          </div>

          {metodosPago.map((mp, index) => {
            const metodoConfig = METODOS_PAGO.find((m) => m.id === mp.metodo);
            const esPunto = mp.metodo === 'punto_venta';
            const esPagoMovil = mp.metodo === 'pago_movil';
            const requiereRefObligatoria = metodoConfig?.requiereReferencia;

            return (
              <div key={index} className="pos-payment-method" style={{ marginBottom: '0.75rem' }}>
                <div className="pos-payment-method__header">
                  <select
                    value={mp.metodo}
                    onChange={(e) => onActualizarMetodoPago(index, 'metodo', e.target.value)}
                    style={{ minHeight: '44px' }}
                  >
                    <option value="">Seleccionar método...</option>
                    {METODOS_PAGO.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  {metodosPago.length > 1 && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--xs text-danger"
                      onClick={() => onQuitarMetodoPago(index)}
                      title="Eliminar método"
                      style={{ minHeight: '44px', minWidth: '44px' }}
                    >
                      <HiOutlineTrash />
                    </button>
                  )}
                </div>

                {mp.metodo && (
                  <>
                    <div className="pos-payment-method__amounts" style={{ marginTop: '0.4rem' }}>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Monto USD</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={mp.monto_usd}
                          onChange={(e) => onActualizarMetodoPago(index, 'monto_usd', e.target.value)}
                          placeholder="0.00"
                          style={{ minHeight: '44px' }}
                        />
                      </div>
                      {metodoConfig?.enBs && tasaHoy && (
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>Monto Bs</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={mp.monto_bs}
                            onChange={(e) => onActualizarMetodoPago(index, 'monto_bs', e.target.value)}
                            placeholder="0.00"
                            style={{ minHeight: '44px' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Crédito / Fiado */}
                    {metodoConfig?.isCredito && (
                      <div style={{
                        marginTop: '0.4rem',
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: '6px',
                        padding: '0.5rem 0.65rem',
                        fontSize: '0.78rem',
                        color: 'rgba(99,102,241,0.9)',
                      }}>
                        {clienteSeleccionado ? (
                          clienteSeleccionado.credito_activo ? (
                            <span>Quedará registrado como cuenta por cobrar de <strong>{clienteSeleccionado.nombre}</strong>.</span>
                          ) : (
                            <span style={{ color: 'var(--danger,#EF4444)', fontWeight: 600 }}>
                              ⚠️ Este cliente no tiene crédito activo en el sistema.
                            </span>
                          )
                        ) : (
                          <span style={{ color: 'var(--danger,#EF4444)', fontWeight: 600 }}>
                            ⚠️ Selecciona un cliente arriba para poder fiar.
                          </span>
                        )}
                      </div>
                    )}

                    {/* Zelle */}
                    {metodoConfig?.isZelle && (
                      <div className="pos-payment-method__zelle" style={{ marginTop: '0.4rem' }}>
                        <div className="form-group" style={{ marginBottom: '0.35rem' }}>
                          <input
                            type="text"
                            placeholder="Nombre / Titular del Emisor Zelle"
                            value={mp.zelle_titular || ''}
                            onChange={(e) => onActualizarMetodoPago(index, 'zelle_titular', e.target.value)}
                            required
                            style={{ minHeight: '44px' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <input
                            type="email"
                            placeholder="Correo del Emisor Zelle"
                            value={mp.zelle_email || ''}
                            onChange={(e) => onActualizarMetodoPago(index, 'zelle_email', e.target.value)}
                            required
                            style={{ minHeight: '44px' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Campo de Referencia: OBLIGATORIO en Pago Móvil/Transferencia, OPCIONAL en Punto de Venta */}
                    {(requiereRefObligatoria || esPunto) && (
                      <div className="form-group" style={{ marginTop: '0.4rem', marginBottom: 0 }}>
                        <input
                          type="text"
                          placeholder={
                            esPagoMovil
                              ? 'N° de Referencia Pago Móvil (Obligatorio - ej. 4 dígitos)'
                              : esPunto
                              ? 'N° de Lote / Recibo del Punto (Opcional)'
                              : 'N° de Referencia / Comprobante'
                          }
                          value={mp.referencia || ''}
                          onChange={(e) => onActualizarMetodoPago(index, 'referencia', e.target.value)}
                          required={esPagoMovil}
                          style={{ minHeight: '44px' }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => onAgregarMetodoPago()}
            style={{ width: '100%', marginBottom: '0.75rem', minHeight: '44px' }}
          >
            <HiOutlinePlus /> Pago Mixto (Añadir otro método)
          </button>

          {/* Resumen de cobro */}
          <div className="pos-payment-summary" style={{ marginBottom: '0.75rem' }}>
            <div className="pos-totals__row">
              <span>Monto Asignado</span>
              <span className="text-success">{formatUSD(totalPagadoEnTienda)}</span>
            </div>
            {tieneCredito && montoCredito > 0 && (
              <div className="pos-totals__row" style={{ color: 'rgba(99,102,241,0.9)', fontWeight: 'bold' }}>
                <span>Fiado / A Crédito</span>
                <span>{formatUSD(montoCredito)}</span>
              </div>
            )}
            {restante > 0.01 && (
              <div className="pos-totals__row">
                <span>Por Asignar / Restante</span>
                <span className="text-danger">{formatUSD(restante)}</span>
              </div>
            )}
          </div>

          {/* Acciones de Facturación */}
          <div className="pos-payment-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn--primary btn--full"
              onClick={onEmitirFactura}
              disabled={loading || carrito.length === 0 || restante > 0.01}
              style={{ minHeight: '48px', fontSize: '1rem', fontWeight: 'bold' }}
            >
              {loading ? 'Procesando...' : `Facturar y Cobrar ${formatUSD(totalUSD)}`}
            </button>

            {tieneContenido && (
              <button
                type="button"
                className="btn btn--ghost btn--full"
                onClick={onLimpiarCaja}
                style={{
                  color: 'var(--danger, #EF4444)',
                  border: '1px dashed rgba(239, 68, 68, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  minHeight: '44px',
                }}
                title="Cancelar venta en curso y limpiar cuenta"
              >
                <HiOutlineTrash /> Cancelar Venta y Limpiar Caja
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
