import {
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlineDocumentText,
  HiOutlineEyeSlash,
  HiOutlineEye,
} from 'react-icons/hi2';
import { getTipoColor, getTipoBadgeClass } from './planCuentasUtils';

export default function CuentaTreeNode({ cuenta, nivel, expandedIds, toggleExpand, onToggleActive, search }) {
  const hasChildren = cuenta.children && cuenta.children.length > 0;
  const isExpanded = expandedIds.has(cuenta.id);
  const indent = nivel * 1.5;

  const matchesSearch = search
    ? cuenta.codigo.toLowerCase().includes(search) || cuenta.nombre.toLowerCase().includes(search)
    : true;

  const childrenMatchSearch = search
    ? cuenta.children?.some(
        (c) =>
          c.codigo.toLowerCase().includes(search) ||
          c.nombre.toLowerCase().includes(search) ||
          c.children?.some(
            (gc) => gc.codigo.toLowerCase().includes(search) || gc.nombre.toLowerCase().includes(search)
          )
      )
    : true;

  if (search && !matchesSearch && !childrenMatchSearch) return null;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 0.75rem',
          paddingLeft: `${0.75 + indent}rem`,
          borderBottom: '1px solid var(--border)',
          background: !cuenta.activo ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
          opacity: !cuenta.activo ? 0.55 : 1,
          transition: 'background 0.15s ease',
          flexWrap: 'wrap',
          cursor: hasChildren ? 'pointer' : 'default',
          minHeight: '48px',
        }}
        onClick={() => hasChildren && toggleExpand(cuenta.id)}
      >
        {/* Expand/Collapse toggle */}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            flexShrink: 0,
            color: hasChildren ? 'var(--text-secondary)' : 'transparent',
          }}
        >
          {hasChildren ? (
            isExpanded ? <HiOutlineChevronDown size={14} /> : <HiOutlineChevronRight size={14} />
          ) : (
            <span style={{ width: '14px' }} />
          )}
        </span>

        {/* Icon */}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: cuenta.es_padre
              ? 'var(--primary-bg)'
              : 'var(--bg-elevated)',
            color: cuenta.es_padre ? 'var(--primary)' : 'var(--text-secondary)',
            flexShrink: 0,
            fontSize: '0.95rem',
          }}
        >
          {cuenta.es_padre ? (
            isExpanded ? <HiOutlineFolderOpen /> : <HiOutlineFolder />
          ) : (
            <HiOutlineDocumentText />
          )}
        </span>

        {/* Code */}
        <code
          style={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: getTipoColor(cuenta.tipo),
            background: 'var(--bg-elevated)',
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            flexShrink: 0,
          }}
        >
          {cuenta.codigo}
        </code>

        {/* Name */}
        <span
          style={{
            fontWeight: cuenta.es_padre ? 600 : 400,
            color: cuenta.es_padre ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: '0.9rem',
            flex: 1,
            minWidth: '120px',
          }}
        >
          {cuenta.nombre}
        </span>

        {/* Badges */}
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span className={`badge ${getTipoBadgeClass(cuenta.tipo)}`} style={{ fontSize: '0.7rem' }}>
            {cuenta.tipo}
          </span>
          <span className="badge badge--ghost" style={{ fontSize: '0.7rem' }}>
            {cuenta.naturaleza}
          </span>
          {cuenta.es_padre && (
            <span className="badge badge--primary" style={{ fontSize: '0.65rem' }}>
              Grupo
            </span>
          )}
          {!cuenta.activo && (
            <span className="badge badge--danger" style={{ fontSize: '0.65rem' }}>
              Inactiva
            </span>
          )}
        </span>

        {/* Actions */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleActive(cuenta);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: cuenta.activo ? 'var(--text-muted)' : 'var(--primary)',
            cursor: 'pointer',
            padding: '0.3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '36px',
            minHeight: '36px',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
          }}
          title={cuenta.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}
        >
          {cuenta.activo ? <HiOutlineEyeSlash size={16} /> : <HiOutlineEye size={16} />}
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {cuenta.children.map((child) => (
            <CuentaTreeNode
              key={child.id}
              cuenta={child}
              nivel={nivel + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onToggleActive={onToggleActive}
              search={search}
            />
          ))}
        </div>
      )}
    </>
  );
}

