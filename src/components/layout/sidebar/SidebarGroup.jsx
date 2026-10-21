import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { HiChevronDown, HiChevronRight } from 'react-icons/hi2';

export default function SidebarGroup({ group, collapsed, onNavigate }) {
  const location = useLocation();
  const Icon = group.icon;

  // Es un enlace directo si define 'to' o si no tiene múltiples items
  const isDirect = Boolean(group.to);
  const directPath = group.to;

  // Determinar si alguna ruta hija de este grupo está activa (para grupos con sub-items)
  const isAnyChildActive = !isDirect && group.items?.some(
    (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  );

  // Determinar si la ruta directa está activa
  const isDirectActive = isDirect && (
    location.pathname === directPath || (directPath !== '/dashboard' && location.pathname.startsWith(`${directPath}/`))
  );

  const [isOpen, setIsOpen] = useState(isAnyChildActive);
  const [isHoveredFlyout, setIsHoveredFlyout] = useState(false);

  useEffect(() => {
    if (isAnyChildActive) {
      setIsOpen(true);
    }
  }, [location.pathname, isAnyChildActive]);

  /* ============================================================
     CASO 1: ENLACE DIRECTO (Un solo módulo: Dashboard, Inventario)
     No despliega acordeón ni ramas secundarias.
     ============================================================ */
  if (isDirect) {
    return (
      <div
        className={`sidebar-group ${isDirectActive ? 'sidebar-group--active' : ''} ${
          collapsed ? 'sidebar-group--collapsed' : ''
        }`}
      >
        <NavLink
          to={directPath}
          onClick={() => onNavigate?.()}
          className={`sidebar-group__btn ${isDirectActive ? 'sidebar-group__btn--has-active' : ''}`}
          title={group.label}
        >
          <span className="sidebar-group__icon-box">
            <Icon className="sidebar-group__icon" />
          </span>
          {!collapsed && (
            <span className="sidebar-group__label">{group.label}</span>
          )}
        </NavLink>
      </div>
    );
  }

  /* ============================================================
     CASO 2: GRUPO RAMIFICADO (Departamentos con múltiples funciones)
     Despliega árbol con ramas curvas o flyout flotante.
     ============================================================ */
  return (
    <div
      className={`sidebar-group ${isAnyChildActive ? 'sidebar-group--active' : ''} ${
        collapsed ? 'sidebar-group--collapsed' : ''
      }`}
      onMouseEnter={() => collapsed && setIsHoveredFlyout(true)}
      onMouseLeave={() => collapsed && setIsHoveredFlyout(false)}
    >
      {/* Botón Cabecera del Departamento */}
      <button
        type="button"
        className={`sidebar-group__btn ${isOpen && !collapsed ? 'sidebar-group__btn--open' : ''} ${
          isAnyChildActive ? 'sidebar-group__btn--has-active' : ''
        }`}
        onClick={() => {
          if (!collapsed) {
            setIsOpen(!isOpen);
          } else {
            setIsHoveredFlyout(!isHoveredFlyout);
          }
        }}
        aria-expanded={isOpen}
        title={group.label}
      >
        <span className="sidebar-group__icon-box">
          <Icon className="sidebar-group__icon" />
        </span>

        {!collapsed && (
          <>
            <span className="sidebar-group__label">{group.label}</span>
            <HiChevronDown
              className={`sidebar-group__arrow ${isOpen ? 'sidebar-group__arrow--rotated' : ''}`}
            />
          </>
        )}
      </button>

      {/* Árbol ramificado expandido */}
      {!collapsed && isOpen && (
        <div className="sidebar-tree">
          <div className="sidebar-tree__branch">
            {group.items?.map((item) => (
              <div key={item.to} className="sidebar-tree__item">
                <NavLink
                  to={item.to}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) =>
                    `sidebar-tree__link ${isActive ? 'sidebar-tree__link--active' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="sidebar-tree__link-text">{item.label}</span>
                      {isActive && <HiChevronRight className="sidebar-tree__link-arrow" />}
                    </>
                  )}
                </NavLink>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menú flotante (Flyout en modo contraído) */}
      {collapsed && isHoveredFlyout && (
        <div className="sidebar-flyout">
          <div className="sidebar-flyout__header">
            <span className="sidebar-flyout__title">{group.label}</span>
          </div>

          <div className="sidebar-tree sidebar-tree--flyout">
            <div className="sidebar-tree__branch">
              {group.items?.map((item) => (
                <div key={item.to} className="sidebar-tree__item">
                  <NavLink
                    to={item.to}
                    onClick={() => {
                      setIsHoveredFlyout(false);
                      onNavigate?.();
                    }}
                    className={({ isActive }) =>
                      `sidebar-tree__link ${isActive ? 'sidebar-tree__link--active' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="sidebar-tree__link-text">{item.label}</span>
                        {isActive && <HiChevronRight className="sidebar-tree__link-arrow" />}
                      </>
                    )}
                  </NavLink>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
