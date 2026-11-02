import { HiOutlineTrash } from 'react-icons/hi2';
import { formatUSD, formatBs } from '../../utils/formatters';

export default function POSCartSection({
  carrito,
  tasaHoy,
  clienteSeleccionado,
  onActualizarCantidad,
  onQuitarDelCarrito,
  onLimpiarCaja,
}) {
  const tieneContenido = carrito.length > 0 || !!clienteSeleccionado;
  const tasa = tasaHoy?.tasa_usd_bs || 0;

  return (
    <div className="card pos-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem' }}>
        <h3 className="card__title" style={{ margin: 0 }}>
          Carrito ({carrito.length})
        </h3>
        {tieneContenido && (
          <button
            type="button"
            className="btn btn--ghost btn--xs"
            onClick={onLimpiarCaja}
            title="Limpiar cuenta y vaciar carrito"
            style={{
              color: 'var(--danger, #EF4444)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 500,
            }}
          >
            <HiOutlineTrash /> Limpiar Caja
          </button>
        )}
      </div>

      {carrito.length === 0 ? (
        <p className="card__empty">Agregue productos para comenzar</p>
      ) : (
        <div className="pos-cart">
          {carrito.map((item) => {
            const unitUSD = parseFloat(item.precio_unitario || 0);
            const subUSD = parseFloat(item.subtotal || 0);
            const subBs = tasa > 0 ? subUSD * tasa : 0;

            return (
              <div key={item.producto_id} className="pos-cart-item">
                <div className="pos-cart-item__main">
                  <div className="pos-cart-item__info">
                    <span className="pos-cart-item__name">{item.producto_nombre}</span>
                    <span className="pos-cart-item__price">
                      {formatUSD(unitUSD)}
                      {tasa > 0 && ` (${formatBs(unitUSD * tasa)})`} c/u
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--xs text-danger pos-cart-item__trash"
                    onClick={() => onQuitarDelCarrito(item.producto_id)}
                    title="Eliminar producto"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>

                <div className="pos-cart-item__actions">
                  <div className="pos-cart-item__controls">
                    <button
                      type="button"
                      className="btn btn--ghost btn--xs pos-qty-btn"
                      onClick={() => {
                        const step = item.unidad === 'kg' ? 0.1 : 1;
                        const dec = item.unidad === 'kg' ? 3 : 0;
                        const nueva = Math.max(step, parseFloat((item.cantidad - step).toFixed(dec)));
                        onActualizarCantidad(item.producto_id, nueva);
                      }}
                      title="Disminuir cantidad"
                    >
                      −
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <input
                        type="number"
                        className="pos-cart-item__qty"
                        value={item.cantidad}
                        step={item.unidad === 'kg' ? '0.005' : '1'}
                        min={item.unidad === 'kg' ? 0.001 : 1}
                        max={item.stock_disponible}
                        onChange={(e) => {
                          const val = item.unidad === 'kg' ? parseFloat(e.target.value) : parseInt(e.target.value);
                          onActualizarCantidad(item.producto_id, isNaN(val) ? 0 : val);
                        }}
                        style={{ width: item.unidad === 'kg' ? '65px' : '48px', textAlign: 'center' }}
                      />
                      {item.unidad === 'kg' && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>kg</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost btn--xs pos-qty-btn"
                      onClick={() => {
                        const step = item.unidad === 'kg' ? 0.1 : 1;
                        const dec = item.unidad === 'kg' ? 3 : 0;
                        const nueva = parseFloat((item.cantidad + step).toFixed(dec));
                        onActualizarCantidad(item.producto_id, nueva);
                      }}
                      title="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="pos-cart-item__subtotal" style={{ fontWeight: 'bold' }}>
                      {formatUSD(subUSD)}
                    </div>
                    {tasa > 0 && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {formatBs(subBs)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
