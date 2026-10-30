import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HiOutlineBookOpen,
  HiOutlineDocumentArrowDown,
  HiOutlineScale,
  HiOutlineArrowPath,
  HiOutlinePrinter,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { fetchCuentasOperativas, fetchMovimientosCuenta } from '../../services/contabilidadService';
import LibroMayorFilters from '../../components/contabilidad/LibroMayorFilters';
import LibroMayorTable from '../../components/contabilidad/LibroMayorTable';

function cuentaEsDeudora(cuenta) {
  return cuenta?.naturaleza?.toUpperCase() === 'DEUDORA'
    || ['ACTIVO', 'COSTO', 'GASTO'].includes(cuenta?.tipo?.toUpperCase());
}

function agregarSaldoAcumulado(movimientos, esDeudora) {
  let saldoAcumuladoCentimos = 0;
  let saldoAcumuladoVesCentimos = 0;
  const movimientosConSaldo = [];

  for (const movimiento of movimientos) {
    const debeCentimos = Math.round(Number(movimiento.debe || 0) * 100);
    const haberCentimos = Math.round(Number(movimiento.haber || 0) * 100);
    const debeVesCentimos = Math.round(Number(movimiento.debe_ves || 0) * 100);
    const haberVesCentimos = Math.round(Number(movimiento.haber_ves || 0) * 100);
    saldoAcumuladoCentimos += esDeudora
      ? debeCentimos - haberCentimos
      : haberCentimos - debeCentimos;
    saldoAcumuladoVesCentimos += esDeudora
      ? debeVesCentimos - haberVesCentimos
      : haberVesCentimos - debeVesCentimos;
    movimientosConSaldo.push({
      ...movimiento,
      saldoAcumulado: saldoAcumuladoCentimos / 100,
      saldoAcumuladoVes: saldoAcumuladoVesCentimos / 100,
    });
  }

  return movimientosConSaldo;
}

export default function LibroMayor() {
  const [cuentas, setCuentas] = useState([]);
  const [selectedCuentaId, setSelectedCuentaId] = useState('');
  const [movimientos, setMovimientos] = useState([]);
  const [loadingCuentas, setLoadingCuentas] = useState(true);
  const [loadingMovs, setLoadingMovs] = useState(false);
  const [searchCuenta, setSearchCuenta] = useState('');

  // Filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // 1. Cargar plan de cuentas operativas
  const loadCuentas = useCallback(async () => {
    setLoadingCuentas(true);
    try {
      const data = await fetchCuentasOperativas();
      setCuentas(data);
      if (data.length > 0 && !selectedCuentaId) {
        setSelectedCuentaId(data[0].id);
      }
    } catch (err) {
      toast.error('Error al cargar cuentas contables: ' + err.message);
    } finally {
      setLoadingCuentas(false);
    }
  }, [selectedCuentaId]);

  useEffect(() => {
    loadCuentas();
  }, [loadCuentas]);

  // 2. Cargar movimientos cuando cambia la cuenta seleccionada
  const loadMovimientos = useCallback(async (cuentaId) => {
    if (!cuentaId) return;
    setLoadingMovs(true);
    try {
      const movs = await fetchMovimientosCuenta(cuentaId);
      setMovimientos(movs);
    } catch (err) {
      toast.error('Error al cargar movimientos de la cuenta: ' + err.message);
    } finally {
      setLoadingMovs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCuentaId) {
      loadMovimientos(selectedCuentaId);
    }
  }, [selectedCuentaId, loadMovimientos]);

  // Cuenta activa seleccionada
  const cuentaActiva = useMemo(() => {
    return cuentas.find((c) => c.id === selectedCuentaId) || null;
  }, [cuentas, selectedCuentaId]);

  // Cuentas filtradas en el selector rápido
  const cuentasFiltradas = useMemo(() => {
    if (!searchCuenta.trim()) return cuentas;
    const q = searchCuenta.toLowerCase();
    return cuentas.filter(
      (c) => c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q)
    );
  }, [cuentas, searchCuenta]);

  const movimientosConSaldo = useMemo(() => {
    return agregarSaldoAcumulado(movimientos, cuentaEsDeudora(cuentaActiva));
  }, [movimientos, cuentaActiva]);

  // Movimientos anteriores al inicio del período (para Saldo Anterior)
  const { saldoAnteriorUSD, saldoAnteriorBs, tieneSaldoAnterior } = useMemo(() => {
    if (!fechaDesde) return { saldoAnteriorUSD: 0, saldoAnteriorBs: 0, tieneSaldoAnterior: false };
    const anteriores = movimientosConSaldo.filter((m) => {
      const fecha = m.asientos_contables?.fecha;
      return fecha && fecha < fechaDesde;
    });
    if (anteriores.length === 0) return { saldoAnteriorUSD: 0, saldoAnteriorBs: 0, tieneSaldoAnterior: false };
    const ultimoAnterior = anteriores[anteriores.length - 1];
    return {
      saldoAnteriorUSD: ultimoAnterior.saldoAcumulado,
      saldoAnteriorBs: ultimoAnterior.saldoAcumuladoVes,
      tieneSaldoAnterior: true,
    };
  }, [movimientosConSaldo, fechaDesde]);

  // El saldo acumulado conserva los movimientos anteriores al rango filtrado.
  const movimientosFiltrados = useMemo(() => {
    return movimientosConSaldo.filter((m) => {
      const fecha = m.asientos_contables?.fecha;
      if (!fecha) return true;
      if (fechaDesde && fecha < fechaDesde) return false;
      if (fechaHasta && fecha > fechaHasta) return false;
      return true;
    });
  }, [movimientosConSaldo, fechaDesde, fechaHasta]);

  // Totales de movimientos filtrados
  const { totalDebe, totalHaber, totalDebeVes, totalHaberVes } = useMemo(() => {
    let totalDebeCentimos = 0;
    let totalHaberCentimos = 0;
    let totalDebeVesCentimos = 0;
    let totalHaberVesCentimos = 0;

    movimientosFiltrados.forEach((m) => {
      totalDebeCentimos += Math.round(Number(m.debe || 0) * 100);
      totalHaberCentimos += Math.round(Number(m.haber || 0) * 100);
      totalDebeVesCentimos += Math.round(Number(m.debe_ves || 0) * 100);
      totalHaberVesCentimos += Math.round(Number(m.haber_ves || 0) * 100);
    });

    return {
      totalDebe: totalDebeCentimos / 100,
      totalHaber: totalHaberCentimos / 100,
      totalDebeVes: totalDebeVesCentimos / 100,
      totalHaberVes: totalHaberVesCentimos / 100,
    };
  }, [movimientosFiltrados]);

  const movimientosAlCorte = movimientosConSaldo.filter(m =>
    !fechaHasta || (m.asientos_contables?.fecha && m.asientos_contables.fecha <= fechaHasta)
  );
  const saldoFinal = movimientosAlCorte.length
    ? movimientosAlCorte[movimientosAlCorte.length - 1].saldoAcumulado
    : 0;
  const saldoFinalVes = movimientosAlCorte.length
    ? movimientosAlCorte[movimientosAlCorte.length - 1].saldoAcumuladoVes
    : 0;

  const formatMoney = (amount) =>
    `$${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatBolivares = (amount) =>
    `Bs. ${Number(amount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Exportar a CSV
  const handleExportCSV = () => {
    if (!cuentaActiva || movimientosFiltrados.length === 0) {
      toast.error('No hay movimientos para exportar');
      return;
    }

    const headers = [
      'Fecha',
      'Número Asiento',
      'Concepto / Glosa',
      'Módulo',
      'Debe ($)',
      'Haber ($)',
      'Debe (Bs.)',
      'Haber (Bs.)',
      'Saldo Acumulado ($)',
      'Saldo Acumulado (Bs.)',
    ];
    const rows = movimientosFiltrados.map((m) => {
      const debe = Number(m.debe || 0);
      const haber = Number(m.haber || 0);
      return [
        `"${m.asientos_contables?.fecha || ''}"`,
        `"${m.asientos_contables?.numero || ''}"`,
        `"${(m.asientos_contables?.glosa || '').replace(/"/g, '""')}"`,
        `"${m.asientos_contables?.modulo || ''}"`,
        debe.toFixed(2),
        haber.toFixed(2),
        Number(m.debe_ves || 0).toFixed(2),
        Number(m.haber_ves || 0).toFixed(2),
        Number(m.saldoAcumulado || 0).toFixed(2),
        Number(m.saldoAcumuladoVes || 0).toFixed(2),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LibroMayor_${cuentaActiva.codigo}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Libro Mayor exportado a CSV exitosamente');
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page__header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <HiOutlineBookOpen /> Contabilidad General
            </span>
            <span className="badge badge--info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <HiOutlineScale /> Libro Mayor / Cuentas T
            </span>
          </div>
          <h1 className="page__title">Libro Mayor</h1>
          <p className="page__subtitle">
            Movimientos históricos, saldos deudores y acreedores sincronizados en tiempo real con Supabase
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn--secondary"
            onClick={() => {
              if (selectedCuentaId) loadMovimientos(selectedCuentaId);
            }}
            title="Actualizar movimientos"
            aria-label="Refrescar"
          >
            <HiOutlineArrowPath className={loadingMovs ? 'spin' : ''} /> Refrescar
          </button>
          <button
            className="btn btn--secondary"
            onClick={handleExportCSV}
            title="Exportar movimientos a CSV"
          >
            <HiOutlineDocumentArrowDown /> Exportar CSV
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => window.print()}
            title="Imprimir Libro Mayor"
          >
            <HiOutlinePrinter /> Imprimir
          </button>
        </div>
      </div>

      <LibroMayorFilters
        cuentas={cuentas}
        cuentasFiltradas={cuentasFiltradas}
        selectedCuentaId={selectedCuentaId}
        setSelectedCuentaId={setSelectedCuentaId}
        loadingCuentas={loadingCuentas}
        searchCuenta={searchCuenta}
        setSearchCuenta={setSearchCuenta}
        fechaDesde={fechaDesde}
        setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta}
        setFechaHasta={setFechaHasta}
      />

      {/* Métricas / Balance Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="kpi-card" style={{ margin: 0 }}>
          <div className="kpi-card__label">Total Débitos (Debe)</div>
          <div className="kpi-card__value" style={{ color: 'var(--primary)' }}>
            {formatMoney(totalDebe)}
          </div>
          <div className="kpi-card__sub" style={{ color: 'var(--text-muted)' }}>
            {formatBolivares(totalDebeVes)} · Suma de cargos en el periodo
          </div>
        </div>

        <div className="kpi-card" style={{ margin: 0 }}>
          <div className="kpi-card__label">Total Créditos (Haber)</div>
          <div className="kpi-card__value" style={{ color: 'var(--info)' }}>
            {formatMoney(totalHaber)}
          </div>
          <div className="kpi-card__sub" style={{ color: 'var(--text-muted)' }}>
            {formatBolivares(totalHaberVes)} · Suma de abonos en el periodo
          </div>
        </div>

        <div className="kpi-card" style={{ margin: 0 }}>
          <div className="kpi-card__label">
            Saldo Final ({cuentaActiva?.naturaleza || 'Deudora'})
          </div>
          <div
            className="kpi-card__value"
            style={{
              color: saldoFinal >= 0 ? '#22C55E' : '#EF4444',
            }}
          >
            {formatMoney(saldoFinal)}
          </div>
          <div className="kpi-card__sub" style={{ color: '#22C55E' }}>
            {formatBolivares(saldoFinalVes)} · {cuentaActiva?.naturaleza?.toUpperCase() === 'ACREEDORA' ? 'Saldo Acreedor' : 'Saldo Deudor'}
          </div>
        </div>
      </div>

      <LibroMayorTable
        cuentaActiva={cuentaActiva}
        movimientosFiltrados={movimientosFiltrados}
        saldoAnteriorUSD={saldoAnteriorUSD}
        saldoAnteriorBs={saldoAnteriorBs}
        tieneSaldoAnterior={tieneSaldoAnterior}
        fechaDesde={fechaDesde}
        loadingMovs={loadingMovs}
        totalDebe={totalDebe}
        totalHaber={totalHaber}
        totalDebeVes={totalDebeVes}
        totalHaberVes={totalHaberVes}
        saldoFinal={saldoFinal}
        saldoFinalVes={saldoFinalVes}
        formatMoney={formatMoney}
        formatBolivares={formatBolivares}
      />
    </div>
  );
}
