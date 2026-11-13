/**
 * Utilidades para decodificar y manejar metadatos de empaques y pesaje
 * Compatible tanto si las columnas existen en la BD como mediante metadata segura en descripción.
 */

export function parseProductoMeta(producto) {
  if (!producto) return {
    unidad: 'und',
    esDetallado: false,
    esComboDetallado: false,
    padreId: null,
    detalladoOrigenId: null,
    unidadesQueConsume: 1,
    factor: 1,
    descLimpia: '',
  };

  let unidad = producto.unidad_medida || 'und';
  let esDetallado = Boolean(producto.es_detallado);
  let esComboDetallado = Boolean(producto.es_combo_detallado);
  let padreId = producto.producto_padre_id || null;
  let detalladoOrigenId = producto.detallado_origen_id || null;
  let unidadesQueConsume = parseFloat(producto.unidades_que_consume || 1) || 1;
  let factor = parseFloat(producto.factor_conversion || 1) || 1;
  let descLimpia = producto.descripcion || '';

  // Si la descripción contiene JSON de metadatos embebidos
  if (descLimpia && descLimpia.startsWith('__META__:')) {
    try {
      const jsonStr = descLimpia.slice(9);
      const splitIdx = jsonStr.indexOf('__END__');
      if (splitIdx !== -1) {
        const parsed = JSON.parse(jsonStr.slice(0, splitIdx));
        unidad = parsed.unidad || unidad;
        esDetallado = Boolean(parsed.esDetallado ?? esDetallado);
        esComboDetallado = Boolean(parsed.esComboDetallado ?? esComboDetallado);
        padreId = parsed.padreId || padreId;
        detalladoOrigenId = parsed.detalladoOrigenId || detalladoOrigenId;
        unidadesQueConsume = parseFloat(parsed.unidadesQueConsume || unidadesQueConsume) || 1;
        factor = parseFloat(parsed.factor || factor) || 1;
        descLimpia = jsonStr.slice(splitIdx + 7).trim();
      }
    } catch (e) {
      console.warn('Error parsing producto meta:', e);
    }
  }

  return {
    unidad,
    esDetallado,
    esComboDetallado,
    padreId,
    detalladoOrigenId,
    unidadesQueConsume,
    factor,
    descLimpia,
  };
}

export function encodeProductoMeta({
  unidad,
  esDetallado,
  esComboDetallado,
  padreId,
  detalladoOrigenId,
  unidadesQueConsume,
  factor,
  descripcionTexto,
}) {
  const meta = {
    unidad: unidad || 'und',
    esDetallado: Boolean(esDetallado),
    esComboDetallado: Boolean(esComboDetallado),
    padreId: padreId || null,
    detalladoOrigenId: detalladoOrigenId || null,
    unidadesQueConsume: Math.max(1, parseFloat(unidadesQueConsume || 1)),
    factor: Math.max(1, parseFloat(factor || 1)),
  };

  const texto = descripcionTexto ? descripcionTexto.trim() : '';
  return `__META__:${JSON.stringify(meta)}__END__ ${texto}`.trim();
}

