import { HiOutlineXMark } from 'react-icons/hi2';
import { TIPOS_CUENTA, NATURALEZAS } from './planCuentasUtils';

export default function CuentaModal({
  showModal,
  setShowModal,
  form,
  setForm,
  saving,
  handleSubmit,
  cuentasPadreList,
}) {
  if (!showModal) return null;

  return (
    <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal__header">
          <h2>Nueva Cuenta Contable</h2>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              minWidth: '36px',
              minHeight: '36px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HiOutlineXMark />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal__form" style={{ flex: 1, overflow: 'auto' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Código</label>
              <input
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="Ej: 1.1.01"
                required
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="form-group">
              <label>Cuenta Padre (opcional)</label>
              <select
                value={form.cuenta_padre_id}
                onChange={(e) => setForm({ ...form, cuenta_padre_id: e.target.value })}
              >
                <option value="">— Ninguna (Raíz) —</option>
                {cuentasPadreList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo} — {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Nombre de la Cuenta</label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Bancos Nacionales"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => {
                  const tipo = e.target.value;
                  const naturaleza = ['ACTIVO', 'COSTO', 'GASTO'].includes(tipo) ? 'DEUDORA' : 'ACREEDORA';
                  setForm({ ...form, tipo, naturaleza });
                }}
              >
                {TIPOS_CUENTA.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Naturaleza</label>
              <select
                value={form.naturaleza}
                onChange={(e) => setForm({ ...form, naturaleza: e.target.value })}
              >
                {NATURALEZAS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.5rem 0',
            }}
          >
            <input
              type="checkbox"
              checked={form.es_padre}
              onChange={(e) => setForm({ ...form, es_padre: e.target.checked })}
              style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
            />
            Es cuenta padre (agrupadora — no acepta movimientos directos)
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn--secondary" onClick={() => setShowModal(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

