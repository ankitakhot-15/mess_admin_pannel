import { useState } from 'react';
import { admin } from '../api/client';
import { asList, idOf, money, useApi } from '../hooks/useApi';
import { useRun } from '../context/ToastContext';
import { Badge, Button, Card, DataTable, FilterBar, FormModal, Modal, PageHeader, Pagination, Spinner } from '../components/ui';

const pick = (m, k) => m?.[k] ?? m?.mavshiProfile?.[k] ?? m?.profile?.[k];
const STATUS = ['PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED'].map((s) => ({ value: s, label: s }));

function Detail({ id, onClose }) {
  const { data, loading } = useApi(() => admin.mavshi(id), [id]);
  const m = data?.mavshi;
  const menu = data?.menu || [];
  return (
    <Modal title={pick(m, 'messName') || 'Mess details'} onClose={onClose} wide>
      {loading ? <div className="center"><Spinner /></div> : (
        <>
          <dl className="kv">
            <dt>Owner</dt><dd>{m?.fullName}</dd><dt>Mobile</dt><dd>{m?.mobile}</dd>
            <dt>Address</dt><dd>{m?.address}, {m?.pincode}</dd>
            <dt>Experience</dt><dd>{pick(m, 'cookingExperienceYears') ?? '-'} years</dd>
            <dt>Status</dt><dd><Badge value={m?.status} /></dd>
            {m?.rejectionReason && <><dt>Rejected for</dt><dd>{m.rejectionReason}</dd></>}
            {m?.subscription && <><dt>Plan</dt><dd>{m.subscription.planName} (till {m.subscription.endDate})</dd></>}
          </dl>
          <h3>Menu</h3>
          <DataTable rows={menu} empty="No menu items." columns={[
            { header: 'Item', render: (r) => r.name }, { header: 'Meal', render: (r) => r.mealType },
            { header: 'Type', render: (r) => r.foodType }, { header: 'Day', render: (r) => money(r.price) },
            { header: 'Week', render: (r) => money(r.weeklyPrice) }, { header: 'Month', render: (r) => money(r.monthlyPrice) },
          ]} />
        </>
      )}
    </Modal>
  );
}

export default function Mavshis() {
  const run = useRun();
  const [f, setF] = useState({ status: 'PENDING', pincode: '' });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const list = useApi(() => admin.mavshis({ ...f, page, limit: 10 }), [f, page]);
  const plans = useApi(() => admin.plans(), []);
  const planOpts = [{ value: '', label: 'No plan' }, ...asList(plans.data).filter((p) => p.active !== false).map((p) => ({ value: idOf(p), label: `${p.name} - ${money(p.fee)}` }))];
  const close = () => setModal(null);
  const done = async (fn, msg) => { if (await run(fn, msg)) { close(); list.reload(); } };

  const cols = [
    { header: 'Mess', render: (r) => <b>{pick(r, 'messName') || '-'}</b> },
    { header: 'Owner', render: (r) => <>{r.fullName}<small>{r.mobile}</small></> },
    { header: 'Pincode', render: (r) => r.pincode },
    { header: 'Plan', render: (r) => r.subscription?.planName || '-' },
    { header: 'Status', render: (r) => <Badge value={r.status} /> },
    { header: 'Actions', render: (r) => (
      <div className="row">
        <Button size="sm" variant="ghost" onClick={() => setModal({ t: 'view', r })}>View</Button>
        {r.status === 'PENDING' && <><Button size="sm" onClick={() => setModal({ t: 'approve', r })}>Approve</Button>
          <Button size="sm" variant="danger" onClick={() => setModal({ t: 'reject', r })}>Reject</Button></>}
        {r.status === 'ACTIVE' && <Button size="sm" variant="ghost" onClick={() => setModal({ t: 'plan', r })}>Change plan</Button>}
      </div>) },
  ];

  return (
    <>
      <PageHeader title="Mess requests" sub="Approve new mess owners and assign their platform plan" />
      <Card>
        <FilterBar values={f} onChange={(v) => { setF(v); setPage(1); }} filters={[
          { name: 'status', label: 'Status', type: 'select', options: STATUS },
          { name: 'pincode', label: 'Pincode', maxLength: 6, placeholder: 'e.g. 416001' }]} />
        <DataTable columns={cols} rows={asList(list.data)} loading={list.loading} error={list.error} onRetry={list.reload} empty="No requests match these filters." />
        <Pagination meta={list.meta} page={page} onPage={setPage} />
      </Card>

      {modal?.t === 'view' && <Detail id={idOf(modal.r)} onClose={close} />}
      {modal?.t === 'approve' && <FormModal title={`Approve ${pick(modal.r, 'messName') || 'mess'}`} submitLabel="Approve mess" onClose={close}
        fields={[{ name: 'planId', label: 'Platform plan', type: 'select', options: planOpts }, { name: 'note', label: 'Note to owner (optional)' }]}
        onSubmit={(v) => done(() => admin.approve(idOf(modal.r), v), 'Mess approved')} />}
      {modal?.t === 'reject' && <FormModal title="Reject request" submitLabel="Reject" danger onClose={close} note="The owner sees this reason when they log in."
        fields={[{ name: 'reason', label: 'Reason (5-300 characters)', type: 'textarea', required: true, minLength: 5, maxLength: 300 }]}
        onSubmit={(v) => done(() => admin.reject(idOf(modal.r), v), 'Request rejected')} />}
      {modal?.t === 'plan' && <FormModal title="Change plan" onClose={close}
        fields={[{ name: 'planId', label: 'Platform plan', type: 'select', options: planOpts.slice(1) }]}
        onSubmit={(v) => done(() => admin.setPlan(idOf(modal.r), v), 'Plan updated')} />}
    </>
  );
}
