export function procesarCierreCaja(facturasEmitidas, tasaRef = 1) {
  const cierre = {
    // 1. Dinero físico en tienda
    efectivoUSD: { label: 'Efectivo USD (Gaveta)', total_usd: 0, total_bs: 0, transacciones: 0 },
    efectivoBs:  { label: 'Efectivo Bs (Gaveta)',  total_usd: 0, total_bs: 0, transacciones: 0 },
    
    // 2. Bancos en Bolívares
    puntoVenta:    { label: 'Punto de Venta',         total_usd: 0, total_bs: 0, transacciones: 0 },
    pagoMovil:     { label: 'Pago Móvil',            total_usd: 0, total_bs: 0, transacciones: 0 },
    transferencia: { label: 'Transferencia Bancaria', total_usd: 0, total_bs: 0, transacciones: 0 },
    
    // 3. Moneda Digital
    zelle: { label: 'Zelle (USD Digital)', total_usd: 0, total_bs: 0, transacciones: 0 },
    
    // 4. Crédito / Fiado (Cuentas por Cobrar)
    credito: { label: 'Crédito / Fiado (Por Cobrar)', total_usd: 0, total_bs: 0, transacciones: 0 },
    
    // Otros
    otros: { label: 'Otros Métodos', total_usd: 0, total_bs: 0, transacciones: 0 },
  };

  facturasEmitidas.forEach(f => {
    const fTasa = (parseFloat(f.total_usd) > 0 && parseFloat(f.total_bs) > 0)
      ? (parseFloat(f.total_bs) / parseFloat(f.total_usd))
      : tasaRef;

    (f.metodos_pago || []).forEach(mp => {
      const id = (mp.metodo_id || mp.id || '').toLowerCase();
      const nombre = (mp.metodo || mp.label || '').toLowerCase();

      const mUSD = parseFloat(mp.monto_usd || 0);
      const mBs  = parseFloat(mp.monto_bs || (mUSD * fTasa).toFixed(2));

      // Crédito / Fiado
      if (id === 'credito' || id === 'fiado' || nombre.includes('crédito') || nombre.includes('credito') || nombre.includes('fiado')) {
        cierre.credito.total_usd += mUSD;
        cierre.credito.total_bs  += mBs;
        cierre.credito.transacciones += 1;
      } else if (id === 'efectivo_usd' || nombre.includes('efectivo usd') || nombre === 'efectivo $') {
        cierre.efectivoUSD.total_usd += mUSD;
        cierre.efectivoUSD.total_bs  += mBs;
        cierre.efectivoUSD.transacciones += 1;
      } else if (id === 'efectivo_bs' || nombre.includes('efectivo bs')) {
        cierre.efectivoBs.total_usd += mUSD;
        cierre.efectivoBs.total_bs  += mBs;
        cierre.efectivoBs.transacciones += 1;
      } else if (id === 'punto_venta' || nombre.includes('punto')) {
        cierre.puntoVenta.total_usd += mUSD;
        cierre.puntoVenta.total_bs  += mBs;
        cierre.puntoVenta.transacciones += 1;
      } else if (id === 'pago_movil' || nombre.includes('pago')) {
        cierre.pagoMovil.total_usd += mUSD;
        cierre.pagoMovil.total_bs  += mBs;
        cierre.pagoMovil.transacciones += 1;
      } else if (id === 'zelle' || nombre.includes('zelle')) {
        cierre.zelle.total_usd += mUSD;
        cierre.zelle.total_bs  += mBs;
        cierre.zelle.transacciones += 1;
      } else if (id === 'transferencia' || nombre.includes('transferencia')) {
        cierre.transferencia.total_usd += mUSD;
        cierre.transferencia.total_bs  += mBs;
        cierre.transferencia.transacciones += 1;
      } else {
        cierre.otros.total_usd += mUSD;
        cierre.otros.total_bs  += mBs;
        cierre.otros.transacciones += 1;
      }
    });
  });

  const totalBancoBs = cierre.puntoVenta.total_bs + cierre.pagoMovil.total_bs + cierre.transferencia.total_bs;
  const totalBancoUSD_equiv = cierre.puntoVenta.total_usd + cierre.pagoMovil.total_usd + cierre.transferencia.total_usd;

  const totalEfectivoUSD = cierre.efectivoUSD.total_usd;
  const totalEfectivoBs  = cierre.efectivoBs.total_bs;
  const totalZelleUSD    = cierre.zelle.total_usd;
  const totalCreditoUSD  = cierre.credito.total_usd;
  const totalCreditoBs   = cierre.credito.total_bs;

  // Total recaudado líquido (dinero cobrado en mano o en banco, excluyendo crédito pendiente de cobro)
  const totalRecaudadoUSD = totalEfectivoUSD + totalBancoUSD_equiv + totalZelleUSD + cierre.efectivoBs.total_usd + cierre.otros.total_usd;
  const totalRecaudadoBs  = totalEfectivoBs + totalBancoBs + cierre.zelle.total_bs + cierre.efectivoUSD.total_bs + cierre.otros.total_bs;

  return {
    ...cierre,
    totalBancoBs,
    totalBancoUSD_equiv,
    totalEfectivoUSD,
    totalEfectivoBs,
    totalZelleUSD,
    totalCreditoUSD,
    totalCreditoBs,
    totalRecaudadoUSD,
    totalRecaudadoBs,
  };
}

