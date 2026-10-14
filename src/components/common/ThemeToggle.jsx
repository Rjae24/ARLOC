import { useTheme } from '../../contexts/ThemeContext';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';

export default function ThemeToggle({ showLabel = false, className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      title={isDark ? 'Cambiar a Tema Claro (Verde y Blanco)' : 'Cambiar a Tema Oscuro (Verde y Negro Grisáceo)'}
      aria-label="Alternar tema de color"
    >
      {isDark ? (
        <HiOutlineSun style={{ color: '#F59E0B' }} />
      ) : (
        <HiOutlineMoon style={{ color: 'var(--primary)' }} />
      )}
      {showLabel && (
        <span className="theme-toggle-btn__text">
          {isDark ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </button>
  );
}
