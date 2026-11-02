import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatUSD, formatBs, formatFecha } from '../utils/formatters';
import { parseProductoMeta } from '../utils/productoMetaUtils';
import toast from 'react-hot-toast';
import Pagination from '../components/common/Pagination';
import {
  HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash,
  HiOutlineMagnifyingGlass, HiOutlineFunnel, HiOutlineTag, HiOutlineDocumentChartBar,
  HiOutlineCube,
} from 'react-icons/hi2';
import ConfirmModal from '../components/common/ConfirmModal';
import ModalImprimirEtiquetas from '../components/print/ModalImprimirEtiquetas';
import ModalProductoForm from '../components/inventario/ModalProductoForm';
import ModalDesincorporarEmpaque from '../components/inventario/ModalDesincorporarEmpaque';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tasaActual, setTasaActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showEtiquetasModal, setShowEtiquetasModal] = useState(false);
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [productoParaEtiqueta, setProductoParaEtiqueta] = useState(null);
  const [productoParaAbrir, setProductoParaAbrir] = useState(null);
  const [editando, setEditando] = useState(null);
  const [catEditando, setCatEditando] = useState(null);
  const [form, setForm] = useState({
    sku: '', nombre: '', descripcion: '', precio_usd: '', stock: '', stock_minimo: '5', categoria_id: '', activo: true
  });
  const [catForm, setCatForm] = useState({ nombre: '', descripcion: '' });
  const [prodToDelete, setProdToDelete] = useState(null);
  const [catToDelete, setCatToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [rateRes, prodRes, catRes] = await Promise.all([
      supabase.from('tasas_cambio').select('tasa_usd_bs').order('fecha_registro', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('productos').select('*, categorias(nombre)').order('nombre'),
      supabase.from('categorias').select('*').order('nombre'),
    ]);
    setTasaActual(rateRes?.data?.tasa_usd_bs || null);
    setProductos(prodRes?.data || []);
    setCategorias(catRes?.data || []);
    setLoading(false);
  }

  async function handleSubmit(e, dataFromModal) {
    if (e && e.preventDefault) e.preventDefault();
    const source = dataFromModal || form;

    if (!source.sku?.trim() || !source.nombre?.trim()) {
      toast.error('El código SKU y el nombre son obligatorios');
      return;
    }

    setGuardando(true);
    // Para stock en productos pesados o detallados
    const stockParsed = parseFloat(source.stock) || 0;
    const payload = {
      sku: source.sku.trim().toUpperCase(),
      nombre: source.nombre.trim(),
      descripcion: source.descripcion?.trim() || null,
      precio_usd: Math.max(0, parseFloat(source.precio_usd) || 0),
      stock: Math.max(0, stockParsed),
      stock_minimo: Math.max(0, parseFloat(source.stock_minimo) || 5),
      categoria_id: source.categoria_id || null,
      activo: Boolean(source.activo),
    };

    try {
      if (editando) {
        const { error } = await supabase.from('productos').update(payload).eq('id', editando.id);
        if (error) throw error;
        toast.success('Producto actualizado correctamente');
      } else {
        const { error } = await supabase.from('productos').insert(payload);
        if (error) throw error;
        toast.success('Producto creado correctamente');
      }
      setShowModal(false);
      setEditando(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      toast.error(error.message || 'Error al guardar producto');
    } finally {
      setGuardando(false);
    }
  }

  async function handleConfirmDeleteProduct() {
    if (!prodToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('productos').delete().eq('id', prodToDelete.id);
      if (error) {
        // Fallback defensivo a desactivación si tiene dependencias críticas
        const { error: updateError } = await supabase.from('productos').update({ activo: false }).eq('id', prodToDelete.id);
        if (updateError) throw updateError;
        toast.success(`Producto marcado como INACTIVO debido a dependencias en base de datos.`);
      } else {
        toast.success(`Producto "${prodToDelete.nombre}" eliminado`);
      }
      setProdToDelete(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al eliminar producto');
    } finally {
      setDeleting(false);
    }
  }

  async function handleCatSubmit(e) {
    e.preventDefault();
    if (!catForm.nombre?.trim()) return;
    try {
      if (catEditando) {
        const { error } = await supabase.from('categorias').update({
          nombre: catForm.nombre,
          descripcion: catForm.descripcion,
        }).eq('id', catEditando.id);
        if (error) throw error;
        toast.success('Categoría actualizada');
      } else {
        const { error } = await supabase.from('categorias').insert(catForm);
        if (error) throw error;
        toast.success('Categoría creada');
      }
      setCatEditando(null);
      setCatForm({ nombre: '', descripcion: '' });
      loadData();
    } catch (error) {
      toast.error(error.message || 'Error al guardar categoría');
    }
  }

  async function handleConfirmDeleteCat() {
    if (!catToDelete) return;
    setDeleting(true);
    try {
      await supabase.from('productos').update({ categoria_id: null }).eq('categoria_id', catToDelete.id);
      const { error } = await supabase.from('categorias').delete().eq('id', catToDelete.id);
      if (error) throw error;
      toast.success(`Categoría "${catToDelete.nombre}" eliminada`);
      if (catEditando?.id === catToDelete.id) {
        setCatEditando(null);
        setCatForm({ nombre: '', descripcion: '' });
      }
      setCatToDelete(null);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Error al eliminar categoría');
    } finally {
      setDeleting(false);
    }
  }

  function editarProducto(producto) {
    setEditando(producto);
    setForm({
      sku: producto.sku, nombre: producto.nombre, descripcion: producto.descripcion || '',
      precio_usd: producto.precio_usd.toString(), stock: producto.stock.toString(),
      stock_minimo: producto.stock_minimo.toString(), categoria_id: producto.categoria_id || '',
      activo: producto.activo,
    });
    setShowModal(true);
  }

  function resetForm() {
    setForm({
      sku: '', nombre: '', descripcion: '', precio_usd: '', stock: '', stock_minimo: '5',
      categoria_id: '', activo: true
    });
  }

  function abrirModalEtiquetas(producto = null) {
    setProductoParaEtiqueta(producto);
    setShowEtiquetasModal(true);
  }

  const productosFiltrados = productos.filter(p => {
    const matchSearch = !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filtroCategoria || p.categoria_id === filtroCategoria;
    return matchSearch && matchCat;
  });

  const pageSize = 20;
  const productosPaginados = productosFiltrados.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filtroCategoria]);

  if (loading) return <div className="page-loading"><div className="loading-spinner" /><p>Cargando inventario...</p></div>;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Inventario de Productos</h1>
          <p className="page__subtitle">{productos.length} productos registrados</p>
        </div>
        <div className="page__actions">
          <Link className="btn btn--secondary" to="/inventario/reportes">
            <HiOutlineDocumentChartBar /> Reportes
          </Link>
          <button className="btn btn--secondary" onClick={() => abrirModalEtiquetas(null)}>
            <HiOutlineTag /> Imprimir Etiquetas
          </button>
          <button className="btn btn--secondary" onClick={() => { setCatEditando(null); setCatForm({ nombre: '', descripcion: '' }); setShowCatModal(true); }}>
            <HiOutlinePlus /> Categorías
          </button>
          <button className="btn btn--primary" onClick={() => { setEditando(null); resetForm(); setShowModal(true); }}>
            <HiOutlinePlus /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <HiOutlineMagnifyingGlass className="search-box__icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio (USD / Bs)</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosPaginados.map(p => {
                const meta = parseProductoMeta(p);
                const esPeso = meta.unidad === 'kg';
                const esDetallado = meta.esDetallado;

                return (
                  <tr key={p.id}>
                    <td><code>{p.sku}</code></td>
                    <td>
                      <div>
                        <strong>{p.nombre}</strong>
                        {esDetallado && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--primary, #10B981)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                            <span>✂️ Detallado (Factor: {meta.factor || 1}/empaque)</span>
                          </div>
                        )}
                        {esPeso && (
                          <div style={{ fontSize: '0.74rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                            <span>⚖️ Venta por Peso (Kg / Fracción)</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{p.categorias?.nombre || '—'}</td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {formatUSD(p.precio_usd)} {esPeso ? '/ kg' : ''}
                      </div>
                      {tasaActual && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {formatBs(parseFloat(p.precio_usd || 0) * tasaActual)} {esPeso ? '/ kg' : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.stock <= p.stock_minimo ? (p.stock === 0 ? 'badge--danger' : 'badge--warning') : 'badge--success'}`}>
                        {p.stock} {esPeso ? 'kg' : (esDetallado ? 'und (sueltas)' : 'und')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.activo ? 'badge--success' : 'badge--ghost'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="table__actions">
                        {esDetallado && (
                          <button
                            className="btn btn--secondary btn--xs"
                            onClick={() => {
                              setProductoParaAbrir(p);
                              setShowAbrirModal(true);
                            }}
                            title="Abrir Empaque Cerrado"
                            style={{ gap: '0.2rem', padding: '0.25rem 0.5rem', fontWeight: 600 }}
                          >
                            <HiOutlineCube /> Abrir
                          </button>
                        )}
                        <button
                          className="btn btn--ghost btn--xs"
                          onClick={() => abrirModalEtiquetas(p)}
                          title="Imprimir Código de Barras"
                        >
                          <HiOutlineTag />
                        </button>
                        <button className="btn btn--ghost btn--xs" onClick={() => editarProducto(p)} title="Editar">
                          <HiOutlinePencilSquare />
                        </button>
                        <button className="btn btn--ghost btn--xs text-danger" onClick={() => setProdToDelete(p)} title="Eliminar Producto">
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {productosFiltrados.length === 0 && (
                <tr><td colSpan="7" className="table__empty">No se encontraron productos</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={productosFiltrados.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal de Producto Modular */}
      <ModalProductoForm
        show={showModal}
        editando={editando}
        form={form}
        setForm={setForm}
        categorias={categorias}
        productos={productos}
        guardando={guardando}
        onSubmit={handleSubmit}
        onClose={() => { setShowModal(false); setEditando(null); }}
      />

      {/* Modal para Abrir Empaque Cerrado */}
      {showAbrirModal && (
        <ModalDesincorporarEmpaque
          producto={productoParaAbrir}
          productos={productos}
          onClose={() => {
            setShowAbrirModal(false);
            setProductoParaAbrir(null);
          }}
          onSuccess={loadData}
        />
      )}

      {/* Category Modal with Management */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => { setShowCatModal(false); setCatEditando(null); }}>
          <div className="modal modal--md" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Gestión de Categorías</h2>
              <button className="modal__close" onClick={() => { setShowCatModal(false); setCatEditando(null); }}>×</button>
            </div>

            <div className="modal__body">
              {/* Form to create/edit */}
              <form onSubmit={handleCatSubmit} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>{catEditando ? 'Editar Categoría' : 'Nueva Categoría'}</h4>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label>Nombre</label>
                  <input
                    value={catForm.nombre}
                    onChange={e => setCatForm({...catForm, nombre: e.target.value})}
                    placeholder="Ej. Audio y Sonido"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label>Descripción</label>
                  <input
                    value={catForm.descripcion}
                    onChange={e => setCatForm({...catForm, descripcion: e.target.value})}
                    placeholder="Descripción de la categoría..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn--primary btn--sm" style={{ flex: 1 }}>
                    {catEditando ? 'Guardar Cambios' : 'Crear Categoría'}
                  </button>
                  {catEditando && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => { setCatEditando(null); setCatForm({ nombre: '', descripcion: '' }); }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              {/* Existing Categories List */}
              <h4>Categorías Existentes ({categorias.length})</h4>
              {categorias.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay categorías registradas.</p>
              ) : (
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {categorias.map(cat => (
                    <div
                      key={cat.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div>
                        <strong>{cat.nombre}</strong>
                        {cat.descripcion && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.descripcion}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          className="btn btn--ghost btn--xs"
                          onClick={() => {
                            setCatEditando(cat);
                            setCatForm({ nombre: cat.nombre, descripcion: cat.descripcion || '' });
                          }}
                          title="Editar categoría"
                        >
                          <HiOutlinePencilSquare />
                        </button>
                        <button
                          className="btn btn--ghost btn--xs text-danger"
                          onClick={() => setCatToDelete(cat)}
                          title="Eliminar categoría"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Product Deletion */}
      <ConfirmModal
        isOpen={!!prodToDelete}
        title={`¿Eliminar el producto "${prodToDelete?.nombre}"?`}
        message="Se eliminará el producto del catálogo. Si posee historial contable o ventas, el sistema lo desactivará de forma segura preservando la integridad de las facturas."
        confirmText="Sí, Eliminar Producto"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => !deleting && setProdToDelete(null)}
      />

      {/* Confirmation Modal for Category Deletion */}
      <ConfirmModal
        isOpen={!!catToDelete}
        title={`¿Eliminar la categoría "${catToDelete?.nombre}"?`}
        message="Los productos asociados a esta categoría no se borrarán, solo quedarán sin categoría asignada."
        confirmText="Sí, Eliminar Categoría"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDeleteCat}
        onCancel={() => !deleting && setCatToDelete(null)}
      />

      {/* Modal para Imprimir Etiquetas de Código de Barras */}
      {showEtiquetasModal && (
        <ModalImprimirEtiquetas
          productos={productos}
          productoInicial={productoParaEtiqueta}
          onClose={() => {
            setShowEtiquetasModal(false);
            setProductoParaEtiqueta(null);
          }}
        />
      )}
    </div>
  );
}
