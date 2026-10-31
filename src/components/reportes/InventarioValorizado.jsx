import Pagination from '../common/Pagination';
import {
  HiOutlineCube,
  HiOutlineBanknotes,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import { formatUSD, formatBs } from '../../utils/formatters';

export default function InventarioValorizado({
  inventario = [],
  valorInventarioUSD = 0,
  tasaBsRef = 1,
  productosBajoStock = [],
  pageInventario = 1,
  setPageInventario,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
            <HiOutlineCube />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Valor USD</span>
            <span className="stat-card__value">{formatUSD(valorInventarioUSD)}</span>
            <span className="stat-card__sub">{inventario.length} productos activos</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
            <HiOutlineBanknotes />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Valor Bs (tasa actual)</span>
            <span className="stat-card__value">{formatBs(valorInventarioUSD * tasaBsRef)}</span>
            <span className="stat-card__sub">Tasa: {tasaBsRef.toFixed(2)} Bs/$</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: productosBajoStock.length > 0 ? 'rgba(239,68,68,0.3)' : undefined }}>
          <div className="stat-card__icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
            <HiOutlineExclamationTriangle />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Stock Crítico</span>
            <span className="stat-card__value" style={{ color: productosBajoStock.length > 0 ? '#EF4444' : undefined }}>
              {productosBajoStock.length}
            </span>
            <span className="stat-card__sub">artículos bajo el mínimo</span>
          </div>
        </div>
      </div>

      {/* Critical stock alert */}
      {productosBajoStock.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid #EF4444', background: 'rgba(239,68,68,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <HiOutlineExclamationTriangle style={{ color: '#EF4444', fontSize: '1.25rem' }} />
            <h4 style={{ margin: 0, color: '#EF4444' }}>Alerta Stock Crítico ({productosBajoStock.length} artículos)</h4>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {productosBajoStock.map(p => (
              <span key={p.id} className="badge badge--danger">
                {p.nombre} ({p.stock}/{p.stock_minimo})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="card">
        <h3 className="card__title">Valoración de Existencias</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Precio USD</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Valor USD</th>
                <th style={{ textAlign: 'right' }}>Valor Bs</th>
              </tr>
            </thead>
            <tbody>
              {inventario.slice((pageInventario - 1) * 20, pageInventario * 20).map(p => {
                const vUSD = p.stock * parseFloat(p.precio_usd || 0);
                const vBs = vUSD * tasaBsRef;
                const bajo = p.stock <= p.stock_minimo;
                return (
                  <tr key={p.id}>
                    <td><code>{p.sku}</code></td>
                    <td><strong>{p.nombre}</strong></td>
                    <td>{p.categorias?.nombre || 'General'}</td>
                    <td style={{ textAlign: 'right' }}>{formatUSD(p.precio_usd)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${bajo ? 'badge--danger' : 'badge--success'}`}>{p.stock}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}><strong>{formatUSD(vUSD)}</strong></td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{formatBs(vBs)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pageInventario}
          totalItems={inventario.length}
          pageSize={20}
          onPageChange={setPageInventario}
        />
      </div>
    </div>
  );
}
