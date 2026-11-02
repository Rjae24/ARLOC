import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { parseProductoMeta } from '../../utils/productoMetaUtils';
import toast from 'react-hot-toast';
import { HiOutlineCube, HiOutlineArrowRight } from 'react-icons/hi2';

export default function ModalDesincorporarEmpaque({ producto, productos = [], onClose, onSuccess }) {
  const [cantidadEmpaques, setCantidadEmpaques] = useState(1);
  const [loading, setLoading] = useState(false);

  const meta = parseProductoMeta(producto);
  const empaquePadre = productos.find(p => p.id === meta.padreId);

  const factor = meta.factor || 1;
  const unidadesASumar = cantidadEmpaques * factor;
  const stockPadre = Number(empaquePadre?.stock || 0);

  async function handleAbrirEmpaque(e) {
    e.preventDefault();
    if (!empaquePadre) {
      toast.error('No se encontró el empaque cerrado asociado');
      return;
    }
    if (cantidadEmpaques <= 0) {
      toast.error('Ingrese al menos 1 empaque a abrir');
      return;
    }
    if (stockPadre < cantidadEmpaques) {
      toast.error(`Stock insuficiente de ${empaquePadre.nombre}. Disponible: ${stockPadre}`);
      return;
    }

    setLoading(true);
    try {
      // 1. Intentar vía función RPC en Supabase
      const { data: rpcData, error: rpcError } = await supabase.rpc('desincorporar_empaque', {
        p_producto_detallado_id: producto.id,
        p_cantidad_empaques: cantidadEmpaques,
      });

      if (!rpcError && rpcData?.success) {
        toast.success(`¡Se abrió ${cantidadEmpaques} empaque(s)! Sumadas ${unidadesASumar} unidades a ${producto.nombre}`);
        onSuccess();
        onClose();
        return;
      }

      // 2. Fallback atómico vía updates directos en caso de que la RPC aún no se haya corrido en Supabase
      const nuevoStockPadre = Math.max(0, stockPadre - cantidadEmpaques);
      const nuevoStockDetallado = Number(producto.stock || 0) + unidadesASumar;

      const [resPadre, resDetallado] = await Promise.all([
        supabase.from('productos').update({ stock: nuevoStockPadre }).eq('id', empaquePadre.id),
        supabase.from('productos').update({ stock: nuevoStockDetallado }).eq('id', producto.id),
      ]);

      if (resPadre.error) throw resPadre.error;
      if (resDetallado.error) throw resDetallado.error;

      toast.success(`¡Se abrió ${cantidadEmpaques} empaque(s)! +${unidadesASumar} unidades de ${producto.nombre}`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al desincorporar empaque:', err);
      toast.error(err.message || 'Error al abrir el empaque');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <HiOutlineCube style={{ color: 'var(--primary)' }} /> Abrir Empaque
          </h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleAbrirEmpaque} className="modal__body" style={{ gap: '1rem' }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Empaque Cerrado (Origen):</div>
            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '2px' }}>
              {empaquePadre?.nombre || 'Empaque no encontrado'}
            </div>
            <div style={{ fontSize: '0.8rem', color: stockPadre > 0 ? 'var(--success)' : 'var(--danger)', marginTop: '4px' }}>
              Stock disponible: <strong>{stockPadre} empaque(s)</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.25rem' }}>
            <HiOutlineArrowRight />
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Producto Detallado (Destino):</div>
            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '2px' }}>
              {producto.nombre}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Rendimiento: <strong>{factor} unidades</strong> por cada empaque abierto
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
              ¿Cuántos empaques deseas abrir ahora?
            </label>
            <input
              type="number"
              min="1"
              max={Math.max(1, stockPadre)}
              value={cantidadEmpaques}
              onChange={e => setCantidadEmpaques(Math.max(1, parseInt(e.target.value) || 1))}
              required
              style={{ minHeight: '44px', fontSize: '1rem' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
              Se restará <strong>{cantidadEmpaques}</strong> empaque(s) y se sumarán <strong>{unidadesASumar}</strong> {producto.nombre}.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={loading || stockPadre < cantidadEmpaques}
              style={{ minHeight: '46px', fontWeight: 'bold' }}
            >
              {loading ? 'Abriendo...' : `Confirmar y Sumar +${unidadesASumar} uds`}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose} style={{ minHeight: '46px' }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

