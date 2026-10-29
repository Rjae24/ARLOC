import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getEmpresaConfig } from '../utils/constants';
import {
  getCxCConfig,
  saveCxCConfig,
  getAbonosCxC,
  registrarAbonoCxC,
  eliminarAbonoCxC,
  extraerCreditoFactura,
  calcularDiasTranscurridos,
  calcularMoraYSaldo,
} from '../services/cuentasCobrarService';

import CxCStats from '../components/cxc/CxCStats';
import CxCTable from '../components/cxc/CxCTable';
import CxCConfigModal from '../components/cxc/CxCConfigModal';
import CxCAbonoModal from '../components/cxc/CxCAbonoModal';
import CxCArticulosModal from '../components/cxc/CxCArticulosModal';
import Pagination from '../components/common/Pagination';

import {
  HiOutlineCreditCard,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth,
  HiOutlineArrowPath,
  HiOutlineFunnel,
  HiOutlineDocumentChartBar,
} from 'react-icons/hi2';

export default function CuentasPorCobrar() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [facturas, setFacturas] = useState([]);
  const [tasaHoy, setTasaHoy] = useState(null);
  const [config, setConfig] = useState(getCxCConfig);
  const [abonosMap, setAbonosMap] = useState(getAbonosCxC);
  const [empresa, setEmpresa] = useState(getEmpresaConfig);

  // Filtros
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendientes'); // 'todos' | 'pendientes' | 'vencidas' | 'solventes'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modales
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [cuentaParaAbonar, setCuentaParaAbonar] = useState(null);
  const [cuentaParaVerArticulos, setCuentaParaVerArticulos] = useState(null);

  useEffect(() => {
    cargarDatos();

    function handleAbonosUpdated(e) {
      setAbonosMap(e.detail || getAbonosCxC());
    }
    function handleConfigUpdated(e) {
      setConfig(e.detail || getCxCConfig());
    }
    window.addEventListener('arluc_cxc_abonos_updated', handleAbonosUpdated);
    window.addEventListener('arluc_cxc_config_updated', handleConfigUpdated);

    return () => {
      window.removeEventListener('arluc_cxc_abonos_updated', handleAbonosUpdated);
      window.removeEventListener('arluc_cxc_config_updated', handleConfigUpdated);
    };
  }, []);

  async function cargarDatos() {
    setLoading(true);
    try {
      // 1. Cargar facturas con clientes y detalles (con paginación continua por si supera 1000 registros)
      let facturasTotales = [];
      const step = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: factData, error: fErr } = await supabase
          .from('facturas')
          .select(`
            id,
            numero_factura,
            cliente_id,
            vendedor_id,
            tasa_id,
            total_usd,
            total_bs,
            metodos_pago,
            estado,
            fecha_emision,
            detalles_factura (
              id,
              producto_nombre,
              cantidad,
              precio_unitario_usd,
              subtotal_usd
            ),
            clientes (
              id,
              nombre,
              documento_identidad,
              telefono,
              email,
              direccion
            )
          `)
          .eq('estado', 'emitida')
          .order('fecha_emision', { ascending: false })
          .range(from, from + step - 1);

        if (fErr) throw fErr;
        if (factData && factData.length > 0) {
          facturasTotales = facturasTotales.concat(factData);
          from += step;
          if (factData.length < step) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      setFacturas(facturasTotales);

      // 2. Cargar tasa de cambio más reciente
      const { data: tasaData } = await supabase
        .from('tasas_cambio')
        .select('*')
        .order('fecha_registro', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tasaData) setTasaHoy(tasaData);
      setEmpresa(getEmpresaConfig());
    } catch (e) {
      console.error('Error cargando cuentas por cobrar:', e);
    } finally {
      setLoading(false);
    }
  }

  // Procesar facturas y estructurar cuentas por cobrar
  const cuentasProcesadas = useMemo(() => {
    const res = [];

    for (const f of facturas) {
      const creditoInfo = extraerCreditoFactura(f);
      if (!creditoInfo.tieneCredito) continue;

      const dias = calcularDiasTranscurridos(f.fecha_emision);
      const abonos = abonosMap[f.id] || [];
      const totalAbonado = abonos.reduce((sum, a) => sum + (parseFloat(a.monto_usd) || 0), 0);

      // Cálculo de mora y saldo con lógica contable precisa
      const calculo = calcularMoraYSaldo({
        montoOriginalUSD: creditoInfo.montoUSD,
        totalAbonadoUSD: totalAbonado,
        diasTranscurridos: dias,
        diasGracia: config.diasGracia,
        porcentajeRecargo: config.porcentajeRecargo,
        aplicarRecargoAutomatico: config.aplicarRecargoAutomatico,
      });

      res.push({
        id: f.id,
        numero_factura: f.numero_factura,
        fecha_emision: f.fecha_emision,
        cliente: f.clientes,
        detalles_factura: f.detalles_factura || [],
        totalFacturaUSD: parseFloat(f.total_usd || 0),
        totalFacturaBs: parseFloat(f.total_bs || 0),
        tipoCredito: creditoInfo.tipo,
        montoOriginalUSD: creditoInfo.montoUSD,
        montoOriginalBs: creditoInfo.montoBs,
        diasTranscurridos: dias,
        recargoUSD: calculo.recargoUSD,
        porcentajeAplicado: config.porcentajeRecargo,
        abonos,
        totalAbonadoUSD: parseFloat(totalAbonado.toFixed(2)),
        saldoTotalUSD: calculo.saldoPendienteUSD,
        esSolvente: calculo.esSolvente,
        esVencida: calculo.esVencida,
      });
    }

    return res;
  }, [facturas, abonosMap, config]);

  // Filtrado
  const cuentasFiltradas = useMemo(() => {
    return cuentasProcesadas.filter((c) => {
      // Búsqueda
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.numero_factura.toLowerCase().includes(q) ||
        c.cliente?.nombre?.toLowerCase().includes(q) ||
        c.cliente?.documento_identidad?.toLowerCase().includes(q) ||
        c.cliente?.telefono?.includes(q);

      // Estado
      let matchEstado = true;
      if (filtroEstado === 'pendientes') {
        matchEstado = !c.esSolvente;
      } else if (filtroEstado === 'vencidas') {
        matchEstado = c.esVencida;
      } else if (filtroEstado === 'solventes') {
        matchEstado = c.esSolvente;
      }

      return matchSearch && matchEstado;
    });
  }, [cuentasProcesadas, search, filtroEstado]);

  // Estadísticas globales
  const stats = useMemo(() => {
    let totalPendiente = 0;
    let vencidas = 0;
    let recargos = 0;
    let abonado = 0;
    let totalDias = 0;

    const activas = cuentasProcesadas.filter((c) => !c.esSolvente);

    activas.forEach((c) => {
      totalPendiente += c.saldoTotalUSD;
      abonado += c.totalAbonadoUSD;
      recargos += c.recargoUSD;
      totalDias += c.diasTranscurridos;
      if (c.esVencida) {
        vencidas++;
      }
    });

    const promedioDias = activas.length > 0 ? Math.round(totalDias / activas.length) : 0;

    return {
      totalSaldoPendienteUSD: parseFloat(totalPendiente.toFixed(2)),
      cuentasVencidas: vencidas,
      recargosGeneradosUSD: parseFloat(recargos.toFixed(2)),
      totalAbonadoUSD: parseFloat(abonado.toFixed(2)),
      promedioDias,
      totalCuentas: activas.length,
    };
  }, [cuentasProcesadas, config.diasGracia]);

  // Paginación
  const totalItems = cuentasFiltradas.length;
  const cuentasPaginadas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return cuentasFiltradas.slice(start, start + pageSize);
  }, [cuentasFiltradas, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filtroEstado]);

  function handleSaveConfig(newConfig) {
    const saved = saveCxCConfig(newConfig);
    setConfig(saved);
  }

  function handleRegistrarAbono(facturaId, abono) {
    registrarAbonoCxC(facturaId, abono);
    setAbonosMap(getAbonosCxC());
    // Refrescar cuenta seleccionada si está en modal
    if (cuentaParaAbonar && cuentaParaAbonar.id === facturaId) {
      const updatedAbonos = (abonosMap[facturaId] || []).concat(abono);
      const totalAbonado = updatedAbonos.reduce((s, a) => s + (parseFloat(a.monto_usd) || 0), 0);
      const calc = calcularMoraYSaldo({
        montoOriginalUSD: cuentaParaAbonar.montoOriginalUSD,
        totalAbonadoUSD: totalAbonado,
        diasTranscurridos: cuentaParaAbonar.diasTranscurridos,
        diasGracia: config.diasGracia,
        porcentajeRecargo: config.porcentajeRecargo,
        aplicarRecargoAutomatico: config.aplicarRecargoAutomatico,
      });

      setCuentaParaAbonar((prev) => ({
        ...prev,
        abonos: updatedAbonos,
        totalAbonadoUSD: totalAbonado,
        recargoUSD: calc.recargoUSD,
        saldoTotalUSD: calc.saldoPendienteUSD,
      }));
    }
  }

  function handleEliminarAbono(facturaId, abonoId) {
    eliminarAbonoCxC(facturaId, abonoId);
    setAbonosMap(getAbonosCxC());
    if (cuentaParaAbonar && cuentaParaAbonar.id === facturaId) {
      const updatedAbonos = (cuentaParaAbonar.abonos || []).filter((a) => a.id !== abonoId);
      const totalAbonado = updatedAbonos.reduce((s, a) => s + (parseFloat(a.monto_usd) || 0), 0);
      const calc = calcularMoraYSaldo({
        montoOriginalUSD: cuentaParaAbonar.montoOriginalUSD,
        totalAbonadoUSD: totalAbonado,
        diasTranscurridos: cuentaParaAbonar.diasTranscurridos,
        diasGracia: config.diasGracia,
        porcentajeRecargo: config.porcentajeRecargo,
        aplicarRecargoAutomatico: config.aplicarRecargoAutomatico,
      });

      setCuentaParaAbonar((prev) => ({
        ...prev,
        abonos: updatedAbonos,
        totalAbonadoUSD: totalAbonado,
        recargoUSD: calc.recargoUSD,
        saldoTotalUSD: calc.saldoPendienteUSD,
      }));
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Cargando módulo de Cuentas por Cobrar...</p>
      </div>
    );
  }

  const tasaValor = tasaHoy?.tasa_usd_bs || 0;

  return (
    <div className="page">
      {/* Header */}
      <div className="page__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)',
              color: '#6366F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
            }}
          >
            <HiOutlineCreditCard />
          </div>
          <div>
            <h1 className="page__title" style={{ margin: 0 }}>Cuentas por Cobrar</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Monitoreo de días en calle, mora configurable y cobranza directa por llamada o WhatsApp
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={cargarDatos}
            title="Refrescar lista"
          >
            <HiOutlineArrowPath /> Refrescar
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setShowConfigModal(true)}
            title="Configurar regla de días de gracia y porcentaje de recargo"
          >
            <HiOutlineCog6Tooth /> Reglas
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => navigate('/cuentas-por-cobrar/reportes')}
            title="Ver reportes y auditoría de Cuentas por Cobrar"
          >
            <HiOutlineDocumentChartBar /> Reportes CxC
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <CxCStats stats={stats} tasaValor={tasaValor} />

      {/* Barra de Filtros */}
      <div className="filters-bar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
          <HiOutlineMagnifyingGlass className="search-box__icon" />
          <input
            type="text"
            placeholder="Buscar por cliente, cédula/RIF, factura o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HiOutlineFunnel style={{ color: 'var(--text-secondary)' }} />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ minWidth: '170px' }}
          >
            <option value="pendientes">Pendientes por Cobrar ({stats.totalCuentas})</option>
            <option value="vencidas">Con Mora / Vencidas ({stats.cuentasVencidas})</option>
            <option value="solventes">Completamente Solventes</option>
            <option value="todos">Todas las Cuentas ({cuentasProcesadas.length})</option>
          </select>
        </div>
      </div>

      {/* Tabla Principal */}
      <CxCTable
        cuentas={cuentasPaginadas}
        tasaValor={tasaValor}
        config={config}
        empresa={empresa}
        onOpenAbonos={(c) => setCuentaParaAbonar(c)}
        onOpenConfig={() => setShowConfigModal(true)}
        onVerArticulos={(c) => setCuentaParaVerArticulos(c)}
      />

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* Modal de Artículos a Crédito */}
      <CxCArticulosModal
        isOpen={!!cuentaParaVerArticulos}
        cuenta={cuentaParaVerArticulos}
        tasaValor={tasaValor}
        onClose={() => setCuentaParaVerArticulos(null)}
      />

      {/* Modal de Configuración de Recargo y Días */}
      <CxCConfigModal
        isOpen={showConfigModal}
        config={config}
        onSave={handleSaveConfig}
        onClose={() => setShowConfigModal(false)}
      />

      {/* Modal de Abonos y Cobro */}
      <CxCAbonoModal
        isOpen={!!cuentaParaAbonar}
        cuenta={cuentaParaAbonar}
        tasaValor={tasaValor}
        onRegistrarAbono={handleRegistrarAbono}
        onEliminarAbono={handleEliminarAbono}
        onClose={() => setCuentaParaAbonar(null)}
      />
    </div>
  );
}
