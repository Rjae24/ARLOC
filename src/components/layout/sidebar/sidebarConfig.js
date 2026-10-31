import {
  HiOutlineHome,
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiOutlineCog6Tooth,
  HiOutlineBuildingStorefront,
} from 'react-icons/hi2';

/**
 * Estructura de departamentos y módulos para la versión Bodeguita.
 * - Enfocado en operación rápida: Caja (POS), Historial, Clientes, Cuentas por Cobrar (Fiados).
 * - Inventario directo y ágil.
 * - Proveedores y Tasa de Cambio del día.
 * - Sin sobrecarga contable innecesaria.
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
    label: 'Ventas y Caja',
    icon: HiOutlineShoppingCart,
    items: [
      { to: '/pos', label: 'Punto de Venta (Caja)' },
      { to: '/historial', label: 'Historial de Ventas' },
      { to: '/clientes', label: 'Directorio de Clientes' },
      { to: '/cuentas-por-cobrar', label: 'Control de Fiados (CxC)' },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventario de Productos',
    icon: HiOutlineCube,
    to: '/inventario',
  },
  {
    id: 'compras',
    label: 'Proveedores',
    icon: HiOutlineTruck,
    items: [
      { to: '/proveedores', label: 'Directorio Proveedores' },
      { to: '/ordenes-compra', label: 'Registro de Compras' },
    ],
  },
  {
    id: 'finanzas',
    label: 'Caja y Tasa del Día',
    icon: HiOutlineCurrencyDollar,
    items: [
      { to: '/tasa-cambio', label: 'Tasa BCV del Día' },
      { to: '/reportes', label: 'Reportes de Ventas' },
    ],
  },
  {
    id: 'administracion',
    label: 'Ajustes del Sistema',
    icon: HiOutlineCog6Tooth,
    items: [
      { to: '/usuarios', label: 'Cajeros y Usuarios' },
      { to: '/configuracion', label: 'Datos del Negocio' },
    ],
  },
];

export const vendedorNavigationGroups = [
  {
    id: 'dashboard',
    label: 'Mi Turno',
    icon: HiOutlineHome,
    to: '/dashboard',
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: HiOutlineBuildingStorefront,
    items: [
      { to: '/pos', label: 'Caja / Cobrar' },
      { to: '/clientes', label: 'Clientes' },
      { to: '/cuentas-por-cobrar', label: 'Fiados Pendientes' },
    ],
  },
];
