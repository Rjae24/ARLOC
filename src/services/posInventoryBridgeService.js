import { supabase } from '../lib/supabase';
import { parseProductoMeta } from '../utils/productoMetaUtils';
import { registrarMovimientoInventario } from './kardexService';

/**
 * Servicio encargado de gestionar el stock antes y durante el checkout en POS:
 * 1. Resuelve productos combo (ej: "Media Caja" que consume N unidades de "Cigarros Sueltos").
 * 2. Verifica si el producto detallado tiene suficiente stock.
 * 3. Si falta stock, realiza la APERTURA AUTOMÁTICA de cajas/empaques cerrados (Auto-Unboxing).
 * 4. Descuenta el inventario y audita cada movimiento en el Kárdex.
 */

export async function asegurarStockConAutoUnbox({
  productoId,
  cantidadRequerida,
  usuarioId = null,
}) {
  // 1. Obtener producto actual fresco de BD
  const { data: producto, error: prodErr } = await supabase
    .from('productos')
    .select('*')
    .eq('id', productoId)
    .single();

  if (prodErr || !producto) {
    throw new Error('No se pudo verificar el producto en la base de datos.');
  }

  const meta = parseProductoMeta(producto);

  // CASO A: Es un COMBO DETALLADO (Ej. Media Caja de Cigarros)
  if (meta.esComboDetallado && meta.detalladoOrigenId) {
    const unidadesTotalesNecesarias = cantidadRequerida * (meta.unidadesQueConsume || 1);
    // Recursivamente asegurar stock del producto detallado origen
    const resultadoOrigen = await asegurarStockConAutoUnbox({
      productoId: meta.detalladoOrigenId,
      cantidadRequerida: unidadesTotalesNecesarias,
      usuarioId,
    });
    return {
      productoFinal: producto,
      esCombo: true,
      detalladoOrigenId: meta.detalladoOrigenId,
      unidadesTotalesDetalladas: unidadesTotalesNecesarias,
      autoUnboxed: resultadoOrigen.autoUnboxed,
    };
  }

  // CASO B: Es un DETALLADO DIRECTO (Ej. Cigarros Sueltos)
  if (meta.esDetallado && meta.padreId) {
    const stockActualDetallado = Number(producto.stock || 0);

    // Si ya tiene suficiente stock suelto, no hay que abrir empaques
    if (stockActualDetallado >= cantidadRequerida) {
      return { productoFinal: producto, autoUnboxed: false };
    }

    // Falta stock: calcular cuántos empaques padres se deben abrir
    const faltante = cantidadRequerida - stockActualDetallado;
    const factor = Math.max(1, meta.factor || 1);
    const empaquesNecesarios = Math.ceil(faltante / factor);

    // Consultar el empaque padre
    const { data: padre, error: padreErr } = await supabase
      .from('productos')
      .select('*')
      .eq('id', meta.padreId)
      .single();

    if (padreErr || !padre) {
      throw new Error(`Stock insuficiente (${stockActualDetallado} disponibles). No se encontró el empaque cerrado para abrir.`);
    }

    const stockPadre = Number(padre.stock || 0);
    if (stockPadre < empaquesNecesarios) {
      throw new Error(
        `Stock insuficiente de ${producto.nombre}. Disponibles sueltas: ${stockActualDetallado}. ` +
        `Se necesitan abrir ${empaquesNecesarios} empaques de "${padre.nombre}", pero solo hay ${stockPadre} en almacén.`
      );
    }

    // Realizar apertura automática de empaque
    const nuevoStockPadre = stockPadre - empaquesNecesarios;
    const unidadesSumadas = empaquesNecesarios * factor;
    const nuevoStockDetallado = stockActualDetallado + unidadesSumadas;

    const [upPadre, upDetallado] = await Promise.all([
      supabase.from('productos').update({ stock: nuevoStockPadre }).eq('id', padre.id),
      supabase.from('productos').update({ stock: nuevoStockDetallado }).eq('id', producto.id),
    ]);

    if (upPadre.error || upDetallado.error) {
      throw new Error('Error al ejecutar la apertura automática de empaque en la base de datos.');
    }

    // Registrar en el Kárdex de operaciones
    await Promise.all([
      registrarMovimientoInventario({
        productoId: padre.id,
        tipo: 'apertura_empaque',
        cantidad: -empaquesNecesarios,
        stockAnterior: stockPadre,
        stockNuevo: nuevoStockPadre,
        referencia: `Apertura automática en Caja (-${empaquesNecesarios} para ${producto.nombre})`,
        usuarioId,
        detalles: { producto_detallado_id: producto.id, unidades_generadas: unidadesSumadas },
      }),
      registrarMovimientoInventario({
        productoId: producto.id,
        tipo: 'apertura_empaque',
        cantidad: unidadesSumadas,
        stockAnterior: stockActualDetallado,
        stockNuevo: nuevoStockDetallado,
        referencia: `Apertura automática (+${unidadesSumadas} desde ${padre.nombre})`,
        usuarioId,
        detalles: { empaques_abiertos: empaquesNecesarios, padre_id: padre.id },
      }),
    ]);

    producto.stock = nuevoStockDetallado;
    return {
      productoFinal: producto,
      autoUnboxed: true,
      mensaje: `¡Se abrió automáticamente ${empaquesNecesarios} caja(s) de "${padre.nombre}" (+${unidadesSumadas} sueltas)!`,
    };
  }

  // CASO C: Producto estándar
  if (Number(producto.stock || 0) < cantidadRequerida) {
    throw new Error(`Stock insuficiente de ${producto.nombre}. Disponible: ${producto.stock}`);
  }

  return { productoFinal: producto, autoUnboxed: false };
}

