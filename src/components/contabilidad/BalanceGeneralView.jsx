import {
  HiOutlineScale,
  HiOutlineBanknotes,
  HiOutlineArrowTrendingUp,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';

export default function BalanceGeneralView({
  bg,
  tActivos,
  tPasivos,
  tPatrimonio,
  tPasivoPatrimonio,
  uEjercicio,
  esVes,
  fmt,
}) {
  return (
    <div>
      {/* KPI Cards de Balance */}
      <div className="dashboard-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Total Activos
            </span>
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
              <HiOutlineBanknotes size={20} />
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmt(tActivos)}
          </div>
          <span className="text-xs" style={{ color: 'var(--info)' }}>Bienes y Derechos</span>
        </div>

        <div className="kpi-card p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Total Pasivos
            </span>
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <HiOutlineScale size={20} />
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmt(tPasivos)}
          </div>
          <span className="text-xs" style={{ color: 'var(--warning)' }}>Deudas y Obligaciones</span>
        </div>

        <div className="kpi-card p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Total Patrimonio
            </span>
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' }}>
              <HiOutlineArrowTrendingUp size={20} />
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmt(tPatrimonio)}
          </div>
          <span className="text-xs" style={{ color: 'var(--primary)' }}>Capital + Utilidades</span>
        </div>

        <div
          className="kpi-card p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: bg.cuadrado ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Ecuación Contable
            </span>
            <span
              className="p-2 rounded-lg"
              style={{
                backgroundColor: bg.cuadrado ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: bg.cuadrado ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {bg.cuadrado ? <HiOutlineCheckCircle size={20} /> : <HiOutlineExclamationTriangle size={20} />}
            </span>
          </div>
          <div
            className="text-lg font-bold"
            style={{ color: bg.cuadrado ? 'var(--success)' : 'var(--danger)' }}
          >
            {bg.cuadrado ? 'Balance Cuadrado' : 'Descuadrado'}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Activo = Pasivo + Patrimonio
          </span>
        </div>
      </div>

      {/* Desglose Detallado de Balance General: 2 Columnas en escritorio, 1 en móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* COLUMNA 1: ACTIVOS */}
        <div className="card rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div
            className="flex items-center justify-between p-3 rounded-lg mb-4"
            style={{ backgroundColor: 'var(--bg-elevated)', borderLeft: '4px solid var(--info)' }}
          >
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              ACTIVOS
            </span>
            <span className="font-bold text-sm" style={{ color: 'var(--info)' }}>
              {fmt(tActivos)}
            </span>
          </div>

          {bg.activos.length === 0 ? (
            <p className="text-xs italic py-4 text-center" style={{ color: 'var(--text-muted)' }}>
              No se registraron cuentas de activos con saldo.
            </p>
          ) : (
            <div className="space-y-1 mb-6">
              {bg.activos.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-[var(--bg-hover)] transition text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                      {c.codigo}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{c.nombre}</span>
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {fmt(esVes ? c.saldoVes : c.saldo)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Total Activo */}
          <div
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              TOTAL ACTIVOS
            </span>
            <span className="font-bold text-base" style={{ color: 'var(--info)' }}>
              {fmt(tActivos)}
            </span>
          </div>
        </div>

        {/* COLUMNA 2: PASIVOS Y PATRIMONIO */}
        <div className="card rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {/* PASIVOS */}
          <div
            className="flex items-center justify-between p-3 rounded-lg mb-4"
            style={{ backgroundColor: 'var(--bg-elevated)', borderLeft: '4px solid var(--warning)' }}
          >
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              PASIVOS
            </span>
            <span className="font-bold text-sm" style={{ color: 'var(--warning)' }}>
              {fmt(tPasivos)}
            </span>
          </div>

          {bg.pasivos.length === 0 ? (
            <p className="text-xs italic py-2 text-center" style={{ color: 'var(--text-muted)' }}>
              No hay pasivos registrados con saldo.
            </p>
          ) : (
            <div className="space-y-1 mb-4">
              {bg.pasivos.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-[var(--bg-hover)] transition text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                      {c.codigo}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{c.nombre}</span>
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {fmt(esVes ? c.saldoVes : c.saldo)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* PATRIMONIO */}
          <div
            className="flex items-center justify-between p-3 rounded-lg mb-4 mt-6"
            style={{ backgroundColor: 'var(--bg-elevated)', borderLeft: '4px solid var(--primary)' }}
          >
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              PATRIMONIO NETO
            </span>
            <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>
              {fmt(tPatrimonio)}
            </span>
          </div>

          <div className="space-y-1 mb-4">
            {bg.patrimonio.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 px-3 rounded hover:bg-[var(--bg-hover)] transition text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                    {c.codigo}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>{c.nombre}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {fmt(esVes ? c.saldoVes : c.saldo)}
                </span>
              </div>
            ))}
            {/* Línea de Utilidad/Pérdida del Ejercicio */}
            <div
              className="flex items-center justify-between py-2 px-3 rounded text-xs font-semibold"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span style={{ color: 'var(--text-primary)' }}>
                Resultado del Ejercicio Actual (P&L)
              </span>
              <span style={{ color: uEjercicio >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {fmt(uEjercicio)}
              </span>
            </div>
          </div>

          {/* TOTAL PASIVO + PATRIMONIO */}
          <div
            className="flex items-center justify-between p-3 rounded-lg mt-6"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <span className="block font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                TOTAL PASIVO + PATRIMONIO
              </span>
              <span className="text-[11px]" style={{ color: bg.cuadrado ? 'var(--success)' : 'var(--danger)' }}>
                {bg.cuadrado ? '✓ Coincide exactamente con el Activo' : `Descuadre: ${fmt(bg.diferencia)}`}
              </span>
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--primary)' }}>
              {fmt(tPasivoPatrimonio)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

