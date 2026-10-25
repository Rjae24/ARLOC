/**
 * Servicio y utilidades para Cuentas por Cobrar a Clientes.
 * 
 * Gestiona:
 * - Detección de cuentas de crédito o financiamiento por cobrar por cliente y factura.
 * - Cálculo de días transcurridos desde la emisión de la factura (salida de tienda).
 * - Configuración y aplicación de porcentaje de recargo o interés por mora después de X días.
 * - Registro de abonos / pagos parciales o totales de la deuda.
 * - Generación de mensajes para cobranza directa por WhatsApp.
 */

const STORAGE_KEY_CONFIG = 'arluc_cxc_config';
const STORAGE_KEY_ABONOS = 'arluc_cxc_abonos';

export const DEFAULT_CXC_CONFIG = {
  diasGracia: 15,          // Días a partir de los cuales se aplica el recargo
  porcentajeRecargo: 5,    // Porcentaje de recargo (%) a sumar
  aplicarRecargoAutomatico: true, // Si se calcula sugerido automáticamente
};

const STORAGE_KEY_CLIENTES_CREDITO = 'arluc_clientes_credito_config';

/**
 * Obtiene el mapa local de configuración de crédito de clientes:
 * { [clienteId]: { credito_activo: boolean, linea_credito: number, moneda_credito: string } }
 */
export function getClientesCreditoMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLIENTES_CREDITO);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer configuración local de crédito de clientes:', e);
  }
  return {};
}

/**
 * Guarda o actualiza la configuración de crédito de un cliente
 */
export function saveClienteCreditoLocal(clienteId, { linea_credito, credito_activo, moneda_credito }) {
  try {
    const map = getClientesCreditoMap();
    map[clienteId] = {
      linea_credito: parseFloat(linea_credito) || 0,
      credito_activo: !!credito_activo,
      moneda_credito: moneda_credito || 'usd',
    };
    localStorage.setItem(STORAGE_KEY_CLIENTES_CREDITO, JSON.stringify(map));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('arluc_clientes_credito_updated', { detail: map }));
    }
    return map[clienteId];
  } catch (e) {
    console.error('Error al guardar crédito local del cliente:', e);
  }
}

/**
 * Enriquece un cliente con los datos de crédito (si existen en BD o en almacenamiento local)
 */
export function mergeClienteCredito(cliente) {
  if (!cliente) return cliente;
  const map = getClientesCreditoMap();
  const local = map[cliente.id] || {};
  return {
    ...cliente,
    linea_credito: cliente.linea_credito !== undefined ? cliente.linea_credito : (local.linea_credito ?? 0),
    credito_activo: cliente.credito_activo !== undefined ? cliente.credito_activo : (local.credito_activo ?? false),
    moneda_credito: cliente.moneda_credito || local.moneda_credito || 'usd',
  };
}

/**
 * Obtiene la configuración de recargos de cuentas por cobrar
 */
export function getCxCConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return { ...DEFAULT_CXC_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error al leer configuración de CxC:', e);
  }
  return DEFAULT_CXC_CONFIG;
}

/**
 * Guarda la configuración de recargos de cuentas por cobrar
 */
export function saveCxCConfig(cfg) {
  try {
    const data = { ...DEFAULT_CXC_CONFIG, ...cfg };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('arluc_cxc_config_updated', { detail: data }));
    }
    return data;
  } catch (e) {
    console.error('Error al guardar configuración de CxC:', e);
    return DEFAULT_CXC_CONFIG;
  }
}

/**
 * Obtiene todos los abonos registrados (indexados por clave facturaId)
 * Estructura: { [facturaId]: [ { id, fecha, monto_usd, monto_bs, metodo, notas } ] }
 */
export function getAbonosCxC() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ABONOS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer abonos de CxC:', e);
  }
  return {};
}

/**
 * Guarda un nuevo abono para una factura dada
 */
export function registrarAbonoCxC(facturaId, abono) {
  try {
    const todos = getAbonosCxC();
    const listaActual = todos[facturaId] || [];
    const nuevo = {
      id: 'abono_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      fecha: new Date().toISOString(),
      ...abono,
    };
    todos[facturaId] = [...listaActual, nuevo];
    localStorage.setItem(STORAGE_KEY_ABONOS, JSON.stringify(todos));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('arluc_cxc_abonos_updated', { detail: todos }));
    }
    return nuevo;
  } catch (e) {
    console.error('Error al registrar abono en CxC:', e);
    throw e;
  }
}

/**
 * Elimina un abono registrado
 */
export function eliminarAbonoCxC(facturaId, abonoId) {
  try {
    const todos = getAbonosCxC();
    if (todos[facturaId]) {
      todos[facturaId] = todos[facturaId].filter((a) => a.id !== abonoId);
      localStorage.setItem(STORAGE_KEY_ABONOS, JSON.stringify(todos));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('arluc_cxc_abonos_updated', { detail: todos }));
      }
    }
  } catch (e) {
    console.error('Error al eliminar abono en CxC:', e);
  }
}

/**
 * Calcula los días transcurridos desde la fecha de salida/emisión
 */
export function calcularDiasTranscurridos(fechaEmision) {
  if (!fechaEmision) return 0;
  const emision = new Date(fechaEmision).getTime();
  const hoy = Date.now();
  const diffMs = hoy - emision;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Extrae y calcula el monto financiado o a crédito de una factura emitida
 */
export function extraerCreditoFactura(factura) {
  if (!factura || factura.estado === 'anulada') {
    return { tieneCredito: false, montoUSD: 0, montoBs: 0, tipo: null };
  }

  const metodos = Array.isArray(factura.metodos_pago) ? factura.metodos_pago : [];
  let creditoTotalUSD = 0;
  let creditoTotalBs = 0;
  let tipoCredito = null;

  for (const m of metodos) {
    // Solo crédito directo otorgado por la tienda a los clientes (NO Cashea)
    if (m.metodo_id === 'credito' || m.metodo === 'Crédito' || m.metodo === 'credito') {
      const u = parseFloat(m.monto_usd || 0);
      const b = parseFloat(m.monto_bs || 0);
      if (u > 0 || b > 0) {
        creditoTotalUSD += u;
        creditoTotalBs += b;
        tipoCredito = 'directo';
      }
    }
  }

  return {
    tieneCredito: creditoTotalUSD > 0,
    montoUSD: parseFloat(creditoTotalUSD.toFixed(2)),
    montoBs: parseFloat(creditoTotalBs.toFixed(2)),
    tipo: tipoCredito,
  };
}

/**
 * Construye el mensaje personalizado para WhatsApp
 */
export function generarMensajeCobroWhatsApp({ cliente, cuenta, saldoTotalUSD, saldoTotalBs, dias, recargoUSD, porcentajeRecargo, empresa }) {
  const nombreCliente = cliente?.nombre || 'Estimado(a) Cliente';
  const nombreEmpresa = empresa?.nombre || 'Comercializadora ARLUC';
  const telefonoEmpresa = empresa?.telefono ? ` al ${empresa.telefono}` : '';

  let msg = `Hola *${nombreCliente}*, le saludamos cordialmente de *${nombreEmpresa}*.\n\n`;
  msg += `Le recordamos que posee una cuenta pendiente por cobrar asociada a su compra (Factura *${cuenta.numero_factura}*).\n`;
  msg += `⏳ Han transcurrido *${dias} día(s)* desde su emisión.\n`;

  if (recargoUSD > 0) {
    msg += `⚠️ Su saldo incluye un recargo por mora del *${porcentajeRecargo}%* ($${recargoUSD.toFixed(2)} USD).\n`;
  }

  msg += `💰 *Saldo Pendiente a la fecha:* $${saldoTotalUSD.toFixed(2)} USD`;
  if (saldoTotalBs > 0) {
    msg += ` (Aprox. Bs. ${saldoTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
  }
  msg += `\n\nPor favor comuníquese con nosotros${telefonoEmpresa} para coordinar su pago o reporte de abono. ¡Muchas gracias!`;

  return encodeURIComponent(msg);
}
