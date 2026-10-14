import { HiOutlineMagnifyingGlass, HiOutlineUserPlus, HiOutlineXMark } from 'react-icons/hi2';

export default function POSClientSection({
  clienteSeleccionado,
  clienteSearch,
  clienteResults,
  showNuevoCliente,
  nuevoCliente,
  onSearchChange,
  onSelectCliente,
  onClearCliente,
  onOpenNuevoCliente,
  onCloseNuevoCliente,
  onNuevoClienteChange,
  onCrearCliente,
}) {
  return (
    <div className="card pos-section">
      <h3 className="card__title">Cliente</h3>

      {clienteSeleccionado ? (
        <div className="pos-cliente-selected">
          <div>
            <strong>{clienteSeleccionado.nombre}</strong>
            <span>{clienteSeleccionado.documento_identidad}</span>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClearCliente}
            title="Quitar cliente seleccionado"
          >
            <HiOutlineXMark />
          </button>
        </div>
      ) : (
        <>
          <div className="search-box">
            <HiOutlineMagnifyingGlass className="search-box__icon" />
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={clienteSearch}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onOpenNuevoCliente}
              title="Registrar nuevo cliente"
            >
              <HiOutlineUserPlus />
            </button>
          </div>

          {clienteResults.length > 0 && (
            <div className="search-results">
              {clienteResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="search-result-item"
                  onClick={() => onSelectCliente(c)}
                >
                  <span className="search-result-item__name">{c.nombre}</span>
                  <span className="search-result-item__sub">{c.documento_identidad}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Formulario nuevo cliente inline */}
      {showNuevoCliente && (
        <div className="pos-nuevo-cliente">
          <form onSubmit={onCrearCliente}>
            <h4>Nuevo Cliente</h4>
            <input
              placeholder="Nombre completo"
              value={nuevoCliente.nombre}
              onChange={(e) => onNuevoClienteChange({ ...nuevoCliente, nombre: e.target.value })}
              required
            />
            <input
              placeholder="Cédula / RIF"
              value={nuevoCliente.documento_identidad}
              onChange={(e) => onNuevoClienteChange({ ...nuevoCliente, documento_identidad: e.target.value })}
              required
            />
            <input
              placeholder="Teléfono"
              value={nuevoCliente.telefono}
              onChange={(e) => onNuevoClienteChange({ ...nuevoCliente, telefono: e.target.value })}
            />
            <div className="pos-nuevo-cliente__actions">
              <button type="submit" className="btn btn--primary btn--sm">Guardar</button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={onCloseNuevoCliente}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
