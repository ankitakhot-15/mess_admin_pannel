import { useState } from 'react';
import { admin } from '../api/client';
import { asList, idOf, useApi } from '../hooks/useApi';
import { useRun } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, ConfirmModal, DataTable, FilterBar, FormModal, PageHeader, Pagination } from '../components/ui';

const opt = (arr, all) => [...(all ? [{ value: '', label: 'All' }] : []), ...arr.map((v) => ({ value: v, label: v }))];
const ROLES = ['ADMIN', 'CUSTOMER', 'MAVSHI', 'DELIVERY'];
const COMMON = [
  { name: 'fullName', label: 'Full name', required: true },
  { name: 'address', label: 'Address' }, { name: 'areaName', label: 'Area' },
  { name: 'pincode', label: 'Pincode', maxLength: 6, pattern: '[0-9]{6}', title: '6 digits' },
];
const CREATE = [
  { name: 'role', label: 'Role', type: 'select', options: opt(ROLES) },
  COMMON[0],
  { name: 'mobile', label: 'Mobile', required: true, maxLength: 10, pattern: '[6-9][0-9]{9}', title: '10 digits starting 6-9' },
  { name: 'password', label: 'Password (8-64 chars)', type: 'password', required: true, minLength: 8, maxLength: 64 },
  ...COMMON.slice(1),
  { name: 'status', label: 'Status', type: 'select', options: opt(['ACTIVE', 'PENDING']) },
];
const EDIT = [...COMMON, { name: 'email', label: 'Email', type: 'email' }];

export default function Users() {
  const run = useRun();
  const { user: me } = useAuth();
  const [f, setF] = useState({ role: 'CUSTOMER', status: '', pincode: '', search: '' });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const { data, meta, loading, error, reload } = useApi(() => admin.users({ ...f, page, limit: 10 }), [f, page]);
  const close = () => setModal(null);
  const done = async (fn, msg) => { if (await run(fn, msg)) { close(); reload(); } };

  const cols = [
    { header: 'Name', render: (r) => <b>{r.fullName}</b> },
    { header: 'Mobile', render: (r) => r.mobile },
    { header: 'Role', render: (r) => r.role },
    { header: 'Pincode', render: (r) => r.pincode || '-' },
    { header: 'Status', render: (r) => <Badge value={r.status} /> },
    { header: 'Actions', render: (r) => <div className="row">
      <Button size="sm" variant="ghost" onClick={() => setModal({ t: 'edit', r })}>Edit</Button>
      {r.status === 'BLOCKED'
        ? <Button size="sm" onClick={() => done(() => admin.setStatus(idOf(r), { status: 'ACTIVE' }), 'User unblocked')}>Unblock</Button>
        : <Button size="sm" variant="ghost" onClick={() => setModal({ t: 'block', r })}>Block</Button>}
      <Button size="sm" variant="ghost" onClick={() => setModal({ t: 'notify', r })}>Notify</Button>
      <Button size="sm" variant="ghost" onClick={() => setModal({ t: 'pw', r })}>Reset password</Button>
      {idOf(r) !== idOf(me) && <Button size="sm" variant="danger" onClick={() => setModal({ t: 'del', r })}>Delete</Button>}</div> },
  ];
  return (
    <>
      <PageHeader title="Users" sub="Customers, mess owners, delivery boys and admins"><Button onClick={() => setModal({ t: 'new' })}>Add user</Button></PageHeader>
      <Card>
        <FilterBar values={f} onChange={(v) => { setF(v); setPage(1); }} filters={[
          { name: 'role', label: 'Role', type: 'select', options: opt(ROLES, true) },
          { name: 'status', label: 'Status', type: 'select', options: opt(['ACTIVE', 'PENDING', 'REJECTED', 'BLOCKED'], true) },
          { name: 'pincode', label: 'Pincode', maxLength: 6 }, { name: 'search', label: 'Search', placeholder: 'Name or mobile' }]} />
        <DataTable columns={cols} rows={asList(data)} loading={loading} error={error} onRetry={reload} empty="No users found." />
        <Pagination meta={meta} page={page} onPage={setPage} />
      </Card>
      {modal?.t === 'new' && <FormModal title="Add user" submitLabel="Create user" fields={CREATE} initial={{ role: 'ADMIN', status: 'ACTIVE' }} onClose={close}
        onSubmit={(v) => done(() => admin.createUser(v), 'User created')} />}
      {modal?.t === 'edit' && <FormModal title="Edit user" fields={EDIT} initial={modal.r} onClose={close}
        onSubmit={(v) => done(() => admin.updateUser(idOf(modal.r), v), 'User updated')} />}
      {modal?.t === 'block' && <FormModal title={`Block ${modal.r.fullName}`} submitLabel="Block user" danger onClose={close}
        fields={[{ name: 'reason', label: 'Reason', required: true }]}
        onSubmit={(v) => done(() => admin.setStatus(idOf(modal.r), { status: 'BLOCKED', reason: v.reason }), 'User blocked')} />}
      {modal?.t === 'pw' && <FormModal title={`Reset password for ${modal.r.fullName}`} submitLabel="Reset password" onClose={close}
        note="The user is notified. Share the new password with them securely."
        fields={[{ name: 'newPassword', label: 'New password (8-64 chars)', type: 'password', required: true, minLength: 8, maxLength: 64 }]}
        onSubmit={(v) => done(() => admin.resetPassword(idOf(modal.r), v), 'Password reset')} />}
      {modal?.t === 'notify' && <FormModal title={`Notify ${modal.r.fullName}`} submitLabel="Send notification" onClose={close}
        fields={[{ name: 'title', label: 'Title', required: true, minLength: 2, maxLength: 80 }, { name: 'body', label: 'Message', type: 'textarea', required: true, minLength: 2, maxLength: 300 }]}
        onSubmit={(v) => done(() => admin.sendNotification({ target: 'USER', userId: idOf(modal.r), ...v }))} />}
      {modal?.t === 'del' && <ConfirmModal title="Delete user" text={`Delete ${modal.r.fullName}? Blocking is usually safer.`} confirmLabel="Delete user" onClose={close}
        onConfirm={() => done(() => admin.deleteUser(idOf(modal.r)), 'User deleted')} />}
    </>
  );
}
