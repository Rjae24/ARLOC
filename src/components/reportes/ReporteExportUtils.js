import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { formatFecha } from '../../utils/formatters';

export function exportarVentasExcel({
  facturasEmitidas,
  totalUSD,
  totalBs,
  fechaDesde,
  fechaHasta,
  cierreCaja,
  topProductos,
  listaVendedores,
}) {
  if (!facturasEmitidas.length) {
    toast.error('No hay ventas en este rango para exportar');
    return;
  }

  const wb = XLSX.utils.book_new();

  // Hoja 1: Ventas Detalladas con Artículos
  const filasVentas = [];
  facturasEmitidas.forEach(f => {
    const articulosStr = (f.detalles_factura || [])
      .map(d => `${d.cantidad}x ${d.producto_nombre} ($${d.subtotal_usd || 0})`)
      .join(', ');

    const metodosStr = (f.metodos_pago || [])
      .map(m => `${m.metodo || m.label || 'Método'}: $${m.monto_usd}`)
      .join(' | ');

    filasVentas.push({
      'N° Factura': f.numero_factura,
      'Fecha y Hora': formatFecha(f.fecha_emision, true),
      'Cliente': f.clientes?.nombre || 'Consumidor Final',
      'C.I. / RIF': f.clientes?.documento_identidad || 'N/A',
      'Vendedor': f.usuarios?.nombre_completo || 'N/A',
      'Artículos Vendidos': articulosStr || 'Detalle no disponible',
      'Total USD': parseFloat(f.total_usd || 0),
      'Total Bs': parseFloat(f.total_bs || 0),
      'Métodos de Pago': metodosStr,
      'Estado': f.estado || 'emitida',
    });
  });

  // Fila resumen de totales
  filasVentas.push({
    'N° Factura': 'TOTALES',
    'Fecha y Hora': '',
    'Cliente': '',
    'C.I. / RIF': '',
    'Vendedor': `${facturasEmitidas.length} facturas`,
    'Artículos Vendidos': '',
    'Total USD': parseFloat(totalUSD.toFixed(2)),
    'Total Bs': parseFloat(totalBs.toFixed(2)),
    'Métodos de Pago': '',
    'Estado': '',
  });

  const wsVentas = XLSX.utils.json_to_sheet(filasVentas);
  wsVentas['!cols'] = [
    { wch: 18 }, // Factura
    { wch: 22 }, // Fecha y Hora
    { wch: 28 }, // Cliente
    { wch: 16 }, // Documento
    { wch: 22 }, // Vendedor
    { wch: 45 }, // Artículos
    { wch: 14 }, // Total USD
    { wch: 18 }, // Total Bs
    { wch: 38 }, // Métodos
    { wch: 12 }, // Estado
  ];
  XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas Detalladas');

  // Hoja 2: Cierre y Arqueo de Caja (Bodeguita)
  const filasArqueo = [
    {
      'Categoría': 'EFECTIVO EN GAVETA (FÍSICO)',
      'Canal / Método': 'Efectivo USD',
      'Monto Moneda Origen': parseFloat(cierreCaja.efectivoUSD.total_usd.toFixed(2)),
      'Moneda': 'USD ($)',
      'Equivalente Ref': parseFloat(cierreCaja.efectivoUSD.total_bs.toFixed(2)),
      'Moneda Ref': 'Bs',
      'Operaciones': cierreCaja.efectivoUSD.transacciones,
    },
    {
      'Categoría': 'EFECTIVO EN GAVETA (FÍSICO)',
      'Canal / Método': 'Efectivo Bolívares',
      'Monto Moneda Origen': parseFloat(cierreCaja.efectivoBs.total_bs.toFixed(2)),
      'Moneda': 'Bs',
      'Equivalente Ref': parseFloat(cierreCaja.efectivoBs.total_usd.toFixed(2)),
      'Moneda Ref': 'USD ($)',
      'Operaciones': cierreCaja.efectivoBs.transacciones,
    },
    {
      'Categoría': 'BANCO NACIONAL (BOLÍVARES)',
      'Canal / Método': 'Punto de Venta',
      'Monto Moneda Origen': parseFloat(cierreCaja.puntoVenta.total_bs.toFixed(2)),
      'Moneda': 'Bs',
      'Equivalente Ref': parseFloat(cierreCaja.puntoVenta.total_usd.toFixed(2)),
      'Moneda Ref': 'USD ($)',
      'Operaciones': cierreCaja.puntoVenta.transacciones,
    },
    {
      'Categoría': 'BANCO NACIONAL (BOLÍVARES)',
      'Canal / Método': 'Pago Móvil',
      'Monto Moneda Origen': parseFloat(cierreCaja.pagoMovil.total_bs.toFixed(2)),
      'Moneda': 'Bs',
      'Equivalente Ref': parseFloat(cierreCaja.pagoMovil.total_usd.toFixed(2)),
      'Moneda Ref': 'USD ($)',
      'Operaciones': cierreCaja.pagoMovil.transacciones,
    },
    {
      'Categoría': 'BANCO NACIONAL (BOLÍVARES)',
      'Canal / Método': 'Transferencia Bancaria',
      'Monto Moneda Origen': parseFloat(cierreCaja.transferencia.total_bs.toFixed(2)),
      'Moneda': 'Bs',
      'Equivalente Ref': parseFloat(cierreCaja.transferencia.total_usd.toFixed(2)),
      'Moneda Ref': 'USD ($)',
      'Operaciones': cierreCaja.transferencia.transacciones,
    },
    {
      'Categoría': 'BANCO INTERNACIONAL (DIGITAL)',
      'Canal / Método': 'Zelle',
      'Monto Moneda Origen': parseFloat(cierreCaja.zelle.total_usd.toFixed(2)),
      'Moneda': 'USD ($)',
      'Equivalente Ref': parseFloat(cierreCaja.zelle.total_bs.toFixed(2)),
      'Moneda Ref': 'Bs',
      'Operaciones': cierreCaja.zelle.transacciones,
    },
    {
      'Categoría': 'CRÉDITO / FIADO (POR COBRAR)',
      'Canal / Método': 'Ventas a Crédito (Cuentas por Cobrar)',
      'Monto Moneda Origen': parseFloat(cierreCaja.credito.total_usd.toFixed(2)),
      'Moneda': 'USD ($)',
      'Equivalente Ref': parseFloat(cierreCaja.credito.total_bs.toFixed(2)),
      'Moneda Ref': 'Bs',
      'Operaciones': cierreCaja.credito.transacciones,
    },
    {
      'Categoría': 'TOTALES DEL CIERRE',
      'Canal / Método': 'TOTAL RECAUDADO EN CAJA Y BANCO',
      'Monto Moneda Origen': parseFloat(cierreCaja.totalRecaudadoUSD.toFixed(2)),
      'Moneda': 'USD ($)',
      'Equivalente Ref': parseFloat(cierreCaja.totalRecaudadoBs.toFixed(2)),
      'Moneda Ref': 'Bs',
      'Operaciones': facturasEmitidas.length,
    },
    {
      'Categoría': 'TOTALES DEL CIERRE',
      'Canal / Método': 'TOTAL GENERAL FACTURADO (INC. CRÉDITOS)',
      'Monto Moneda Origen': parseFloat(totalUSD.toFixed(2)),
      'Moneda': 'USD ($)',
      'Equivalente Ref': parseFloat(totalBs.toFixed(2)),
      'Moneda Ref': 'Bs',
      'Operaciones': facturasEmitidas.length,
    },
  ];

  const wsArqueo = XLSX.utils.json_to_sheet(filasArqueo);
  wsArqueo['!cols'] = [
    { wch: 32 },
    { wch: 38 },
    { wch: 20 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsArqueo, 'Cierre y Arqueo Caja');

  // Hoja 3: Top Productos
  if (topProductos?.length > 0) {
    const filasTop = topProductos.map((p, idx) => ({
      'Puesto': `#${idx + 1}`,
      'Producto': p.nombre,
      'Unidades Vendidas': p.cantidad,
      'Total USD Generado': parseFloat(p.total_usd.toFixed(2)),
    }));
    const wsTop = XLSX.utils.json_to_sheet(filasTop);
    wsTop['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsTop, 'Top Productos');
  }

  // Hoja 4: Rendimiento Vendedores
  if (listaVendedores?.length > 0) {
    const filasVend = listaVendedores.map((v, idx) => ({
      'Puesto': `#${idx + 1}`,
      'Vendedor': v.nombre,
      'Facturas Emitidas': v.facturas,
      'Total USD': parseFloat(v.total_usd.toFixed(2)),
      'Total Bs': parseFloat(v.total_bs.toFixed(2)),
    }));
    const wsVend = XLSX.utils.json_to_sheet(filasVend);
    wsVend['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 18 }, { wch: 16 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsVend, 'Por Vendedor');
  }

  XLSX.writeFile(wb, `Reporte_Ventas_Bodega_${fechaDesde}_al_${fechaHasta}.xlsx`);
  toast.success('Reporte Excel (.xlsx) descargado correctamente');
}

export function exportarInventarioExcel({ inventario, tasaBsRef }) {
  if (!inventario?.length) {
    toast.error('No hay datos de inventario para exportar');
    return;
  }

  const datosInventario = inventario.map(p => {
    const vUSD = p.stock * parseFloat(p.precio_usd || 0);
    const vBs = vUSD * tasaBsRef;
    return {
      'SKU': p.sku || 'N/A',
      'Producto': p.nombre || 'Sin nombre',
      'Categoría': p.categorias?.nombre || 'General',
      'Precio USD': parseFloat(p.precio_usd || 0),
      'Stock Actual': p.stock,
      'Stock Mínimo': p.stock_minimo,
      'Valor Total USD': parseFloat(vUSD.toFixed(2)),
      'Valor Total Bs': parseFloat(vBs.toFixed(2)),
      'Estado': p.stock <= p.stock_minimo ? 'CRÍTICO' : 'NORMAL',
    };
  });

  const ws = XLSX.utils.json_to_sheet(datosInventario);
  ws['!cols'] = [
    { wch: 15 },
    { wch: 38 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

  const fechaStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Inventario_Bodega_${fechaStr}.xlsx`);
  toast.success('Inventario Excel (.xlsx) descargado correctamente');
}

