import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatFecha } from '../utils/formatters';
import { fetchMovimientosInventario } from '../services/kardexService';
import Pagination from '../components/common/Pagination';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
  HiOutlineCube,
  HiOutlineArrowDownRight,
  HiOutlineArrowUpRight,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

export default function HistorialOperacionesInventario() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    cargarOperaciones();
  }, []);

  async function cargarOperaciones() {
    setLoading(true);
    const data = await fetchMovimientosInventario({ limit: 300 });
    setMovimientos(data || []);
    setLoading(false);
  }

  const filtrados = movimientos.filter((m) => {
    const q = search.toLowerCase();
    const prodMatch = m.productos?.nombre?.toLowerCase().includes(q) || m.productos?.sku?.toLowerCase().includes(q);
    const refMatch = m.referencia?.toLowerCase().includes(q);
    const tipoMatch = !filtroTipo || m.tipo === filtroTipo;
    return (!search || prodMatch || refMatch) && tipoMatch;
  });

  const pageSize = 25;
  const paginados = filtrados.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'apertura_empaque':
        return <span className="badge badge--warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>📦 Apertura Empaque</span>;
      case 'venta':
        return <span className="badge badge--danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>🛒 Salida por Venta</span>;
      case 'compra':
        return <span className="badge badge--success" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>📥 Entrada por Compra</span>;
      default:
        return <span className="badge badge--ghost">Ajuste</span>;
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineClipboardDocumentList style={{ color: 'var(--primary)' }} /> Historial de Operaciones de Inventario
          </h1>
          <p className="page__subtitle">
            Auditoría de cada movimiento físico, aperturas automáticas de cajas y salidas por venta
          </p>
        </div>
        <button className="btn btn--secondary" onClick={cargarOperaciones} disabled={loading}>
          <HiOutlineArrowPath className={loading ? 'spin' : ''} /> Actualizar
        </button>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
          <HiOutlineMagnifyingGlass className="search-box__icon" />
          <input
            type="text"
            placeholder="Buscar por producto, SKU o referencia..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => {
            setFiltroTipo(e.target.value);
            setCurrentPage(1);
          }}
          style={{ minWidth: '180px' }}
        >
          <option value="">Todos los tipos</option>
          <option value="apertura_empaque">📦 Aperturas de Empaque</option>
          <option value="venta">🛒 Salidas por Venta</option>
          <option value="compra">📥 Entradas por Compra</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Producto / SKU</th>
                <th>Tipo de Operación</th>
                <th>Cantidad</th>
                <th>Stock Anterior / Nuevo</th>
                <th>Referencia / Detalle</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((m) => {
                const esNegativo = Number(m.cantidad) < 0;
                return (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.84rem' }}>
                      {formatFecha(m.created_at)}
                    </td>
                    <td>
                      <strong>{m.productos?.nombre || 'Producto eliminado'}</strong>
                      {m.productos?.sku && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          SKU: <code>{m.productos.sku}</code>
                        </div>
                      )}
                    </td>
                    <td>{getTipoBadge(m.tipo)}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: esNegativo ? 'var(--danger, #EF4444)' : 'var(--primary, #10B981)',
                        }}
                      >
                        {esNegativo ? '' : '+'}
                        {m.cantidad}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {m.stock_anterior} ➔ <strong>{m.stock_nuevo}</strong>
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{m.referencia}</div>
                      {m.usuarios?.nombre_completo && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Por: {m.usuarios.nombre_completo}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan="6" className="table__empty">
                    {loading ? 'Cargando operaciones...' : 'No hay movimientos registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={filtrados.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
