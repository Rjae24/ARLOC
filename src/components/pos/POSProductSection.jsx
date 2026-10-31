import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { formatUSD, formatBs } from '../../utils/formatters';

export default function POSProductSection({
  productoSearchRef,
  productoSearch,
  productoResults,
  tasaHoy,
  onSearchChange,
  onSelectProducto,
}) {
  const tasa = tasaHoy?.tasa_usd_bs || 0;

  return (
    <div className="card pos-section">
      <h3 className="card__title">Agregar Productos</h3>
      <div className="search-box">
        <HiOutlineMagnifyingGlass className="search-box__icon" />
        <input
          ref={productoSearchRef}
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={productoSearch}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {productoResults.length > 0 && (
        <div className="search-results">
          {productoResults.map((p) => {
            const precioUSD = parseFloat(p.precio_usd || 0);
            const precioBs = tasa > 0 ? precioUSD * tasa : 0;

            return (
              <button
                key={p.id}
                type="button"
                className="search-result-item"
                onClick={() => onSelectProducto(p)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="search-result-item__name">{p.nombre}</span>
                  </div>
                  <span className="search-result-item__sub">
                    {p.sku} — Stock: {p.stock}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="search-result-item__price" style={{ fontWeight: 'bold' }}>
                    {formatUSD(precioUSD)}
                  </div>
                  {tasa > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {formatBs(precioBs)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
