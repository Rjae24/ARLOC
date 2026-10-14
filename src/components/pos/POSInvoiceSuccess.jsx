import { HiOutlineCheckCircle, HiOutlinePrinter, HiOutlinePlus } from 'react-icons/hi2';
import TicketFactura from '../print/TicketFactura';
import { formatUSD, formatBs } from '../../utils/formatters';

export default function POSInvoiceSuccess({
  facturaEmitida,
  showTicket,
  onShowTicket,
  onCloseTicket,
  onNuevaVenta,
}) {
  return (
    <div className="page">
      {showTicket && (
        <TicketFactura
          factura={facturaEmitida}
          onClose={onCloseTicket}
        />
      )}
      <div className="pos-success">
        <div className="pos-success__icon">
          <HiOutlineCheckCircle />
        </div>
        <h2>¡Factura Emitida!</h2>
        <p className="pos-success__numero">{facturaEmitida.numero_factura}</p>
        <p className="pos-success__total">{formatUSD(facturaEmitida.total_usd)}</p>
        <p className="pos-success__total-bs">{formatBs(facturaEmitida.total_bs)}</p>

        <div className="pos-success__actions">
          <button type="button" className="btn btn--primary" onClick={onShowTicket}>
            <HiOutlinePrinter /> Imprimir Ticket
          </button>
          <button type="button" className="btn btn--outline" onClick={onNuevaVenta}>
            <HiOutlinePlus /> Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
}
