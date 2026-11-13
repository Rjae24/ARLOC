import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatFecha, getWhatsAppUrl, getPhoneCallUrl } from '../utils/formatters';
import { parseProveedorProductos, getDireccionLimpia, encodeProveedorDireccion } from '../utils/proveedorMetaUtils';
import toast from 'react-hot-toast';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineMagnifyingGlass, HiOutlineTrash } from 'react-icons/hi2';
import { FaWhatsapp, FaPhone } from 'react-icons/fa';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    nombre: '', rif: '', telefono: '', email: '', direccion: '', contacto_nombre: '', activo: true, productos_ids: []
  });
  const [busquedaProdModal, setBusquedaProdModal] = useState('');
  const [provToDelete, setProvToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [provRes, prodRes] = await Promise.all([
      supabase.from('proveedores').select('*').order('nombre'),
      supabase.from('productos').select('id, nombre, sku').eq('activo', true).order('nombre'),
    ]);

    const proveedoresProcesados = (provRes.data || []).map(p => ({
      ...p,
      productos_ids: parseProveedorProductos(p),
      direccionLimpia: getDireccionLimpia(p.direccion),
    }));

    setProveedores(proveedoresProcesados);
    setProductosDisponibles(prodRes.data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const direccionConMeta = encodeProveedorDireccion(form.direccion, form.productos_ids);
      const payload = {
        nombre: form.nombre.trim(),
        rif: form.rif.trim().toUpperCase(),
        telefono: form.telefono?.trim() || null,
        email: form.email?.trim() || null,
        direccion: direccionConMeta || null,
        contacto_nombre: form.contacto_nombre?.trim() || null,
        activo: Boolean(form.activo),
      };

      if (editando) {
        const { error } = await supabase.from('proveedores').update(payload).eq('id', editando.id);
        if (error) throw error;
        toast.success('Proveedor actualizado');
      } else {
        const { error } = await supabase.from('proveedores').insert(payload);
        if (error) throw error;
        toast.success('Proveedor creado');
      }
      setShowModal(false);
      setEditando(null);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleConfirmDeleteProveedor() {
    if (!provToDelete) return;
    setDeleting(true);
    try {
      await supabase.from('ordenes_compra').update({ proveedor_id: null }).eq('proveedor_id', provToDelete.id);
      const { error } = await supabase.from('proveedores').delete().eq('id', provToDelete.id);
      if (error) throw error;
      toast.success(`Proveedor "${provToDelete.nombre}" eliminado`);
      setProvToDelete(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al eliminar proveedor');
    } finally {
      setDeleting(false);
    }
  }

  function editarProveedor(p) {
    setEditando(p);
    setForm({
      nombre: p.nombre,
      rif: p.rif,
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccionLimpia || getDireccionLimpia(p.direccion) || '',
      contacto_nombre: p.contacto_nombre || '',
      activo: p.activo,
      productos_ids: p.productos_ids || parseProveedorProductos(p) || [],
    });
    setBusquedaProdModal('');
    setShowModal(true);
  }

  function resetForm() {
    setForm({
      nombre: '', rif: '', telefono: '', email: '', direccion: '', contacto_nombre: '', activo: true, productos_ids: []
    });
    setBusquedaProdModal('');
  }

  function toggleProductoProveedor(prodId) {
    setForm(prev => {
      const existe = prev.productos_ids.includes(prodId);
      const nuevos = existe ? prev.productos_ids.filter(id => id !== prodId) : [...prev.productos_ids, prodId];
      return { ...prev, productos_ids: nuevos };
    });
  }

  const filtrados = proveedores.filter(p =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.rif.toLowerCase().includes(search.toLowerCase())
  );

  const pageSize = 20;
  const paginados = filtrados.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  if (loading) return <div className="page-loading"><div className="loading-spinner" /><p>Cargando proveedores...</p></div>;

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Proveedores</h1>
        <button className="btn btn--primary" onClick={() => { resetForm(); setEditando(null); setShowModal(true); }}>
          <HiOutlinePlus /> Nuevo Proveedor
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <HiOutlineMagnifyingGlass className="search-box__icon" />
          <input placeholder="Buscar por nombre o RIF..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Nombre</th><th>RIF</th><th>Teléfono</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {paginados.map(p => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td><code>{p.rif}</code></td>
                  <td>
                    {p.telefono ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{p.telefono}</span>
                        <a
                          href={getWhatsAppUrl(p.telefono)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--ghost btn--xs"
                          style={{ color: '#25D366', padding: '2px 5px', fontSize: '0.9rem' }}
                          title="Enviar WhatsApp"
                        >
                          <FaWhatsapp />
                        </a>
                        <a
                          href={getPhoneCallUrl(p.telefono)}
                          className="btn btn--ghost btn--xs"
                          style={{ color: '#3B82F6', padding: '2px 5px', fontSize: '0.75rem' }}
                          title="Llamar"
                        >
                          <FaPhone />
                        </a>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td><span className={`badge ${p.activo ? 'badge--success' : 'badge--ghost'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn--ghost btn--xs" onClick={() => editarProveedor(p)} title="Editar"><HiOutlinePencilSquare /></button>
                      <button className="btn btn--ghost btn--xs text-danger" onClick={() => setProvToDelete(p)} title="Eliminar Proveedor"><HiOutlineTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && <tr><td colSpan="5" className="table__empty">No se encontraron proveedores</td></tr>}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header"><h2>{editando ? 'Editar' : 'Nuevo'} Proveedor</h2></div>
            <form onSubmit={handleSubmit} className="modal__form">
              <div className="form-row">
                <div className="form-group"><label>Nombre</label><input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required /></div>
                <div className="form-group"><label>RIF</label><input value={form.rif} onChange={e => setForm({...form, rif: e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Teléfono</label><input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} /></div>
                <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} />
              </div>

              {/* Selector de Catálogo de Productos que vende este Proveedor */}
              <div style={{ marginTop: '0.5rem', marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    📦 Catálogo de Productos que despacha ({form.productos_ids.length} seleccionados)
                  </label>
                  {form.productos_ids.length > 0 && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--xs"
                      onClick={() => setForm({ ...form, productos_ids: [] })}
                      style={{ fontSize: '0.75rem', color: 'var(--danger)' }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={busquedaProdModal}
                    onChange={e => setBusquedaProdModal(e.target.value)}
                    placeholder="Filtrar catálogo por nombre o SKU..."
                    style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                  />
                </div>

                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', paddingRight: '4px' }}>
                  {productosDisponibles
                    .filter(p => !busquedaProdModal || p.nombre?.toLowerCase().includes(busquedaProdModal.toLowerCase()) || p.sku?.toLowerCase().includes(busquedaProdModal.toLowerCase()))
                    .slice(0, 50)
                    .map(p => {
                      const checked = form.productos_ids.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProductoProveedor(p.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            background: checked ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                            border: checked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                            fontSize: '0.84rem',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}} // Manejado por onClick del contenedor
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: checked ? 600 : 400, color: checked ? 'var(--primary)' : 'var(--text-primary)' }}>
                            {p.nombre}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                            {p.sku}
                          </span>
                        </div>
                      );
                    })}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                  💡 Si no marcas ninguno, se mostrará todo el catálogo en las órdenes de compra.
                </span>
              </div>

              <div className="form-group">
                <label className="checkbox-label"><input type="checkbox" checked={form.activo} onChange={e => setForm({...form, activo: e.target.checked})} /> Proveedor activo</label>
              </div>
              <button type="submit" className="btn btn--primary btn--full">{editando ? 'Guardar' : 'Crear Proveedor'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Supplier Deletion */}
      <ConfirmModal
        isOpen={!!provToDelete}
        title={`¿Eliminar al proveedor "${provToDelete?.nombre}"?`}
        message="Las órdenes de compra históricas registradas con este proveedor se conservarán como registro de compras, desvinculando la referencia al proveedor."
        confirmText="Sí, Eliminar Proveedor"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDeleteProveedor}
        onCancel={() => !deleting && setProvToDelete(null)}
      />
    </div>
  );
}
