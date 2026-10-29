import { supabase } from '../lib/supabase';

const PAGE_SIZE = 1000;

export const ORIGENES_CONTABLES = [
  { value: 'Manual', label: 'Manual' },
  { value: 'Ventas', label: 'Ventas' },
  { value: 'Compras', label: 'Compras' },
  { value: 'Tesorería', label: 'Tesorería' },
  { value: 'Gastos', label: 'Gastos' },
  { value: 'Ajuste', label: 'Ajuste' },
  { value: 'Nómina', label: 'Nómina' },
];

function mapearLinea(linea) {
  return {
    id: linea.id,
    debe: linea.debe,
    haber: linea.haber,
    debeVes: linea.debe_ves,
    haberVes: linea.haber_ves,
    plan_cuentas: linea.plan_cuentas,
  };
}

function mapearAsiento(asiento) {
  const lineas = (asiento.lineas_asiento || []).map(mapearLinea);
  const totalDebeCentimos = lineas.reduce((total, linea) =>
    total + Math.round(Number(linea.debe || 0) * 100), 0);
  const totalHaberCentimos = lineas.reduce((total, linea) =>
    total + Math.round(Number(linea.haber || 0) * 100), 0);

  return {
    ...asiento,
    numero: asiento.numero,
    glosa: asiento.glosa,
    modulo: asiento.modulo,
    total_debe: totalDebeCentimos / 100,
    total_haber: totalHaberCentimos / 100,
    total_debe_ves: lineas.reduce((total, linea) => total + Number(linea.debeVes || 0), 0),
    total_haber_ves: lineas.reduce((total, linea) => total + Number(linea.haberVes || 0), 0),
    balanceado: totalDebeCentimos === totalHaberCentimos,
    lineas_asiento: lineas,
  };
}

function escaparBusqueda(value) {
  return value.replace(/[\\%_]/g, character => `\\${character}`);
}

function crearConsultaAsientos({ modulo, search, buscarNumero }) {
  let query = supabase
    .from('asientos_contables')
    .select(`
      id, numero, fecha, glosa, modulo, registrado_por, total_debe, total_haber,
      balanceado, tasa_cambio, created_at,
      lineas_asiento (
        id, debe, haber, debe_ves, haber_ves,
        plan_cuentas ( id, codigo, nombre, tipo )
      )
    `)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (modulo && modulo !== 'todos') query = query.eq('modulo', modulo);
  if (search) {
    query = query.ilike(
      buscarNumero ? 'numero' : 'glosa',
      `%${escaparBusqueda(search)}%`
    );
  }
  return query;
}

async function cargarAsientos(filtros, buscarNumero) {
  const asientos = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await crearConsultaAsientos({ ...filtros, buscarNumero })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    asientos.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return asientos;
}

/**
 * Obtiene cuentas activas que aceptan movimientos.
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
 * Obtiene todas las cuentas activas del plan contable.
 */
export async function fetchPlanCuentas() {
  const { data, error } = await supabase
    .from('plan_cuentas')
    .select('id, codigo, nombre, tipo, naturaleza, es_padre, cuenta_padre_id, activo')
    .eq('activo', true)
    .order('codigo');
  if (error) throw error;
  return data || [];
}

/**
 * Obtiene TODAS las cuentas (activas e inactivas) para gestión.
 */
export async function fetchPlanCuentasCompleto() {
  const { data, error } = await supabase
    .from('plan_cuentas')
    .select('id, codigo, nombre, tipo, naturaleza, es_padre, cuenta_padre_id, activo')
    .order('codigo');
  if (error) throw error;
  return data || [];
}

/**
 * Crea una nueva cuenta contable.
 */
export async function crearCuenta({ codigo, nombre, tipo, naturaleza, es_padre, cuenta_padre_id }) {
  const { data, error } = await supabase
    .from('plan_cuentas')
    .insert({
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      tipo,
      naturaleza,
      es_padre: es_padre || false,
      cuenta_padre_id: cuenta_padre_id || null,
      activo: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Activa/desactiva una cuenta contable.
 */
export async function toggleCuentaActiva(cuentaId, activo) {
  const { error } = await supabase
    .from('plan_cuentas')
    .update({ activo })
    .eq('id', cuentaId);
  if (error) throw error;
}

/**
 * Actualiza datos de una cuenta contable.
 */
export async function actualizarCuenta(cuentaId, { nombre, tipo, naturaleza, es_padre }) {
  const { error } = await supabase
    .from('plan_cuentas')
    .update({
      nombre: nombre.trim(),
      tipo,
      naturaleza,
      es_padre: es_padre || false,
    })
    .eq('id', cuentaId);
  if (error) throw error;
}

/**
 * Obtiene el balance de comprobación: saldos acumulados de todas las cuentas operativas.
 */
export async function fetchBalanceComprobacion({ fechaDesde, fechaHasta } = {}) {
  const cuentas = await fetchCuentasOperativas();

  // Traer todas las líneas con sus asientos para filtrar por fecha
  let query = supabase
    .from('lineas_asiento')
    .select(`
      id, cuenta_id, debe, haber, debe_ves, haber_ves,
      asientos_contables ( fecha )
    `);

  const { data: lineas, error } = await query;
  if (error) throw error;

  // Filtrar por rango de fechas si se proporcionó
  const lineasFiltradas = (lineas || []).filter((l) => {
    const fecha = l.asientos_contables?.fecha;
    if (!fecha) return false;
    if (fechaDesde && fecha < fechaDesde) return false;
    if (fechaHasta && fecha > fechaHasta) return false;
    return true;
  });

  // Agrupar por cuenta
  const saldosPorCuenta = {};
  for (const linea of lineasFiltradas) {
    if (!saldosPorCuenta[linea.cuenta_id]) {
      saldosPorCuenta[linea.cuenta_id] = {
        totalDebe: 0,
        totalHaber: 0,
        totalDebeVes: 0,
        totalHaberVes: 0,
      };
    }
    const s = saldosPorCuenta[linea.cuenta_id];
    s.totalDebe += Math.round(Number(linea.debe || 0) * 100);
    s.totalHaber += Math.round(Number(linea.haber || 0) * 100);
    s.totalDebeVes += Math.round(Number(linea.debe_ves || 0) * 100);
    s.totalHaberVes += Math.round(Number(linea.haber_ves || 0) * 100);
  }

  return cuentas.map((cuenta) => {
    const s = saldosPorCuenta[cuenta.id] || {
      totalDebe: 0, totalHaber: 0, totalDebeVes: 0, totalHaberVes: 0,
    };
    const esDeudora = cuenta.naturaleza?.toUpperCase() === 'DEUDORA'
      || ['ACTIVO', 'COSTO', 'GASTO'].includes(cuenta.tipo?.toUpperCase());

    const saldoCentimos = esDeudora
      ? s.totalDebe - s.totalHaber
      : s.totalHaber - s.totalDebe;
    const saldoVesCentimos = esDeudora
      ? s.totalDebeVes - s.totalHaberVes
      : s.totalHaberVes - s.totalDebeVes;

    return {
      ...cuenta,
      totalDebe: s.totalDebe / 100,
      totalHaber: s.totalHaber / 100,
      totalDebeVes: s.totalDebeVes / 100,
      totalHaberVes: s.totalHaberVes / 100,
      saldo: saldoCentimos / 100,
      saldoVes: saldoVesCentimos / 100,
      saldoDeudor: saldoCentimos > 0 ? saldoCentimos / 100 : 0,
      saldoAcreedor: saldoCentimos < 0 ? Math.abs(saldoCentimos) / 100 : 0,
      saldoDeudorVes: saldoVesCentimos > 0 ? saldoVesCentimos / 100 : 0,
      saldoAcreedorVes: saldoVesCentimos < 0 ? Math.abs(saldoVesCentimos) / 100 : 0,
    };
  }).filter((c) => c.totalDebe > 0 || c.totalHaber > 0);
}

/**
 * Obtiene asientos y sus lineas del esquema contable actualmente desplegado.
 */
export async function fetchAsientos({ modulo = 'todos', search = '' } = {}) {
  const filtros = { modulo, search: search.trim() };
  if (!filtros.search) {
    return (await cargarAsientos(filtros, false)).map(mapearAsiento);
  }

  const [porNumero, porGlosa] = await Promise.all([
    cargarAsientos(filtros, true),
    cargarAsientos(filtros, false),
  ]);
  const unicos = new Map([...porNumero, ...porGlosa].map(asiento => [asiento.id, asiento]));
  return [...unicos.values()].map(mapearAsiento);
}

/**
 * Crea un asiento usando la tasa y validaciones transaccionales de PostgreSQL.
 */
export async function crearAsiento(fecha, glosa, modulo, lineas) {
  if (!fecha || !glosa?.trim()) {
    throw new Error('La fecha y el concepto del asiento son obligatorios.');
  }

  const origenValido = ORIGENES_CONTABLES.some(origen => origen.value === modulo);
  if (!origenValido) throw new Error('El tipo de asiento seleccionado no es válido.');

  const lineasLimpias = lineas.map(linea => ({
    cuenta_id: linea.cuenta_id,
    debe: Math.round(Number(linea.debe || 0) * 100) / 100,
    haber: Math.round(Number(linea.haber || 0) * 100) / 100,
  }));
  if (lineasLimpias.length < 2 || lineasLimpias.some(linea =>
    !linea.cuenta_id
    || !Number.isFinite(linea.debe)
    || !Number.isFinite(linea.haber)
    || linea.debe < 0
    || linea.haber < 0
    || (linea.debe > 0 && linea.haber > 0)
    || (linea.debe === 0 && linea.haber === 0)
  )) {
    throw new Error('Cada asiento requiere dos o más líneas válidas con un monto positivo en un solo lado.');
  }

  const totalDebeCentimos = lineasLimpias.reduce((total, linea) =>
    total + Math.round(linea.debe * 100), 0);
  const totalHaberCentimos = lineasLimpias.reduce((total, linea) =>
    total + Math.round(linea.haber * 100), 0);
  if (totalDebeCentimos === 0 || totalDebeCentimos !== totalHaberCentimos) {
    throw new Error('El asiento debe cuadrar exactamente antes de registrarse.');
  }

  const { data, error } = await supabase.rpc('crear_asiento', {
    p_fecha: fecha,
    p_glosa: glosa.trim(),
    p_modulo: modulo,
    p_lineas: lineasLimpias,
  });
  if (error) throw error;
  return data;
}

/**
 * Obtiene movimientos de una cuenta en orden cronológico.
 */
export async function fetchMovimientosCuenta(cuentaId) {
  const movimientos = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('lineas_asiento')
      .select(`
        id, debe, haber, debe_ves, haber_ves,
        asientos_contables ( id, numero, fecha, glosa, modulo, tasa_cambio )
      `)
      .eq('cuenta_id', cuentaId)
      .order('id')
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    movimientos.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return movimientos.sort((a, b) => {
    const fecha = (a.asientos_contables?.fecha || '').localeCompare(b.asientos_contables?.fecha || '');
    return fecha || (a.asientos_contables?.numero || '').localeCompare(b.asientos_contables?.numero || '');
  });
}

/**
 * Obtiene los Estados Financieros: Estado de Resultados y Balance General.
 */
export async function fetchEstadosFinancieros({ fechaDesde, fechaHasta } = {}) {
  const cuentas = await fetchCuentasOperativas();

  const { data: lineas, error } = await supabase
    .from('lineas_asiento')
    .select(`
      id, cuenta_id, debe, haber, debe_ves, haber_ves,
      asientos_contables ( fecha )
    `);
  if (error) throw error;

  const lineasFiltradas = (lineas || []).filter((l) => {
    const fecha = l.asientos_contables?.fecha;
    if (!fecha) return false;
    if (fechaDesde && fecha < fechaDesde) return false;
    if (fechaHasta && fecha > fechaHasta) return false;
    return true;
  });

  const saldos = {};
  for (const l of lineasFiltradas) {
    if (!saldos[l.cuenta_id]) {
      saldos[l.cuenta_id] = { debe: 0, haber: 0, debeVes: 0, haberVes: 0 };
    }
    saldos[l.cuenta_id].debe += Math.round(Number(l.debe || 0) * 100);
    saldos[l.cuenta_id].haber += Math.round(Number(l.haber || 0) * 100);
    saldos[l.cuenta_id].debeVes += Math.round(Number(l.debe_ves || 0) * 100);
    saldos[l.cuenta_id].haberVes += Math.round(Number(l.haber_ves || 0) * 100);
  }

  const cuentasConSaldo = cuentas.map(c => {
    const s = saldos[c.id] || { debe: 0, haber: 0, debeVes: 0, haberVes: 0 };
    const tipo = (c.tipo || '').toUpperCase();
    const esDeudora = c.naturaleza?.toUpperCase() === 'DEUDORA' || ['ACTIVO', 'COSTO', 'GASTO'].includes(tipo);

    const saldo = esDeudora ? (s.debe - s.haber) : (s.haber - s.debe);
    const saldoVes = esDeudora ? (s.debeVes - s.haberVes) : (s.haberVes - s.debeVes);

    return {
      ...c,
      debe: s.debe / 100,
      haber: s.haber / 100,
      debeVes: s.debeVes / 100,
      haberVes: s.haberVes / 100,
      saldo: saldo / 100,
      saldoVes: saldoVes / 100,
      saldoCentimos: saldo,
      saldoVesCentimos: saldoVes,
    };
  });

  // Estado de Resultados
  const ingresos = cuentasConSaldo.filter(c => c.tipo?.toUpperCase() === 'INGRESO' && (c.debe !== 0 || c.haber !== 0));
  const costos = cuentasConSaldo.filter(c => c.tipo?.toUpperCase() === 'COSTO' && (c.debe !== 0 || c.haber !== 0));
  const gastos = cuentasConSaldo.filter(c => c.tipo?.toUpperCase() === 'GASTO' && (c.debe !== 0 || c.haber !== 0));

  const totalIngresosCent = ingresos.reduce((acc, c) => acc + c.saldoCentimos, 0);
  const totalCostosCent = costos.reduce((acc, c) => acc + c.saldoCentimos, 0);
  const utilidadBrutaCent = totalIngresosCent - totalCostosCent;

  const totalGastosCent = gastos.reduce((acc, c) => acc + c.saldoCentimos, 0);
  const utilidadNetaCent = utilidadBrutaCent - totalGastosCent;

  const totalIngresosVesCent = ingresos.reduce((acc, c) => acc + c.saldoVesCentimos, 0);
  const totalCostosVesCent = costos.reduce((acc, c) => acc + c.saldoVesCentimos, 0);
  const utilidadBrutaVesCent = totalIngresosVesCent - totalCostosVesCent;

  const totalGastosVesCent = gastos.reduce((acc, c) => acc + c.saldoVesCentimos, 0);
  const utilidadNetaVesCent = utilidadBrutaVesCent - totalGastosVesCent;

  // Balance General
  const activos = cuentasConSaldo.filter(c => c.tipo?.toUpperCase() === 'ACTIVO' && (c.debe !== 0 || c.haber !== 0));
  const pasivos = cuentasConSaldo.filter(c => c.tipo?.toUpperCase() === 'PASIVO' && (c.debe !== 0 || c.haber !== 0));
  const patrimonio = cuentasConSaldo.filter(c => c.tipo?.toUpperCase() === 'PATRIMONIO' && (c.debe !== 0 || c.haber !== 0));

  const totalActivosCent = activos.reduce((acc, c) => acc + c.saldoCentimos, 0);
  const totalPasivosCent = pasivos.reduce((acc, c) => acc + c.saldoCentimos, 0);
  const totalPatrimonioBaseCent = patrimonio.reduce((acc, c) => acc + c.saldoCentimos, 0);
  const totalPatrimonioCent = totalPatrimonioBaseCent + utilidadNetaCent;

  const totalActivosVesCent = activos.reduce((acc, c) => acc + c.saldoVesCentimos, 0);
  const totalPasivosVesCent = pasivos.reduce((acc, c) => acc + c.saldoVesCentimos, 0);
  const totalPatrimonioBaseVesCent = patrimonio.reduce((acc, c) => acc + c.saldoVesCentimos, 0);
  const totalPatrimonioVesCent = totalPatrimonioBaseVesCent + utilidadNetaVesCent;

  const totalPasivoPatrimonioCent = totalPasivosCent + totalPatrimonioCent;
  const totalPasivoPatrimonioVesCent = totalPasivosVesCent + totalPatrimonioVesCent;

  const cuadrado = Math.abs(totalActivosCent - totalPasivoPatrimonioCent) <= 1;

  return {
    estadoResultados: {
      ingresos,
      costos,
      gastos,
      totalIngresos: totalIngresosCent / 100,
      totalCostos: totalCostosCent / 100,
      utilidadBruta: utilidadBrutaCent / 100,
      totalGastos: totalGastosCent / 100,
      utilidadNeta: utilidadNetaCent / 100,
      totalIngresosVes: totalIngresosVesCent / 100,
      totalCostosVes: totalCostosVesCent / 100,
      utilidadBrutaVes: utilidadBrutaVesCent / 100,
      totalGastosVes: totalGastosVesCent / 100,
      utilidadNetaVes: utilidadNetaVesCent / 100,
    },
    balanceGeneral: {
      activos,
      pasivos,
      patrimonio,
      totalActivos: totalActivosCent / 100,
      totalPasivos: totalPasivosCent / 100,
      totalPatrimonioBase: totalPatrimonioBaseCent / 100,
      totalPatrimonio: totalPatrimonioCent / 100,
      utilidadEjercicio: utilidadNetaCent / 100,
      totalPasivoPatrimonio: totalPasivoPatrimonioCent / 100,
      totalActivosVes: totalActivosVesCent / 100,
      totalPasivosVes: totalPasivosVesCent / 100,
      totalPatrimonioBaseVes: totalPatrimonioBaseVesCent / 100,
      totalPatrimonioVes: totalPatrimonioVesCent / 100,
      utilidadEjercicioVes: utilidadNetaVesCent / 100,
      totalPasivoPatrimonioVes: totalPasivoPatrimonioVesCent / 100,
      cuadrado,
      diferencia: (totalActivosCent - totalPasivoPatrimonioCent) / 100,
    },
  };
}
