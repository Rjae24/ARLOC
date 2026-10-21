import { supabase } from '../lib/supabase';

/**
 * Obtiene las cuentas contables del plan de cuentas (solo cuentas operativas, no padres).
 */
export async function fetchCuentasOperativas() {
  const { data, error } = await supabase
    .from('plan_cuentas')
    .select('id, codigo, nombre, tipo, naturaleza, es_padre')
    .eq('activo', true)
    .eq('es_padre', false)
    .order('codigo');
  if (error) throw error;
  return data || [];
}

/**
 * Obtiene todas las cuentas del plan (incluyendo padres).
 */
export async function fetchPlanCuentas() {
  const { data, error } = await supabase
    .from('plan_cuentas')
    .select('id, codigo, nombre, tipo, naturaleza, es_padre, cuenta_padre_id')
    .eq('activo', true)
    .order('codigo');
  if (error) throw error;
  return data || [];
}

/**
 * Obtiene asientos contables con sus líneas (join) para el Libro Diario.
 * Soporta filtro por módulo y búsqueda por número/glosa.
 */
export async function fetchAsientos({ modulo, search } = {}) {
  let query = supabase
    .from('asientos_contables')
    .select(`
      id, numero, fecha, glosa, modulo, total_debe, total_haber, balanceado, created_at,
      lineas_asiento (
        id, debe, haber,
        plan_cuentas ( id, codigo, nombre, tipo )
      )
    `)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (modulo && modulo !== 'todos') {
    query = query.eq('modulo', modulo);
  }

  if (search) {
    query = query.or(`numero.ilike.%${search}%,glosa.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Crea un asiento contable completo vía RPC.
 * @param {Date|string} fecha
 * @param {string} glosa
 * @param {string} modulo
 * @param {Array<{cuenta_id: string, debe: number, haber: number}>} lineas
 */
export async function crearAsiento(fecha, glosa, modulo, lineas) {
  const { data, error } = await supabase.rpc('crear_asiento', {
    p_fecha: fecha,
    p_glosa: glosa,
    p_modulo: modulo,
    p_lineas: lineas,
  });
  if (error) throw error;
  return data; // uuid del asiento creado
}

/**
 * Obtiene los movimientos de una cuenta contable para el Libro Mayor.
 * Devuelve las líneas con la info del asiento padre.
 */
export async function fetchMovimientosCuenta(cuentaId) {
  const { data, error } = await supabase
    .from('lineas_asiento')
    .select(`
      id, debe, haber,
      asientos_contables (
        id, numero, fecha, glosa, modulo
      )
    `)
    .eq('cuenta_id', cuentaId)
    .order('id'); // Las líneas no tienen fecha directa, ordenamos por las del asiento

  if (error) throw error;

  // Ordenar por la fecha del asiento
  const sorted = (data || []).sort((a, b) => {
    const fechaA = a.asientos_contables?.fecha || '';
    const fechaB = b.asientos_contables?.fecha || '';
    return fechaA.localeCompare(fechaB);
  });

  return sorted;
}

/**
 * Elimina un asiento contable por id (cascade borra las líneas).
 */
export async function eliminarAsiento(asientoId) {
  const { error } = await supabase
    .from('asientos_contables')
    .delete()
    .eq('id', asientoId);
  if (error) throw error;
}
