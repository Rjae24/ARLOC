// Métodos de pago adaptados para Bodeguita / Comercio Rápido
export const METODOS_PAGO = [
  { id: 'efectivo_usd', label: 'Efectivo Divisa ($)', enBs: false },
  { id: 'efectivo_bs', label: 'Efectivo Bolívares (Bs)', enBs: true },
  { id: 'pago_movil', label: 'Pago Móvil', enBs: true, requiereReferencia: true },
  { id: 'punto_venta', label: 'Punto de Venta', enBs: true, requiereReferencia: true },
  { id: 'transferencia', label: 'Transferencia Bancaria', enBs: true, requiereReferencia: true },
  { id: 'zelle', label: 'Zelle', enBs: false, isZelle: true },
  { id: 'credito', label: 'Fiado / Crédito', enBs: false, isCredito: true },
];

// Métodos auxiliares compatibles
export const METODOS_INICIAL_CASHEA = [];

// Roles del sistema
export const ROLES = {
  ADMIN: 'admin',
  VENDEDOR: 'vendedor',
};

// Estados de factura
export const ESTADOS_FACTURA = {
  EMITIDA: 'emitida',
  ANULADA: 'anulada',
};

// Estados de orden de compra
export const ESTADOS_ORDEN = {
  PENDIENTE: 'pendiente',
  RECIBIDA: 'recibida',
  CANCELADA: 'cancelada',
};

// Configuración de impresión
export const PRINT_WIDTHS = {
  '58mm': { width: '58mm', chars: 32, pixelWidth: '164px' },
  '80mm': { width: '80mm', chars: 48, pixelWidth: '302px' },
};

// Configuración por defecto de la empresa
export const DEFAULT_EMPRESA = {
  nombre: 'MI BODEGUITA C.A.',
  rif: 'J-50123456-7',
  direccion: 'Calle Principal, Local Comercial',
  telefono: '0414-0000000',
  logo: '/logo-arluc.jpg',
  slogan: '¡Gracias por su compra, vuelva pronto!',
};

export function getEmpresaConfig() {
  try {
    const saved = localStorage.getItem('arluc_empresa_config') || localStorage.getItem('dj7_empresa_config');
    if (saved) {
      return { ...DEFAULT_EMPRESA, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error leyendo config de empresa:', e);
  }
  return DEFAULT_EMPRESA;
}

export function saveEmpresaConfig(config) {
  try {
    localStorage.setItem('arluc_empresa_config', JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('arluc_empresa_config_updated', { detail: config }));
      window.dispatchEvent(new CustomEvent('dj7_empresa_config_updated', { detail: config }));
    }
  } catch (e) {
    console.error('Error guardando config de empresa:', e);
  }
}
