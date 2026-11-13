/**
 * Utilidades para guardar y extraer la lista de IDs de productos
 * que despacha cada proveedor sin romper el esquema de base de datos.
 */

const PROV_META_TAG = '__PROV_PRODS__:';
const PROV_META_END = '__END_PROV__';

export function parseProveedorProductos(proveedor) {
  if (!proveedor) return [];
  // Si en la base de datos existiera directamente la columna
  if (Array.isArray(proveedor.productos_ids)) {
    return proveedor.productos_ids;
  }
  // Si viene en direccion
  const str = proveedor.direccion || '';
  if (str.includes(PROV_META_TAG)) {
    try {
      const match = str.match(new RegExp(`${PROV_META_TAG}(.*?)${PROV_META_END}`));
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
    } catch (e) {
      console.warn('Error al parsear productos de proveedor:', e);
    }
  }
  return [];
}

export function getDireccionLimpia(direccionRaw) {
  if (!direccionRaw) return '';
  return direccionRaw.replace(new RegExp(`${PROV_META_TAG}.*?${PROV_META_END}`, 'g'), '').trim();
}

export function encodeProveedorDireccion(direccionLimpia, productosIds = []) {
  const dir = (direccionLimpia || '').trim();
  if (!Array.isArray(productosIds) || productosIds.length === 0) {
    return dir;
  }
  const metaStr = `${PROV_META_TAG}${JSON.stringify(productosIds)}${PROV_META_END}`;
  return dir ? `${dir}\n${metaStr}` : metaStr;
}
