export const TIPOS_CUENTA = [
  { value: 'ACTIVO', label: 'Activo', color: 'var(--info)' },
  { value: 'PASIVO', label: 'Pasivo', color: 'var(--warning)' },
  { value: 'PATRIMONIO', label: 'Patrimonio', color: 'var(--primary)' },
  { value: 'INGRESO', label: 'Ingreso', color: '#22C55E' },
  { value: 'COSTO', label: 'Costo', color: '#F97316' },
  { value: 'GASTO', label: 'Gasto', color: '#EF4444' },
];

export const NATURALEZAS = [
  { value: 'DEUDORA', label: 'Deudora' },
  { value: 'ACREEDORA', label: 'Acreedora' },
];

export function buildTree(cuentas) {
  const map = {};
  const roots = [];

  for (const cuenta of cuentas) {
    map[cuenta.id] = { ...cuenta, children: [] };
  }

  for (const cuenta of cuentas) {
    if (cuenta.cuenta_padre_id && map[cuenta.cuenta_padre_id]) {
      map[cuenta.cuenta_padre_id].children.push(map[cuenta.id]);
    } else {
      roots.push(map[cuenta.id]);
    }
  }

  return roots;
}

export function getTipoColor(tipo) {
  const found = TIPOS_CUENTA.find((t) => t.value === tipo?.toUpperCase());
  return found?.color || 'var(--text-muted)';
}

export function getTipoBadgeClass(tipo) {
  switch (tipo?.toUpperCase()) {
    case 'ACTIVO': return 'badge--info';
    case 'PASIVO': return 'badge--warning';
    case 'PATRIMONIO': return 'badge--primary';
    case 'INGRESO': return 'badge--success';
    case 'COSTO': return 'badge--warning';
    case 'GASTO': return 'badge--danger';
    default: return 'badge--ghost';
  }
}

