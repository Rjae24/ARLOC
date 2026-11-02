/**
 * Utilidades para decodificar y manejar metadatos de empaques y pesaje
 * Compatible tanto si las columnas existen en la BD como mediante metadata segura en descripción.
 */

export function parseProductoMeta(producto) {
  if (!producto) return { unidad: 'und', esDetallado: false, padreId: null, factor: 1, descLimpia: '' };

  let unidad = producto.unidad_medida || 'und';
  let esDetallado = Boolean(producto.es_detallado);
  let padreId = producto.producto_padre_id || null;
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
        padreId = parsed.padreId || padreId;
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
    padreId,
    factor,
    descLimpia,
  };
}

export function encodeProductoMeta({ unidad, esDetallado, padreId, factor, descripcionTexto }) {
  const meta = {
    unidad: unidad || 'und',
    esDetallado: Boolean(esDetallado),
    padreId: padreId || null,
    factor: Math.max(1, parseFloat(factor || 1)),
  };

  const texto = descripcionTexto ? descripcionTexto.trim() : '';
  return `__META__:${JSON.stringify(meta)}__END__ ${texto}`.trim();
}

