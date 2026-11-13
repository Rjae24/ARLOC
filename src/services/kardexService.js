import { supabase } from '../lib/supabase';

/**
 * Servicio para registrar y auditar cada movimiento físico del inventario (Kárdex).
 * Registra aperturas de empaque (automáticas o manuales), ventas, compras y mermas.
 */

export async function registrarMovimientoInventario({
  productoId,
  tipo, // 'apertura_empaque' | 'venta' | 'compra' | 'ajuste'
  cantidad,
  stockAnterior,
  stockNuevo,
  referencia = '',
  usuarioId = null,
  detalles = {},
}) {
  try {
    const { error } = await supabase.from('movimientos_inventario').insert({
      producto_id: productoId,
      tipo,
      cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      referencia,
      usuario_id: usuarioId,
      detalles,
    });
    if (error) {
      console.warn('Advertencia al registrar movimiento de inventario:', error.message);
    }
  } catch (err) {
    console.warn('Error silencioso en kardex:', err);
  }
}

export async function fetchMovimientosInventario({ limit = 100, productoId = null } = {}) {
  try {
    let query = supabase
      .from('movimientos_inventario')
      .select('*, productos(nombre, sku), usuarios:usuario_id(nombre_completo)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productoId) {
      query = query.eq('producto_id', productoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Error fetching movimientos inventario:', err);
    return [];
  }
}
