import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineScale,
  HiOutlineArrowTrendingUp,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { fetchEstadosFinancieros } from '../../services/contabilidadService';
import EstadosHeader from '../../components/contabilidad/EstadosHeader';
import EstadoResultadosView from '../../components/contabilidad/EstadoResultadosView';
import BalanceGeneralView from '../../components/contabilidad/BalanceGeneralView';

export default function EstadosFinancieros() {
  const [activeTab, setActiveTab] = useState('resultados'); // 'resultados' | 'balance'
  const [moneda, setMoneda] = useState('USD'); // 'USD' | 'VES'
  const [loading, setLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [data, setData] = useState({
    estadoResultados: {
      ingresos: [],
      costos: [],
      gastos: [],
      totalIngresos: 0,
      totalCostos: 0,
      utilidadBruta: 0,
      totalGastos: 0,
      utilidadNeta: 0,
      totalIngresosVes: 0,
      totalCostosVes: 0,
      utilidadBrutaVes: 0,
      totalGastosVes: 0,
      utilidadNetaVes: 0,
    },
    balanceGeneral: {
      activos: [],
      pasivos: [],
      patrimonio: [],
      totalActivos: 0,
      totalPasivos: 0,
      totalPatrimonioBase: 0,
      totalPatrimonio: 0,
      utilidadEjercicio: 0,
      totalPasivoPatrimonio: 0,
      totalActivosVes: 0,
      totalPasivosVes: 0,
      totalPatrimonioBaseVes: 0,
      totalPatrimonioVes: 0,
      utilidadEjercicioVes: 0,
      totalPasivoPatrimonioVes: 0,
      cuadrado: true,
      diferencia: 0,
    },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchEstadosFinancieros({
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
      });
      setData(res);
    } catch (err) {
      toast.error('Error al generar estados financieros: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Formateadores
  const fmt = useCallback((val) => {
    const num = Number(val || 0);
    if (moneda === 'VES') {
      return `Bs. ${num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [moneda]);

  const esVes = moneda === 'VES';
  const er = data.estadoResultados;
  const bg = data.balanceGeneral;

  // Valores según moneda
  const tIngresos = esVes ? er.totalIngresosVes : er.totalIngresos;
  const tCostos = esVes ? er.totalCostosVes : er.totalCostos;
  const uBruta = esVes ? er.utilidadBrutaVes : er.utilidadBruta;
  const tGastos = esVes ? er.totalGastosVes : er.totalGastos;
  const uNeta = esVes ? er.utilidadNetaVes : er.utilidadNeta;

  const tActivos = esVes ? bg.totalActivosVes : bg.totalActivos;
  const tPasivos = esVes ? bg.totalPasivosVes : bg.totalPasivos;
  const tPatrimonio = esVes ? bg.totalPatrimonioVes : bg.totalPatrimonio;
  const tPasivoPatrimonio = esVes ? bg.totalPasivoPatrimonioVes : bg.totalPasivoPatrimonio;
  const uEjercicio = esVes ? bg.utilidadEjercicioVes : bg.utilidadEjercicio;

  // Filtros rápidos
  const setMesActual = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setFechaDesde(`${y}-${m}-01`);
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    setFechaHasta(`${y}-${m}-${lastDay}`);
  };

  const setAnoActual = () => {
    const y = new Date().getFullYear();
    setFechaDesde(`${y}-01-01`);
    setFechaHasta(`${y}-12-31`);
  };

  const limpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
  };

  // Exportar CSV
  const exportarCSV = () => {
    let lineasCSV = [];
    if (activeTab === 'resultados') {
      lineasCSV.push(['Estado de Resultados']);
      lineasCSV.push([`Periodo: ${fechaDesde || 'Inicio'} a ${fechaHasta || 'Actual'}`]);
      lineasCSV.push([`Moneda: ${moneda}`]);
      lineasCSV.push([]);
      lineasCSV.push(['Rubro / Código', 'Nombre de Cuenta', 'Monto']);

      lineasCSV.push(['-- INGRESOS --', '', '']);
      er.ingresos.forEach((c) => {
        lineasCSV.push([c.codigo, c.nombre, esVes ? c.saldoVes : c.saldo]);
      });
      lineasCSV.push(['TOTAL INGRESOS', '', tIngresos]);

      lineasCSV.push(['-- COSTOS --', '', '']);
      er.costos.forEach((c) => {
        lineasCSV.push([c.codigo, c.nombre, esVes ? c.saldoVes : c.saldo]);
      });
      lineasCSV.push(['TOTAL COSTOS', '', tCostos]);
      lineasCSV.push(['UTILIDAD BRUTA', '', uBruta]);

      lineasCSV.push(['-- GASTOS --', '', '']);
      er.gastos.forEach((c) => {
        lineasCSV.push([c.codigo, c.nombre, esVes ? c.saldoVes : c.saldo]);
      });
      lineasCSV.push(['TOTAL GASTOS', '', tGastos]);
      lineasCSV.push(['UTILIDAD NETA DEL EJERCICIO', '', uNeta]);
    } else {
      lineasCSV.push(['Balance General']);
      lineasCSV.push([`Al corte: ${fechaHasta || 'Fecha actual'}`]);
      lineasCSV.push([`Moneda: ${moneda}`]);
      lineasCSV.push([]);
      lineasCSV.push(['Rubro / Código', 'Nombre de Cuenta', 'Monto']);

      lineasCSV.push(['-- ACTIVOS --', '', '']);
      bg.activos.forEach((c) => {
        lineasCSV.push([c.codigo, c.nombre, esVes ? c.saldoVes : c.saldo]);
      });
      lineasCSV.push(['TOTAL ACTIVOS', '', tActivos]);

      lineasCSV.push(['-- PASIVOS --', '', '']);
      bg.pasivos.forEach((c) => {
        lineasCSV.push([c.codigo, c.nombre, esVes ? c.saldoVes : c.saldo]);
      });
      lineasCSV.push(['TOTAL PASIVOS', '', tPasivos]);

      lineasCSV.push(['-- PATRIMONIO --', '', '']);
      bg.patrimonio.forEach((c) => {
        lineasCSV.push([c.codigo, c.nombre, esVes ? c.saldoVes : c.saldo]);
      });
      lineasCSV.push(['Utilidad / Pérdida del Periodo', '', uEjercicio]);
      lineasCSV.push(['TOTAL PATRIMONIO', '', tPatrimonio]);
      lineasCSV.push(['TOTAL PASIVO + PATRIMONIO', '', tPasivoPatrimonio]);
    }

    const contenido = lineasCSV
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Estado_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Archivo CSV exportado exitosamente');
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="page" style={{ paddingBottom: 'env(safe-area-inset-bottom, 2rem)' }}>
      <EstadosHeader
        moneda={moneda}
        setMoneda={setMoneda}
        exportarCSV={exportarCSV}
        imprimir={imprimir}
        loadData={loadData}
        loading={loading}
      />

      {/* Tabs Selector */}
      <div className="flex border-b mb-6 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('resultados')}
          className="flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition relative"
          style={{
            minHeight: 48,
            color: activeTab === 'resultados' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'resultados' ? '2px solid var(--primary)' : '2px solid transparent',
            whiteSpace: 'nowrap',
          }}
        >
          <HiOutlineArrowTrendingUp size={18} />
          <span>Estado de Resultados (P&L)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('balance')}
          className="flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition relative"
          style={{
            minHeight: 48,
            color: activeTab === 'balance' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'balance' ? '2px solid var(--primary)' : '2px solid transparent',
            whiteSpace: 'nowrap',
          }}
        >
          <HiOutlineScale size={18} />
          <span>Balance General</span>
          {bg.cuadrado ? (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
            >
              Cuadrado
            </span>
          ) : (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}
            >
              Descuadre
            </span>
          )}
        </button>
      </div>

      {/* Barra de Filtros de Período */}
      <div
        className="card mb-6 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
              Desde:
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="form-control text-sm w-full"
              style={{
                minHeight: 44,
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '0 10px',
              }}
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
              Hasta:
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="form-control text-sm w-full"
              style={{
                minHeight: 44,
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '0 10px',
              }}
            />
          </div>
        </div>

        {/* Botones de rango predeterminado */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={setMesActual}
            className="btn btn--secondary text-xs whitespace-nowrap"
            style={{ minHeight: 44, padding: '0 12px' }}
          >
            Este Mes
          </button>
          <button
            type="button"
            onClick={setAnoActual}
            className="btn btn--secondary text-xs whitespace-nowrap"
            style={{ minHeight: 44, padding: '0 12px' }}
          >
            Este Año
          </button>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="btn btn--secondary text-xs whitespace-nowrap"
            style={{ minHeight: 44, padding: '0 12px' }}
          >
            Histórico Completo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="loading-spinner mb-4" />
          <p style={{ color: 'var(--text-secondary)' }}>Generando estados financieros consolidados...</p>
        </div>
      ) : activeTab === 'resultados' ? (
        <EstadoResultadosView
          er={er}
          tIngresos={tIngresos}
          tCostos={tCostos}
          uBruta={uBruta}
          tGastos={tGastos}
          uNeta={uNeta}
          esVes={esVes}
          fmt={fmt}
        />
      ) : (
        <BalanceGeneralView
          bg={bg}
          tActivos={tActivos}
          tPasivos={tPasivos}
          tPatrimonio={tPatrimonio}
          tPasivoPatrimonio={tPasivoPatrimonio}
          uEjercicio={uEjercicio}
          esVes={esVes}
          fmt={fmt}
        />
      )}
    </div>
  );
}
