import { HiOutlineMagnifyingGlass, HiOutlineCalendar } from 'react-icons/hi2';

export default function LibroMayorFilters({
  cuentas,
  cuentasFiltradas,
  selectedCuentaId,
  setSelectedCuentaId,
  loadingCuentas,
  searchCuenta,
  setSearchCuenta,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      {/* Selector de Cuenta */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
          Seleccionar Cuenta Contable
        </label>
        <select
          value={selectedCuentaId}
          onChange={(e) => setSelectedCuentaId(e.target.value)}
          disabled={loadingCuentas}
          style={{
            width: '100%',
            minHeight: '44px',
            padding: '0.65rem 0.85rem',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        >
          {cuentasFiltradas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo} — {c.nombre} ({c.tipo})
            </option>
          ))}
        </select>

        {/* Buscador rápido de cuenta */}
        <div style={{ position: 'relative', marginTop: '0.5rem' }}>
          <HiOutlineMagnifyingGlass
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchCuenta}
            onChange={(e) => {
              setSearchCuenta(e.target.value);
              const match = cuentas.find(
                (c) =>
                  c.codigo.toLowerCase().includes(e.target.value.toLowerCase()) ||
                  c.nombre.toLowerCase().includes(e.target.value.toLowerCase())
              );
              if (match && e.target.value.trim().length > 1) {
                setSelectedCuentaId(match.id);
              }
            }}
            style={{
              width: '100%',
              minHeight: '40px',
              paddingLeft: '2.25rem',
              paddingRight: '0.75rem',
              fontSize: '0.85rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Filtro Rango de Fechas */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
          <HiOutlineCalendar style={{ display: 'inline', marginRight: '0.3rem' }} />
          Rango de Fechas
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={{
                width: '100%',
                minHeight: '40px',
                padding: '0.4rem 0.6rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={{
                width: '100%',
                minHeight: '40px',
                padding: '0.4rem 0.6rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>
        {(fechaDesde || fechaHasta) && (
          <button
            onClick={() => {
              setFechaDesde('');
              setFechaHasta('');
            }}
            style={{
              marginTop: '0.5rem',
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              padding: '0.2rem 0',
              textDecoration: 'underline',
            }}
          >
            Limpiar filtro de fechas
          </button>
        )}
      </div>
    </div>
  );
}

