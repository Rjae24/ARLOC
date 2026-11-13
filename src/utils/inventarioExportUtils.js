import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { parseProductoMeta } from './productoMetaUtils';

/**
 * Exporta el catálogo completo de productos a un archivo Excel (.xlsx)
 * con precios en USD y en Bolívares según la tasa del día.
 */
export function exportarInventarioAExcel({ productos = [], tasaActual = null }) {
  if (!productos || productos.length === 0) {
    toast.error('No hay productos para exportar');
    return;
  }

  try {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const tasa = tasaActual ? parseFloat(tasaActual) : 0;

    const rows = productos.map((p) => {
      const meta = parseProductoMeta(p);
      const precioUSD = parseFloat(p.precio_usd || 0);
      const precioBs = tasa > 0 ? parseFloat((precioUSD * tasa).toFixed(2)) : 0;

      let tipoStr = 'Unidad';
      let stockVisual = p.stock;
      if (meta.esComboDetallado) {
        tipoStr = `Combo (x${meta.unidadesQueConsume})`;
        const prodOrigen = productos.find((x) => x.id === meta.detalladoOrigenId);
        stockVisual = Math.floor(Number(prodOrigen?.stock || 0) / (meta.unidadesQueConsume || 1));
      } else if (meta.esDetallado) {
        tipoStr = `Detallado (F:${meta.factor})`;
      } else if (meta.unidad === 'kg') {
        tipoStr = 'Peso (Kg)';
      }

      return {
        'SKU / Código': p.sku,
        'Nombre del Producto': p.nombre,
        'Categoría': p.categorias?.nombre || 'Sin categoría',
        'Tipo de Producto': tipoStr,
        'Stock Actual': stockVisual,
        'Precio USD': precioUSD,
        'Tasa BCV': tasa,
        'Precio en Bs': precioBs,
        'Estado': p.activo ? 'Activo' : 'Inactivo',
        'Stock Mínimo': p.stock_minimo,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario y Precios');

    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 35 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
    ];

    XLSX.writeFile(workbook, `Lista_Precios_Inventario_ARLUC_${fechaHoy}.xlsx`);
    toast.success('Lista de precios exportada en Excel con éxito');
  } catch (err) {
    console.error('Error al exportar inventario a Excel:', err);
    toast.error('Ocurrió un error al generar el archivo Excel');
  }
}
