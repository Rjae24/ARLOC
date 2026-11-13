import { useState, useEffect } from 'react';
import { parseProductoMeta, encodeProductoMeta } from '../../utils/productoMetaUtils';
import SearchableProductSelect from '../common/SearchableProductSelect';

export default function ModalProductoForm({
  show,
  editando,
  form,
  setForm,
  categorias = [],
  productos = [],
  guardando,
  onSubmit,
  onClose,
}) {
  const [tipoProducto, setTipoProducto] = useState('unidad'); // 'unidad' | 'peso' | 'detallado' | 'combo_detallado'
  const [padreId, setPadreId] = useState('');
  const [factor, setFactor] = useState(20);
  const [detalladoOrigenId, setDetalladoOrigenId] = useState('');
  const [unidadesQueConsume, setUnidadesQueConsume] = useState(10);

  useEffect(() => {
    if (show) {
      if (editando) {
        const meta = parseProductoMeta(editando);
        if (meta.esComboDetallado) {
          setTipoProducto('combo_detallado');
          setDetalladoOrigenId(meta.detalladoOrigenId || '');
          setUnidadesQueConsume(meta.unidadesQueConsume || 10);
        } else if (meta.esDetallado) {
          setTipoProducto('detallado');
          setPadreId(meta.padreId || '');
          setFactor(meta.factor || 20);
        } else if (meta.unidad === 'kg' || meta.unidad === 'g') {
          setTipoProducto('peso');
        } else {
          setTipoProducto('unidad');
        }
      } else {
        setTipoProducto('unidad');
        setPadreId('');
        setFactor(20);
        setDetalladoOrigenId('');
        setUnidadesQueConsume(10);
      }
    }
  }, [show, editando]);

  if (!show) return null;

  // Filtrar empaques cerrados elegibles (que no sean detallados a su vez)
  const empaquesDisponibles = productos.filter(p => !editando || p.id !== editando.id);
  // Productos detallados sueltos elegibles para combos como "Media Caja"
  const detalladosDisponibles = productos.filter(p => {
    if (editando && p.id === editando.id) return false;
    const m = parseProductoMeta(p);
    return m.esDetallado;
  });

  function handleSubmitLocal(e) {
    e.preventDefault();
    let unidad = 'und';
    let esDetallado = false;
    let esComboDetallado = false;

    if (tipoProducto === 'peso') {
      unidad = 'kg';
    } else if (tipoProducto === 'detallado') {
      unidad = 'und';
      esDetallado = true;
    } else if (tipoProducto === 'combo_detallado') {
      unidad = 'und';
      esComboDetallado = true;
    }

    const descFinal = encodeProductoMeta({
      unidad,
      esDetallado,
      esComboDetallado,
      padreId: esDetallado ? padreId : null,
      detalladoOrigenId: esComboDetallado ? detalladoOrigenId : null,
      unidadesQueConsume: esComboDetallado ? unidadesQueConsume : 1,
      factor: esDetallado ? factor : 1,
      descripcionTexto: form.descripcionTexto || form.descripcion,
    });

    onSubmit(e, {
      ...form,
      unidad_medida: unidad,
      es_detallado: esDetallado,
      es_combo_detallado: esComboDetallado,
      producto_padre_id: esDetallado ? padreId : null,
      factor_conversion: esDetallado ? factor : 1,
      descripcion: descFinal,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{editando ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmitLocal} className="modal__body">
          {/* Selector de Tipo de Producto (Bodega) */}
          <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              TIPO DE PRODUCTO:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
              <button
                type="button"
                className={`btn btn--xs ${tipoProducto === 'unidad' ? 'btn--primary' : 'btn--outline'}`}
                onClick={() => setTipoProducto('unidad')}
                style={{ minHeight: '40px', justifyContent: 'center' }}
              >
                📦 Por Unidad / Empaque
              </button>
              <button
                type="button"
                className={`btn btn--xs ${tipoProducto === 'peso' ? 'btn--primary' : 'btn--outline'}`}
                onClick={() => setTipoProducto('peso')}
                style={{ minHeight: '40px', justifyContent: 'center' }}
              >
                ⚖️ Por Peso (Kg / Gramos)
              </button>
              <button
                type="button"
                className={`btn btn--xs ${tipoProducto === 'detallado' ? 'btn--primary' : 'btn--outline'}`}
                onClick={() => setTipoProducto('detallado')}
                style={{ minHeight: '40px', justifyContent: 'center' }}
              >
                ✂️ Detallado (Suelto)
              </button>
              <button
                type="button"
                className={`btn btn--xs ${tipoProducto === 'combo_detallado' ? 'btn--primary' : 'btn--outline'}`}
                onClick={() => setTipoProducto('combo_detallado')}
                style={{ minHeight: '40px', justifyContent: 'center' }}
              >
                🧩 Combo Detallado (Ej. Media Caja)
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
              {tipoProducto === 'peso' && 'Ej: Queso, tomate, plátano, jamón. Admite ventas fraccionadas.'}
              {tipoProducto === 'detallado' && 'Ej: Cigarros sueltos, catalinas, panes, cocadas. Proviene de un empaque.'}
              {tipoProducto === 'combo_detallado' && 'Ej: Media caja de cigarros (10 unidades), bolsa de 5 panes. Precio propio y descuenta del detallado.'}
              {tipoProducto === 'unidad' && 'Ej: Harina, refresco, paquete cerrado, caja completa.'}
            </span>
          </div>

          {/* Configuración si es Combo Detallado (Media Caja, Paquete fraccionado) */}
          {tipoProducto === 'combo_detallado' && (
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.85rem', borderRadius: '8px' }}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#60A5FA', display: 'block', marginBottom: '0.35rem' }}>
                  ¿De qué producto detallado (suelto) se descuenta este combo? (Ej. Cigarros Sueltos)
                </label>
                <SearchableProductSelect
                  productos={detalladosDisponibles}
                  value={detalladoOrigenId}
                  onChange={(selectedId) => setDetalladoOrigenId(selectedId)}
                  placeholder="Selecciona el producto detallado origen..."
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#60A5FA' }}>
                  ¿Cuántas unidades detalladas descuenta cada venta de este combo?
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={unidadesQueConsume}
                  onChange={e => setUnidadesQueConsume(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="Ej. 10 para Media Caja de cigarros"
                  required={tipoProducto === 'combo_detallado'}
                  style={{ minHeight: '44px' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '3px' }}>
                  Al vender este producto en Caja a su propio precio, el sistema descontará automáticamente <strong>{unidadesQueConsume}</strong> unidades sueltas del producto detallado seleccionado.
                </span>
              </div>
            </div>
          )}

          {/* Configuración si es Detallado */}
          {tipoProducto === 'detallado' && (
            <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '0.85rem', borderRadius: '8px' }}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#FACC15', display: 'block', marginBottom: '0.35rem' }}>
                  ¿De qué empaque cerrado proviene este producto? (Escribe para buscar)
                </label>
                <SearchableProductSelect
                  productos={empaquesDisponibles}
                  value={padreId}
                  onChange={(selectedId) => setPadreId(selectedId)}
                  placeholder="Escribe el nombre o SKU del empaque cerrado..."
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#FACC15' }}>
                  ¿Cuántas unidades detalladas salen de cada empaque abierto?
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={factor}
                  onChange={e => setFactor(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="Ej. 20 para cigarrillos, 10 para panes, 6 para catalinas"
                  required={tipoProducto === 'detallado'}
                  style={{ minHeight: '44px' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '3px' }}>
                  Al abrir 1 empaque en la bodega, se restará 1 empaque y se sumarán <strong>{factor}</strong> unidades sueltas.
                </span>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>SKU / Código</label>
              <input
                type="text"
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                placeholder="Ej. PROD-001"
                required
                style={{ minHeight: '44px' }}
              />
            </div>
            <div className="form-group">
              <label>Nombre del Producto</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder={tipoProducto === 'detallado' ? 'Ej. Cigarrillo Suelto (und)' : tipoProducto === 'peso' ? 'Ej. Queso Paisa (Kg)' : 'Ej. Refresco 1.5L'}
                required
                style={{ minHeight: '44px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Descripción / Notas</label>
            <textarea
              value={form.descripcionTexto || ''}
              onChange={e => setForm({ ...form, descripcionTexto: e.target.value })}
              rows="2"
              placeholder="Detalles, marca o especificaciones..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Precio de Venta (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precio_usd}
                onChange={e => setForm({ ...form, precio_usd: e.target.value })}
                placeholder="0.00"
                required
                style={{ minHeight: '44px' }}
              />
            </div>
            <div className="form-group">
              <label>{tipoProducto === 'peso' ? 'Stock Actual (Kg)' : 'Stock Actual (Unidades)'}</label>
              <input
                type="number"
                step={tipoProducto === 'peso' ? '0.05' : '1'}
                min="0"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                required
                style={{ minHeight: '44px' }}
              />
            </div>
            <div className="form-group">
              <label>Stock Mínimo (Alerta)</label>
              <input
                type="number"
                step={tipoProducto === 'peso' ? '0.5' : '1'}
                min="0"
                value={form.stock_minimo}
                onChange={e => setForm({ ...form, stock_minimo: e.target.value })}
                required
                style={{ minHeight: '44px' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Categoría</label>
              <select
                value={form.categoria_id}
                onChange={e => setForm({ ...form, categoria_id: e.target.value })}
                style={{ minHeight: '44px' }}
              >
                <option value="">Sin categoría</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="checkbox-label" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => setForm({ ...form, activo: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                Producto activo en venta
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={guardando}
            style={{ minHeight: '48px', fontSize: '1rem', fontWeight: 'bold' }}
          >
            {guardando ? 'Guardando...' : (editando ? 'Guardar Cambios' : 'Crear Producto')}
          </button>
        </form>
      </div>
    </div>
  );
}

