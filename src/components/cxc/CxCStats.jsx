import React from 'react';
import {
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { formatUSD, formatBs } from '../../utils/formatters';

export default function CxCStats({ stats, tasaValor }) {
  const totalBs = tasaValor > 0 ? stats.totalSaldoPendienteUSD * tasaValor : 0;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-card__icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
          <HiOutlineCreditCard />
        </div>
        <div className="stat-card__content">
          <span className="stat-card__label">Total Deuda Pendiente</span>
          <span className="stat-card__value" style={{ color: '#6366F1' }}>
            {formatUSD(stats.totalSaldoPendienteUSD)}
          </span>
          <span className="stat-card__sub">
            {tasaValor > 0 ? formatBs(totalBs) : `${stats.totalCuentas} cuenta(s) activa(s)`}
          </span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card__icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
          <HiOutlineExclamationCircle />
        </div>
        <div className="stat-card__content">
          <span className="stat-card__label">Cuentas con Recargo / Vencidas</span>
          <span className="stat-card__value" style={{ color: stats.cuentasVencidas > 0 ? '#EF4444' : 'inherit' }}>
            {stats.cuentasVencidas}
          </span>
          <span className="stat-card__sub">
            {stats.recargosGeneradosUSD > 0
              ? `+${formatUSD(stats.recargosGeneradosUSD)} por recargos`
              : 'Al día o dentro del límite'}
          </span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card__icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
          <HiOutlineClock />
        </div>
        <div className="stat-card__content">
          <span className="stat-card__label">Promedio de Antigüedad</span>
          <span className="stat-card__value" style={{ color: '#F59E0B' }}>
            {stats.promedioDias} <span style={{ fontSize: '1rem', fontWeight: 500 }}>días</span>
          </span>
          <span className="stat-card__sub">Tiempo transcurrido en calle</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card__icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
          <HiOutlineCheckCircle />
        </div>
        <div className="stat-card__content">
          <span className="stat-card__label">Total Abonos Recibidos</span>
          <span className="stat-card__value" style={{ color: '#10B981' }}>
            {formatUSD(stats.totalAbonadoUSD)}
          </span>
          <span className="stat-card__sub">Cobranzas registradas</span>
        </div>
      </div>
    </div>
  );
}
