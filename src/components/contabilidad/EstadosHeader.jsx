import {
  HiOutlineDocumentChartBar,
  HiOutlineDocumentArrowDown,
  HiOutlinePrinter,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

export default function EstadosHeader({
  moneda,
  setMoneda,
  exportarCSV,
  imprimir,
  loadData,
  loading,
}) {
  return (
    <div className="page__header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'var(--primary-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              flexShrink: 0,
            }}
          >
            <HiOutlineDocumentChartBar size={24} />
          </div>
          <div>
            <h1 className="page__title text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Estados Financieros
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Balance General y Estado de Resultados consolidado
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Moneda y Acciones */}
      <div className="flex items-center flex-wrap gap-2">
        <div
          className="flex items-center p-1 rounded-xl"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={() => setMoneda('USD')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            style={{
              minHeight: 38,
              backgroundColor: moneda === 'USD' ? 'var(--primary)' : 'transparent',
              color: moneda === 'USD' ? '#000' : 'var(--text-secondary)',
            }}
          >
            USD ($)
          </button>
          <button
            type="button"
            onClick={() => setMoneda('VES')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            style={{
              minHeight: 38,
              backgroundColor: moneda === 'VES' ? 'var(--primary)' : 'transparent',
              color: moneda === 'VES' ? '#000' : 'var(--text-secondary)',
            }}
          >
            VES (Bs.)
          </button>
        </div>

        <button
          type="button"
          onClick={exportarCSV}
          className="btn btn--secondary flex items-center justify-center gap-1.5 text-xs"
          style={{ minHeight: 44, padding: '0 14px' }}
        >
          <HiOutlineDocumentArrowDown size={18} />
          <span className="hidden sm:inline">Exportar</span>
        </button>

        <button
          type="button"
          onClick={imprimir}
          className="btn btn--secondary flex items-center justify-center gap-1.5 text-xs"
          style={{ minHeight: 44, padding: '0 14px' }}
        >
          <HiOutlinePrinter size={18} />
          <span className="hidden sm:inline">Imprimir</span>
        </button>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="btn btn--secondary flex items-center justify-center gap-1.5 text-xs"
          style={{ minHeight: 44, padding: '0 14px' }}
          title="Recargar datos"
        >
          <HiOutlineArrowPath size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}

