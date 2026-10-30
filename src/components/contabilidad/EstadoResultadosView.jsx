import {
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';

export default function EstadoResultadosView({
  er,
  tIngresos,
  tCostos,
  uBruta,
  tGastos,
  uNeta,
  esVes,
  fmt,
}) {
  return (
    <div>
      {/* KPI Cards de Resultados */}
      <div className="dashboard-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Total Ingresos
            </span>
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <HiOutlineArrowTrendingUp size={20} />
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmt(tIngresos)}
          </div>
          <span className="text-xs" style={{ color: 'var(--success)' }}>Ventas y Otros Ingresos</span>
        </div>

        <div className="kpi-card p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Costos de Ventas
            </span>
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#F97316' }}>
              <HiOutlineBanknotes size={20} />
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmt(tCostos)}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Costo Operativo Directo</span>
        </div>

        <div className="kpi-card p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Gastos Operativos
            </span>
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <HiOutlineArrowTrendingDown size={20} />
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmt(tGastos)}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Administración y Ventas</span>
        </div>

        <div
          className="kpi-card p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: uNeta >= 0 ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Utilidad Neta
            </span>
            <span
              className="p-2 rounded-lg"
              style={{
                backgroundColor: uNeta >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: uNeta >= 0 ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {uNeta >= 0 ? <HiOutlineCheckCircle size={20} /> : <HiOutlineExclamationTriangle size={20} />}
            </span>
          </div>
          <div
            className="text-xl font-bold"
            style={{ color: uNeta >= 0 ? 'var(--success)' : 'var(--danger)' }}
          >
            {fmt(uNeta)}
          </div>
          <span className="text-xs font-semibold" style={{ color: uNeta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {tIngresos > 0 ? `${((uNeta / tIngresos) * 100).toFixed(1)}% Margen Neto` : 'Resultado Neto'}
          </span>
        </div>
      </div>

      {/* Desglose Detallado del Estado de Resultados */}
      <div className="card rounded-xl p-5 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Estructura Financiera (P&L)
        </h2>

        {/* SECCIÓN INGRESOS */}
        <div className="mb-6">
          <div
            className="flex items-center justify-between p-3 rounded-lg mb-2"
            style={{ backgroundColor: 'var(--bg-elevated)', borderLeft: '4px solid var(--success)' }}
          >
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              1. INGRESOS OPERACIONALES
            </span>
            <span className="font-bold text-sm" style={{ color: 'var(--success)' }}>
              {fmt(tIngresos)}
            </span>
          </div>
          {er.ingresos.length === 0 ? (
            <p className="text-xs italic py-2 px-3" style={{ color: 'var(--text-muted)' }}>
              No se registraron movimientos en cuentas de ingresos.
            </p>
          ) : (
            <div className="space-y-1 pl-2">
              {er.ingresos.map((c) => (
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
        </div>

        {/* SECCIÓN COSTOS */}
        <div className="mb-6">
          <div
            className="flex items-center justify-between p-3 rounded-lg mb-2"
            style={{ backgroundColor: 'var(--bg-elevated)', borderLeft: '4px solid #F97316' }}
          >
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              2. COSTOS DE OPERACIÓN Y VENTAS
            </span>
            <span className="font-bold text-sm" style={{ color: '#F97316' }}>
              {fmt(tCostos)}
            </span>
          </div>
          {er.costos.length === 0 ? (
            <p className="text-xs italic py-2 px-3" style={{ color: 'var(--text-muted)' }}>
              No se registraron movimientos en cuentas de costos.
            </p>
          ) : (
            <div className="space-y-1 pl-2">
              {er.costos.map((c) => (
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
        </div>

        {/* SUBTOTAL: UTILIDAD BRUTA */}
        <div
          className="flex items-center justify-between p-3 rounded-lg mb-6"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          <span className="font-bold text-sm" style={{ color: 'var(--info)' }}>
            = UTILIDAD BRUTA (Ingresos - Costos)
          </span>
          <span className="font-bold text-base" style={{ color: 'var(--info)' }}>
            {fmt(uBruta)}
          </span>
        </div>

        {/* SECCIÓN GASTOS */}
        <div className="mb-6">
          <div
            className="flex items-center justify-between p-3 rounded-lg mb-2"
            style={{ backgroundColor: 'var(--bg-elevated)', borderLeft: '4px solid var(--danger)' }}
          >
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              3. GASTOS DE OPERACIÓN Y ADMINISTRACIÓN
            </span>
            <span className="font-bold text-sm" style={{ color: 'var(--danger)' }}>
              {fmt(tGastos)}
            </span>
          </div>
          {er.gastos.length === 0 ? (
            <p className="text-xs italic py-2 px-3" style={{ color: 'var(--text-muted)' }}>
              No se registraron movimientos en cuentas de gastos.
            </p>
          ) : (
            <div className="space-y-1 pl-2">
              {er.gastos.map((c) => (
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
        </div>

        {/* TOTAL FINAL: UTILIDAD NETA */}
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{
            backgroundColor: uNeta >= 0 ? 'var(--primary-bg)' : 'var(--danger-bg)',
            border: uNeta >= 0 ? '2px solid var(--primary)' : '2px solid var(--danger)',
          }}
        >
          <div>
            <span className="block font-bold text-base" style={{ color: uNeta >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
              UTILIDAD NETA DEL EJERCICIO
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Utilidad Bruta - Gastos Totales
            </span>
          </div>
          <div className="text-xl md:text-2xl font-black" style={{ color: uNeta >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
            {fmt(uNeta)}
          </div>
        </div>
      </div>
    </div>
  );
}

