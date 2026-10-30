import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HiOutlineBookOpen,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineEyeSlash,
  HiOutlineArrowPath,
  HiOutlineFunnel,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import {
  fetchPlanCuentasCompleto,
  crearCuenta,
  toggleCuentaActiva,
} from '../../services/contabilidadService';
import { TIPOS_CUENTA, buildTree } from '../../components/contabilidad/planCuentasUtils';
import CuentaTreeNode from '../../components/contabilidad/CuentaTreeNode';
import CuentaModal from '../../components/contabilidad/CuentaModal';

export default function PlanCuentas() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [showInactivas, setShowInactivas] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    tipo: 'ACTIVO',
    naturaleza: 'DEUDORA',
    es_padre: false,
    cuenta_padre_id: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlanCuentasCompleto();
      setCuentas(data);
      // Auto-expand first-level parents
      const padresIds = new Set(data.filter((c) => c.es_padre && !c.cuenta_padre_id).map((c) => c.id));
      setExpandedIds(padresIds);
    } catch (err) {
      toast.error('Error al cargar plan de cuentas: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = () => {
    setExpandedIds(new Set(cuentas.filter((c) => c.es_padre).map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  async function handleToggleActive(cuenta) {
    try {
      await toggleCuentaActiva(cuenta.id, !cuenta.activo);
      toast.success(cuenta.activo ? `Cuenta "${cuenta.codigo}" desactivada` : `Cuenta "${cuenta.codigo}" reactivada`);
      loadData();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  }

  const cuentasFiltradas = useMemo(() => {
    let filtered = cuentas;
    if (!showInactivas) {
      filtered = filtered.filter((c) => c.activo);
    }
    if (filterTipo !== 'todos') {
      filtered = filtered.filter((c) => c.tipo?.toUpperCase() === filterTipo);
    }
    return filtered;
  }, [cuentas, showInactivas, filterTipo]);

  const tree = useMemo(() => buildTree(cuentasFiltradas), [cuentasFiltradas]);

  const search = searchTerm.toLowerCase().trim();

  // Stats
  const totalCuentas = cuentas.filter((c) => c.activo).length;
  const cuentasPadre = cuentas.filter((c) => c.activo && c.es_padre).length;
  const cuentasOperativas = cuentas.filter((c) => c.activo && !c.es_padre).length;
  const cuentasInactivas = cuentas.filter((c) => !c.activo).length;

  // Create account
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nombre.trim()) {
      toast.error('El código y nombre son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await crearCuenta(form);
      toast.success(`Cuenta "${form.codigo}" creada exitosamente`);
      setShowModal(false);
      setForm({ codigo: '', nombre: '', tipo: 'ACTIVO', naturaleza: 'DEUDORA', es_padre: false, cuenta_padre_id: '' });
      loadData();
    } catch (err) {
      toast.error('Error al crear cuenta: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Parent accounts for the selector
  const cuentasPadreList = cuentas.filter((c) => c.activo && c.es_padre);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Cargando Plan de Cuentas...</p>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page__header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <HiOutlineBookOpen /> Contabilidad General
            </span>
          </div>
          <h1 className="page__title">Plan de Cuentas</h1>
          <p className="page__subtitle">Estructura jerárquica del catálogo contable</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn--primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> Nueva Cuenta
          </button>
          <button className="btn btn--secondary" onClick={loadData} title="Refrescar">
            <HiOutlineArrowPath /> Refrescar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--primary">
            <HiOutlineBookOpen />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Total Cuentas</span>
            <span className="stat-card__value">{totalCuentas}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--info">
            <HiOutlineFolder />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Grupos (Padre)</span>
            <span className="stat-card__value">{cuentasPadre}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--success">
            <HiOutlineDocumentText />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Operativas</span>
            <span className="stat-card__value">{cuentasOperativas}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--warning">
            <HiOutlineEyeSlash />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Inactivas</span>
            <span className="stat-card__value">{cuentasInactivas}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Buscar por código o nombre de cuenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem 0.6rem 2.2rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                minHeight: '44px',
              }}
            />
            <HiOutlineMagnifyingGlass
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
          </div>

          {/* Filter tipo */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <HiOutlineFunnel style={{ color: 'var(--text-muted)' }} />
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              style={{
                padding: '0.6rem 1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                minHeight: '44px',
              }}
            >
              <option value="todos">Todos los tipos</option>
              {TIPOS_CUENTA.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Toggle inactivas */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              minHeight: '44px',
              padding: '0 0.5rem',
            }}
          >
            <input
              type="checkbox"
              checked={showInactivas}
              onChange={(e) => setShowInactivas(e.target.checked)}
              style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
            />
            Mostrar inactivas
          </label>

          {/* Expand / Collapse */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className="btn btn--ghost btn--sm" onClick={expandAll} title="Expandir todo">
              <HiOutlineChevronDown /> Expandir
            </button>
            <button className="btn btn--ghost btn--sm" onClick={collapseAll} title="Contraer todo">
              <HiOutlineChevronRight /> Contraer
            </button>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Estructura del Plan Contable
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {cuentasFiltradas.length} cuenta(s) visible(s)
          </span>
        </div>

        {tree.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <HiOutlineBookOpen style={{ fontSize: '2.5rem', opacity: 0.4, marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600 }}>No hay cuentas contables</p>
            <p style={{ fontSize: '0.85rem' }}>Cree la primera cuenta con el botón "Nueva Cuenta".</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '600px' }}>
              {tree.map((cuenta) => (
                <CuentaTreeNode
                  key={cuenta.id}
                  cuenta={cuenta}
                  nivel={0}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                  onToggleActive={handleToggleActive}
                  search={search}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CuentaModal
        showModal={showModal}
        setShowModal={setShowModal}
        form={form}
        setForm={setForm}
        saving={saving}
        handleSubmit={handleSubmit}
        cuentasPadreList={cuentasPadreList}
      />
    </div>
  );
}
