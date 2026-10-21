import {
  HiOutlineHome,
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiOutlineCog6Tooth,
  HiOutlineBookOpen,
  HiOutlineBuildingStorefront,
} from 'react-icons/hi2';

/**
 * Estructura de departamentos y módulos del ERP ARLUC.
 * - Los elementos individuales (Dashboard, Inventario) son enlaces directos sin acordeón.
 * - Los departamentos con múltiples funciones (Ventas, Compras, Contabilidad, etc.) se despliegan de forma ramificada.
 */
export const adminNavigationGroups = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: HiOutlineHome,
    to: '/dashboard',
  },
  {
    id: 'ventas',
    label: 'Ventas y Facturación',
    icon: HiOutlineShoppingCart,
    items: [
      { to: '/pos', label: 'Punto de Venta (Caja)' },
      { to: '/historial', label: 'Historial de Facturas' },
      { to: '/clientes', label: 'Directorio de Clientes' },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: HiOutlineCube,
    to: '/inventario',
  },
  {
    id: 'compras',
    label: 'Compras y Proveedores',
    icon: HiOutlineTruck,
    items: [
      { to: '/proveedores', label: 'Proveedores' },
      { to: '/ordenes-compra', label: 'Órdenes de Compra' },
    ],
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad General',
    icon: HiOutlineBookOpen,
    items: [
      { to: '/contabilidad/libro-diario', label: 'Libro Diario' },
      { to: '/contabilidad/libro-mayor', label: 'Libro Mayor' },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas y Tesorería',
    icon: HiOutlineCurrencyDollar,
    items: [
      { to: '/tasa-cambio', label: 'Tasa de Cambio' },
      { to: '/reportes', label: 'Reportes Financieros' },
    ],
  },
  {
    id: 'administracion',
    label: 'Administración',
    icon: HiOutlineCog6Tooth,
    items: [
      { to: '/usuarios', label: 'Gestión de Usuarios' },
      { to: '/configuracion', label: 'Configuración Empresa' },
    ],
  },
];

export const vendedorNavigationGroups = [
  {
    id: 'dashboard',
    label: 'Mi Dashboard',
    icon: HiOutlineHome,
    to: '/dashboard',
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: HiOutlineBuildingStorefront,
    items: [
      { to: '/pos', label: 'Punto de Venta (Caja)' },
      { to: '/clientes', label: 'Clientes' },
    ],
  },
];
