import { useState, useRef, useEffect } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineChevronUpDown } from 'react-icons/hi2';

/**
 * Componente de búsqueda interactiva para seleccionar productos
 * Reemplaza los selects estáticos largos de 100+ items
 */
export default function SearchableProductSelect({
  productos = [],
  value = '',
  onChange,
  placeholder = 'Buscar producto por nombre o SKU...',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  const productoSeleccionado = productos.find(p => p.id === value);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const productosFiltrados = productos.filter(p => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const nombreMatch = p.nombre?.toLowerCase().includes(q);
    const skuMatch = p.sku?.toLowerCase().includes(q);
    return nombreMatch || skuMatch;
  });

  function handleSelect(prod) {
    onChange(prod.id, prod);
    setIsOpen(false);
    setQuery('');
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange('', null);
    setQuery('');
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Gatillo / Campo visible */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.55rem 0.75rem',
          minHeight: '44px',
          background: 'var(--bg-input, rgba(255, 255, 255, 0.05))',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          color: 'var(--text-primary, #FFFFFF)',
          fontSize: '0.9rem',
          userSelect: 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {productoSeleccionado ? (
            <span>
              <strong>{productoSeleccionado.nombre}</strong>
              {productoSeleccionado.sku && (
                <span style={{ color: 'var(--text-secondary, #9CA3AF)', marginLeft: '0.4rem', fontSize: '0.8rem' }}>
                  ({productoSeleccionado.sku})
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted, #6B7280)' }}>{placeholder}</span>
          )}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.4rem' }}>
          {productoSeleccionado && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #9CA3AF)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Quitar selección"
            >
              <HiOutlineXMark style={{ fontSize: '1.1rem' }} />
            </button>
          )}
          <HiOutlineChevronUpDown style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '1.1rem' }} />
        </div>
      </div>

      {/* Menú desplegable con buscador */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--bg-elevated, #182234)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
            zIndex: 9999,
            padding: '0.5rem',
            maxHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          {/* Input de búsqueda rápida */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.6rem',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '6px',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            }}
          >
            <HiOutlineMagnifyingGlass style={{ color: 'var(--text-muted, #6B7280)', flexShrink: 0 }} />
            <input
              type="text"
              autoFocus
              placeholder="Escribe para filtrar..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary, #FFFFFF)',
                fontSize: '0.88rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* Lista scrolleable de opciones */}
          <div style={{ overflowY: 'auto', maxHeight: '200px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {productosFiltrados.length === 0 ? (
              <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted, #6B7280)', fontSize: '0.85rem' }}>
                No se encontraron productos
              </div>
            ) : (
              productosFiltrados.map(prod => {
                const isSelected = prod.id === value;
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleSelect(prod)}
                    style={{
                      padding: '0.5rem 0.65rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      color: isSelected ? 'var(--primary, #10B981)' : 'var(--text-primary, #FFFFFF)',
                      fontSize: '0.88rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: isSelected ? 600 : 500 }}>{prod.nombre}</div>
                      {prod.sku && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #9CA3AF)' }}>
                          SKU: {prod.sku} {prod.stock !== undefined ? `• Stock: ${prod.stock}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

