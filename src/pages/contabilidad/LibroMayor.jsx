import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HiOutlineBookOpen,
  HiOutlineDocumentArrowDown,
  HiOutlineScale,
  HiOutlineMagnifyingGlass,
  HiOutlineCalendar,
  HiOutlineArrowPath,
  HiOutlinePrinter,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { fetchCuentasOperativas, fetchMovimientosCuenta } from '../../services/contabilidadService';

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

  // Movimientos filtrados por rango de fechas
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const fecha = m.asientos_contables?.fecha;
      if (!fecha) return true;
      if (fechaDesde && fecha < fechaDesde) return false;
      if (fechaHasta && fecha > fechaHasta) return false;
      return true;
    });
  }, [movimientos, fechaDesde, fechaHasta]);

  // Totales de movimientos filtrados
  const { totalDebe, totalHaber, saldoFinal } = useMemo(() => {
    let tDebe = 0;
    let tHaber = 0;

    movimientosFiltrados.forEach((m) => {
      tDebe += Number(m.debe || 0);
      tHaber += Number(m.haber || 0);
    });

    // En contabilidad venezolana/internacional:
    // Deudora (Activo, Costos, Gastos/Egresos): Debe - Haber
    // Acreedora (Pasivo, Capital/Patrimonio, Ingresos): Haber - Debe
    const esDeudora =
      cuentaActiva?.naturaleza === 'Deudora' ||
      cuentaActiva?.tipo === 'Activo' ||
      cuentaActiva?.tipo === 'Egreso' ||
      cuentaActiva?.tipo === 'Costo' ||
      cuentaActiva?.tipo === 'Gasto';

    const sFinal = esDeudora ? tDebe - tHaber : tHaber - tDebe;

    return {
      totalDebe: tDebe,
      totalHaber: tHaber,
      saldoFinal: sFinal,
    };
  }, [movimientosFiltrados, cuentaActiva]);

  const formatMoney = (amount) =>
    `$${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Exportar a CSV
  const handleExportCSV = () => {
    if (!cuentaActiva || movimientosFiltrados.length === 0) {
      toast.error('No hay movimientos para exportar');
      return;
    }

    const headers = ['Fecha', 'Número Asiento', 'Concepto / Glosa', 'Módulo', 'Debe ($)', 'Haber ($)', 'Saldo Acumulado ($)'];
    let runningSaldo = 0;
    const esDeudora =
      cuentaActiva.naturaleza === 'Deudora' ||
      cuentaActiva.tipo === 'Activo' ||
      cuentaActiva.tipo === 'Egreso';

    const rows = movimientosFiltrados.map((m) => {
      const debe = Number(m.debe || 0);
      const haber = Number(m.haber || 0);
      runningSaldo += esDeudora ? debe - haber : haber - debe;
      return [
        `"${m.asientos_contables?.fecha || ''}"`,
        `"${m.asientos_contables?.numero || ''}"`,
        `"${(m.asientos_contables?.glosa || '').replace(/"/g, '""')}"`,
        `"${m.asientos_contables?.modulo || ''}"`,
        debe.toFixed(2),
        haber.toFixed(2),
        runningSaldo.toFixed(2),
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

  // Variable para cálculo secuencial en el renderizado
  let saldoAcumulado = 0;
  const esDeudora =
    cuentaActiva?.naturaleza === 'Deudora' ||
    cuentaActiva?.tipo === 'Activo' ||
    cuentaActiva?.tipo === 'Egreso';

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

      {/* Selector de cuenta y filtros de fecha */}
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
            {cuentas.map((c) => (
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

        {/* Métricas / Balance Cards */}
        <div className="kpi-card" style={{ margin: 0 }}>
          <div className="kpi-card__label">Total Débitos (Debe)</div>
          <div className="kpi-card__value" style={{ color: 'var(--primary)' }}>
            {formatMoney(totalDebe)}
          </div>
          <div className="kpi-card__sub" style={{ color: 'var(--text-muted)' }}>
            Suma de cargos en el periodo
          </div>
        </div>

        <div className="kpi-card" style={{ margin: 0 }}>
          <div className="kpi-card__label">Total Créditos (Haber)</div>
          <div className="kpi-card__value" style={{ color: 'var(--info)' }}>
            {formatMoney(totalHaber)}
          </div>
          <div className="kpi-card__sub" style={{ color: 'var(--text-muted)' }}>
            Suma de abonos en el periodo
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
            {cuentaActiva?.naturaleza === 'Acreedora' ? 'Saldo Acreedor' : 'Saldo Deudor'}
          </div>
        </div>
      </div>

      {/* Ficha Mayor de la Cuenta */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {cuentaActiva ? (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  padding: '0.2rem 0.5rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '6px',
                }}
              >
                {cuentaActiva.codigo}
              </span>
              <strong style={{ fontSize: '1.15rem' }}>{cuentaActiva.nombre}</strong>
              <span className="badge badge--primary">{cuentaActiva.tipo}</span>
              <span className="badge badge--info">Naturaleza: {cuentaActiva.naturaleza}</span>
            </div>
          ) : (
            <span>Seleccione una cuenta contable</span>
          )}

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total Movimientos: <strong>{movimientosFiltrados.length}</strong>
          </div>
        </div>

        {/* Estado de carga */}
        {loadingMovs ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <HiOutlineArrowPath className="spin" style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
            <p>Consultando movimientos de la cuenta en Supabase...</p>
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <HiOutlineBookOpen style={{ fontSize: '2.5rem', opacity: 0.4, marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600 }}>No hay movimientos registrados para esta cuenta</p>
            <p style={{ fontSize: '0.85rem' }}>
              Los asientos registrados en el Libro Diario aparecerán automáticamente aquí.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0, minWidth: '700px' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Fecha</th>
                  <th style={{ width: '150px' }}>Asiento</th>
                  <th style={{ width: '100px' }}>Módulo</th>
                  <th>Concepto / Glosa</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Debe (+)</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Haber (-)</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.map((m) => {
                  const debe = Number(m.debe || 0);
                  const haber = Number(m.haber || 0);

                  if (esDeudora) {
                    saldoAcumulado = saldoAcumulado + debe - haber;
                  } else {
                    saldoAcumulado = saldoAcumulado + haber - debe;
                  }

                  const asiento = m.asientos_contables;

                  return (
                    <tr key={m.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{asiento?.fecha || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                        {asiento?.numero || '—'}
                      </td>
                      <td>
                        <span className="badge badge--secondary" style={{ fontSize: '0.75rem' }}>
                          {asiento?.modulo || 'Manual'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px' }}>{asiento?.glosa || '—'}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: debe > 0 ? 600 : 400,
                          color: debe > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}
                      >
                        {debe > 0 ? formatMoney(debe) : '—'}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: haber > 0 ? 600 : 400,
                          color: haber > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}
                      >
                        {haber > 0 ? formatMoney(haber) : '—'}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: saldoAcumulado >= 0 ? 'var(--primary)' : '#EF4444',
                        }}
                      >
                        {formatMoney(saldoAcumulado)}
                      </td>
                    </tr>
                  );
                })}

                {/* Fila Totales */}
                <tr
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    fontWeight: 700,
                    borderTop: '2px solid var(--border)',
                  }}
                >
                  <td colSpan="4" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    Total Movimientos ({movimientosFiltrados.length}):
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatMoney(totalDebe)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--info)' }}>{formatMoney(totalHaber)}</td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: saldoFinal >= 0 ? '#22C55E' : '#EF4444',
                      fontSize: '1.05rem',
                    }}
                  >
                    {formatMoney(saldoFinal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
