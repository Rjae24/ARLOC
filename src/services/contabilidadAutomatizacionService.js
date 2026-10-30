import { supabase, supabaseAdmin } from '../lib/supabase';

// Mapa de cuentas operativas del PUC
export const CUENTAS_CONTABLES = {
  CAJA_GENERAL: '346c888a-3a5b-4c54-99c1-1f4cca4d6582', // 1.1.01.01
  BANCO_NACIONAL: '299d6221-c99f-406a-8870-7197a46a32bf', // 1.1.02.01
  BANCO_INTERNACIONAL: '7d85bb8a-a5a1-4dbe-8f3d-82fe894f5b25', // 1.1.02.02
  CXC_CLIENTES: '3849b491-f3ce-4031-9934-cba592c76805', // 1.1.03.01
  VENTAS_MERCANCIAS: '5324a727-0911-4741-a4d6-931fc1f9f5d6', // 4.1.01.01
};

/**
 * Genera el siguiente correlativo para asientos contables
 */
async function obtenerSiguienteNumeroAsiento(fecha) {
  const anio = (fecha ? new Date(fecha) : new Date()).getFullYear();
  const { data: ultimos } = await supabaseAdmin
    .from('asientos_contables')
    .select('numero')
    .order('created_at', { ascending: false })
    .limit(1);

  let correlativo = 1;
  if (ultimos && ultimos.length > 0 && ultimos[0].numero) {
    const match = ultimos[0].numero.match(/(\d+)$/);
    if (match) correlativo = parseInt(match[1], 10) + 1;
  }
  return `AST-${anio}-${String(correlativo).padStart(5, '0')}`;
}

/**
 * Contabiliza automáticamente una venta emitida en el POS en tiempo real
 */
export async function contabilizarVentaEnTiempoReal({ factura, metodosPago, tasa }) {
  try {
    if (!factura || !factura.id) return null;

    const fechaObj = new Date(factura.fecha_emision || new Date());
    const fechaStr = fechaObj.toISOString().slice(0, 10);
    const totalUSD = parseFloat(factura.total_usd || 0);
    const fTasa = parseFloat(tasa || factura.tasa?.tasa_usd_bs || 876.8);

    const numeroAsiento = await obtenerSiguienteNumeroAsiento(fechaStr);
    const nombreCliente = factura.cliente?.nombre || factura.clientes?.nombre || 'Consumidor Final';

    // Desglose de débitos según métodos de pago
    const debitos = [];
    const metodos = Array.isArray(metodosPago) ? metodosPago : [];

    metodos.forEach((mp) => {
      const id = (mp.metodo_id || mp.id || '').toLowerCase();
      const nombre = (mp.metodo || mp.label || '').toLowerCase();
      const mUSD = parseFloat(mp.monto_usd || 0);
      const mBs = parseFloat(mp.monto_bs || (mUSD * fTasa).toFixed(2));

      if (id === 'cashea' || nombre.includes('cashea')) {
        const inicialUSD = parseFloat(mp.inicial_usd ?? mp.monto_usd ?? 0);
        const inicialBs = parseFloat(mp.inicial_bs ?? (inicialUSD * fTasa).toFixed(2));
        const canalInicial = (mp.cashea_metodo_inicial || '').toLowerCase();

        if (inicialUSD > 0) {
          const cuentaInicial = (canalInicial.includes('efectivo') || canalInicial.includes('usd'))
            ? CUENTAS_CONTABLES.CAJA_GENERAL
            : CUENTAS_CONTABLES.BANCO_NACIONAL;
          debitos.push({ cuenta_id: cuentaInicial, debe: inicialUSD, debe_ves: inicialBs });
        }

        const financiadoUSD = parseFloat(mp.credito_cashea_usd || 0);
        const financiadoBs = parseFloat(mp.credito_cashea_bs || (financiadoUSD * fTasa).toFixed(2));
        if (financiadoUSD > 0) {
          debitos.push({ cuenta_id: CUENTAS_CONTABLES.CXC_CLIENTES, debe: financiadoUSD, debe_ves: financiadoBs });
        }
      } else if (id === 'credito' || nombre.includes('crédito') || nombre.includes('credito')) {
        debitos.push({ cuenta_id: CUENTAS_CONTABLES.CXC_CLIENTES, debe: mUSD, debe_ves: mBs });
      } else if (id === 'zelle' || nombre.includes('zelle')) {
        debitos.push({ cuenta_id: CUENTAS_CONTABLES.BANCO_INTERNACIONAL, debe: mUSD, debe_ves: mBs });
      } else if (id === 'efectivo_usd' || id === 'efectivo_bs' || nombre.includes('efectivo')) {
        debitos.push({ cuenta_id: CUENTAS_CONTABLES.CAJA_GENERAL, debe: mUSD, debe_ves: mBs });
      } else {
        debitos.push({ cuenta_id: CUENTAS_CONTABLES.BANCO_NACIONAL, debe: mUSD, debe_ves: mBs });
      }
    });

    if (debitos.length === 0) {
      debitos.push({
        cuenta_id: CUENTAS_CONTABLES.CAJA_GENERAL,
        debe: totalUSD,
        debe_ves: parseFloat((totalUSD * fTasa).toFixed(2)),
      });
    }

    // Consolidar débitos por cuenta
    const mapaDebitos = {};
    debitos.forEach((d) => {
      if (!mapaDebitos[d.cuenta_id]) mapaDebitos[d.cuenta_id] = { debe: 0, debe_ves: 0 };
      mapaDebitos[d.cuenta_id].debe += d.debe;
      mapaDebitos[d.cuenta_id].debe_ves += d.debe_ves;
    });

    const lineasAsiento = [];
    let sumaDebeUSD = 0;
    let sumaDebeBs = 0;

    Object.entries(mapaDebitos).forEach(([cuentaId, montos]) => {
      const dUSD = parseFloat(montos.debe.toFixed(2));
      const dBs = parseFloat(montos.debe_ves.toFixed(2));
      sumaDebeUSD += dUSD;
      sumaDebeBs += dBs;
      lineasAsiento.push({
        cuenta_id: cuentaId,
        debe: dUSD,
        haber: 0,
        debe_ves: dBs,
        haber_ves: 0,
      });
    });

    // Crédito a Ventas de Mercancías
    const haberUSD = parseFloat(sumaDebeUSD.toFixed(2));
    const haberBs = parseFloat(sumaDebeBs.toFixed(2));

    lineasAsiento.push({
      cuenta_id: CUENTAS_CONTABLES.VENTAS_MERCANCIAS,
      debe: 0,
      haber: haberUSD,
      debe_ves: 0,
      haber_ves: haberBs,
    });

    // Insertar Asiento
    const { data: asiento, error: aErr } = await supabaseAdmin
      .from('asientos_contables')
      .insert([{
        numero: numeroAsiento,
        fecha: fechaStr,
        glosa: `Venta s/Factura #${factura.numero_factura} (${nombreCliente})`,
        modulo: 'Ventas',
        total_debe: haberUSD,
        total_haber: haberUSD,
        tasa_cambio: fTasa,
      }])
      .select('id, numero')
      .single();

    if (aErr) throw aErr;

    // Insertar Líneas
    const lineasPayload = lineasAsiento.map((l) => ({
      asiento_id: asiento.id,
      cuenta_id: l.cuenta_id,
      debe: l.debe,
      haber: l.haber,
      debe_ves: l.debe_ves,
      haber_ves: l.haber_ves,
    }));

    const { error: lErr } = await supabaseAdmin.from('lineas_asiento').insert(lineasPayload);
    if (lErr) throw lErr;

    return asiento;
  } catch (error) {
    console.error('Error al contabilizar venta automática en tiempo real:', error);
    return null;
  }
}

/**
 * Contabiliza automáticamente un abono de cobranza en tiempo real
 */
export async function contabilizarAbonoEnTiempoReal({ facturaId, abono, tasa }) {
  try {
    if (!abono || !abono.monto_usd) return null;

    const fechaObj = new Date(abono.fecha || new Date());
    const fechaStr = fechaObj.toISOString().slice(0, 10);
    const mUSD = parseFloat(abono.monto_usd || 0);
    const fTasa = parseFloat(tasa || 876.8);
    const mBs = parseFloat(abono.monto_bs || (mUSD * fTasa).toFixed(2));

    if (mUSD <= 0) return null;

    const numeroAsiento = await obtenerSiguienteNumeroAsiento(fechaStr);
    const metodo = (abono.metodo || '').toLowerCase();
    const cuentaDestino = (metodo.includes('efectivo') || metodo.includes('usd'))
      ? CUENTAS_CONTABLES.CAJA_GENERAL
      : CUENTAS_CONTABLES.BANCO_NACIONAL;

    const { data: asiento, error: aErr } = await supabaseAdmin
      .from('asientos_contables')
      .insert([{
        numero: numeroAsiento,
        fecha: fechaStr,
        glosa: `Abono de Cobranza s/Factura ${facturaId?.slice(0, 8) || ''} - ${abono.metodo || 'Abono'}`,
        modulo: 'Tesorería',
        total_debe: mUSD,
        total_haber: mUSD,
        tasa_cambio: fTasa,
      }])
      .select('id, numero')
      .single();

    if (aErr) throw aErr;

    // Débito a Caja o Banco, Crédito a CxC Clientes
    const lineas = [
      {
        asiento_id: asiento.id,
        cuenta_id: cuentaDestino,
        debe: mUSD,
        haber: 0,
        debe_ves: mBs,
        haber_ves: 0,
      },
      {
        asiento_id: asiento.id,
        cuenta_id: CUENTAS_CONTABLES.CXC_CLIENTES,
        debe: 0,
        haber: mUSD,
        debe_ves: 0,
        haber_ves: mBs,
      },
    ];

    const { error: lErr } = await supabaseAdmin.from('lineas_asiento').insert(lineas);
    if (lErr) throw lErr;

    return asiento;
  } catch (error) {
    console.error('Error al contabilizar abono en tiempo real:', error);
    return null;
  }
}

