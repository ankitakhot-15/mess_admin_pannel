import { useState } from 'react';
import { admin } from '../api/client';
import { asList, idOf, money, useApi } from '../hooks/useApi';
import { useRun } from '../context/ToastContext';
import { Badge, Button, Card, ConfirmModal, DataTable, FormModal, PageHeader } from '../components/ui';

const FIELDS = [
  { name: 'name', label: 'Plan name', required: true },
  { name: 'description', label: 'Description' },
  { name: 'durationDays', label: 'Duration (days)', type: 'number', required: true, min: 1 },
  { name: 'fee', label: 'Fee (₹)', type: 'number', required: true, min: 0 },
  { name: 'active', label: 'Plan is active', type: 'checkbox' },
];

export default function Plans() {
  const run = useRun();
  const { data, loading, error, reload } = useApi(() => admin.plans(), []);
  const [modal, setModal] = useState(null);
  const close = () => setModal(null);
  const done = async (fn, msg) => { if (await run(fn, msg)) { close(); reload(); } };

  const cols = [
    { header: 'Plan', render: (r) => <b>{r.name}</b> },
    { header: 'Duration', render: (r) => `${r.durationDays} days` },
    { header: 'Fee', render: (r) => money(r.fee) },
    { header: 'Status', render: (r) => <Badge value={r.active === false ? 'INACTIVE' : 'ACTIVE'} /> },
    { header: 'Actions', render: (r) => <div className="row">
      <Button size="sm" variant="ghost" onClick={() => setModal({ t: 'edit', r })}>Edit</Button>
      <Button size="sm" variant="danger" onClick={() => setModal({ t: 'del', r })}>Delete</Button></div> },
  ];
  return (
    <>
      <PageHeader title="Mess plans" sub="Platform plans assigned to mess owners"><Button onClick={() => setModal({ t: 'new' })}>Add plan</Button></PageHeader>
      <Card><DataTable columns={cols} rows={asList(data)} loading={loading} error={error} onRetry={reload} empty="No plans yet. Add your first plan." /></Card>
      {modal?.t === 'new' && <FormModal title="Add plan" submitLabel="Create plan" fields={FIELDS} initial={{ active: true }} onClose={close}
        onSubmit={(v) => done(() => admin.createPlan(v), 'Plan created')} />}
      {modal?.t === 'edit' && <FormModal title="Edit plan" fields={FIELDS} initial={modal.r} onClose={close}
        onSubmit={(v) => done(() => admin.updatePlan(idOf(modal.r), v), 'Plan updated')} />}
      {modal?.t === 'del' && <ConfirmModal title="Delete plan" text={`Delete "${modal.r.name}"? This cannot be undone.`} confirmLabel="Delete plan" onClose={close}
        onConfirm={() => done(() => admin.deletePlan(idOf(modal.r)), 'Plan deleted')} />}
    </>
  );
}
