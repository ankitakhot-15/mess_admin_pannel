import { useState } from 'react';
import { admin } from '../api/client';
import { asList, idOf, money, useApi } from '../hooks/useApi';
import { useRun } from '../context/ToastContext';
import { Badge, Button, Card, DataTable, FilterBar, FormModal, Modal, PageHeader, Pagination, Spinner } from '../components/ui';

const STATUSES = ['PAYMENT_PENDING', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED'];
const ref = (o) => o.orderNumber || String(idOf(o)).slice(-6).toUpperCase();
const pin = (o) => o.delivery?.pincode;
const total = (o) => o.pricing?.total;
const CANCELLABLE = ['ACCEPTED', 'PREPARING', 'READY'];

function Detail({ id, onClose }) {
  const { data: o, loading } = useApi(() => admin.order(id), [id]);
  return (
    <Modal title={o ? `Order #${ref(o)}` : 'Order'} onClose={onClose} wide>
      {loading || !o ? <div className="center"><Spinner /></div> : (
        <>
          <dl className="kv">
            <dt>Status</dt><dd><Badge value={o.status} /></dd>
            <dt>Customer</dt><dd>{o.customerName} <small>{o.customerMobile}</small></dd>
            <dt>Mess</dt><dd>{o.mavshiName}</dd>
            <dt>Plan</dt><dd>{o.plan} <small>{o.startDate} to {o.endDate}</small></dd>
            <dt>Deliver to</dt><dd>{o.delivery?.address}, {pin(o)}</dd>
            <dt>Delivery boy</dt><dd>{o.deliveryBoy ? `${o.deliveryBoy.name} (${o.deliveryBoy.mobile})` : 'Not assigned'}</dd>
            <dt>Payment</dt><dd>{o.payment?.method} <Badge value={o.payment?.status} /></dd>
            {o.payment?.refund && <><dt>Refund</dt><dd>{money(o.payment.refund.amount)} ({o.payment.refund.status})</dd></>}
            <dt>Subtotal</dt><dd>{money(o.pricing?.subtotal)}</dd><dt>Delivery</dt><dd>{money(o.pricing?.deliveryCharge)}</dd>
            <dt>Total</dt><dd><b>{money(total(o))}</b></dd>
            {o.eta && <><dt>ETA</dt><dd>{o.eta.estimatedMinutes} min ({o.eta.trafficLevel})</dd></>}
            {(o.rejectionReason || o.cancelReason) && <><dt>Reason</dt><dd>{o.rejectionReason || o.cancelReason}</dd></>}
            {o.notes && <><dt>Customer note</dt><dd>{o.notes}</dd></>}
          </dl>
          <h3>Items</h3>
          <DataTable rows={o.items || []} empty="No items." columns={[
            { header: 'Item', render: (r) => r.name }, { header: 'Qty', render: (r) => r.quantity },
            { header: 'Unit', render: (r) => money(r.unitPrice) }, { header: 'Line total', render: (r) => money(r.lineTotal) }]} />
          <h3>Timeline</h3>
          <ul className="timeline">{(o.timeline || []).map((t, i) => (
            <li key={i}><Badge value={t.status} /> <span>{new Date(t.at).toLocaleString('en-IN')}</span>{t.note && <small>{t.note}</small>}</li>))}</ul>
        </>
      )}
    </Modal>
  );
}

function BoyModal({ order, mode, onClose, onDone }) {
  const run = useRun();
  const boys = useApi(() => admin.availableBoys(pin(order)), [order]);
  const list = asList(boys.data).map((b) => ({ value: idOf(b), label: `${b.fullName} (${b.mobile})` }));
  const opts = mode === 'accept' ? [{ value: '', label: 'Assign later' }, ...list] : list.length ? list : [{ value: '', label: 'None available' }];
  return (
    <FormModal key={String(boys.loading)} title={mode === 'accept' ? `Accept order #${ref(order)}` : 'Assign delivery boy'} submitLabel={mode === 'accept' ? 'Accept order' : 'Assign'} onClose={onClose}
      note={boys.loading ? 'Loading available delivery boys…' : boys.error || (list.length ? `${list.length} available in ${pin(order)}` : `No delivery boys are available in ${pin(order)}.`)}
      fields={[{ name: 'deliveryBoyId', label: 'Delivery boy', type: 'select', options: opts }]}
      onSubmit={async (v) => {
        const fn = mode === 'accept' ? () => admin.acceptOrder(idOf(order), v) : () => admin.assignOrder(idOf(order), { deliveryBoyId: v.deliveryBoyId });
        if (await run(fn, mode === 'accept' ? 'Order accepted' : 'Delivery boy assigned')) onDone();
      }} />
  );
}

export default function Orders() {
  const run = useRun();
  const [f, setF] = useState({ status: 'PLACED', pincode: '', search: '', paymentStatus: '' });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const { data, meta, loading, error, reload } = useApi(() => admin.orders({ ...f, page, limit: 10 }), [f, page]);
  const close = () => setModal(null);
  const done = () => { close(); reload(); };

  const cols = [
    { header: 'Order', render: (r) => <b>#{ref(r)}</b> },
    { header: 'Customer', render: (r) => <>{r.customerName}<small>{r.customerMobile}</small></> },
    { header: 'Mess', render: (r) => r.mavshiName || '-' },
    { header: 'Pincode', render: (r) => pin(r) || '-' },
    { header: 'Total', render: (r) => <>{money(total(r))}<small>{r.payment?.method} {r.payment?.status}</small></> },
    { header: 'Status', render: (r) => <Badge value={r.status} /> },
    { header: 'Delivery boy', render: (r) => r.deliveryBoy?.name || '-' },
    { header: 'Actions', render: (r) => <div className="row">
      <Button size="sm" variant="ghost" onClick={() => setModal({ t: 'view', r })}>View</Button>
      {r.status === 'PLACED' && <><Button size="sm" onClick={() => setModal({ t: 'accept', r })}>Accept</Button>
        <Button size="sm" variant="danger" onClick={() => setModal({ t: 'reject', r })}>Reject</Button></>}
      {CANCELLABLE.includes(r.status) && <><Button size="sm" variant="ghost" onClick={() => setModal({ t: 'assign', r })}>{r.deliveryBoy ? 'Reassign' : 'Assign'}</Button>
        <Button size="sm" variant="danger" onClick={() => setModal({ t: 'cancel', r })}>Cancel</Button></>}</div> },
  ];
  return (
    <>
      <PageHeader title="Orders" sub="Placed orders wait for your decision" />
      <Card>
        <FilterBar values={f} onChange={(v) => { setF(v); setPage(1); }} filters={[
          { name: 'status', label: 'Status', type: 'select', options: [{ value: '', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s.replaceAll('_', ' ') }))] },
          { name: 'pincode', label: 'Pincode', maxLength: 6 },
          { name: 'paymentStatus', label: 'Payment', type: 'select', options: ['', 'PENDING', 'PAID', 'REFUNDED', 'FAILED'].map((v) => ({ value: v, label: v || 'All' })) },
          { name: 'search', label: 'Search', placeholder: 'Order no., name, mobile' }]} />
        <DataTable columns={cols} rows={asList(data)} loading={loading} error={error} onRetry={reload} empty="No orders with this status." />
        <Pagination meta={meta} page={page} onPage={setPage} />
      </Card>
      {modal?.t === 'view' && <Detail id={idOf(modal.r)} onClose={close} />}
      {(modal?.t === 'accept' || modal?.t === 'assign') && <BoyModal order={modal.r} mode={modal.t} onClose={close} onDone={done} />}
      {modal?.t === 'cancel' && <FormModal title={`Cancel order #${ref(modal.r)}`} submitLabel="Cancel order" danger onClose={close}
        note="Online payments are refunded first. The customer, mess and delivery boy are notified."
        fields={[{ name: 'reason', label: 'Reason (5-300 characters)', type: 'textarea', required: true, minLength: 5, maxLength: 300 }]}
        onSubmit={async (v) => { if (await run(() => admin.cancelOrder(idOf(modal.r), v), 'Order cancelled')) done(); }} />}
      {modal?.t === 'reject' && <FormModal title={`Reject order #${ref(modal.r)}`} submitLabel="Reject order" danger onClose={close}
        note="Online payments are refunded automatically. If the refund fails the order stays Placed so you can retry."
        fields={[{ name: 'reason', label: 'Reason (5-300 characters)', type: 'textarea', required: true, minLength: 5, maxLength: 300 }]}
        onSubmit={async (v) => { if (await run(() => admin.rejectOrder(idOf(modal.r), v), 'Order rejected')) done(); }} />}
    </>
  );
}
