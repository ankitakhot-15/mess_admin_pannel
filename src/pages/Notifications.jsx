import { useState } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../api/client';
import { asList, useApi } from '../hooks/useApi';
import { useNotifications } from '../context/NotificationContext';
import { useRun } from '../context/ToastContext';
import { Badge, Button, Card, DataTable, Empty, Field, PageHeader, Pagination } from '../components/ui';

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
// where each notification should take the admin
const linkFor = (n) => (n.data?.orderId ? '/orders' : n.type === 'MAVSHI_REQUEST' ? '/mavshis' : n.type === 'USER' ? '/users' : null);

function Inbox() {
  const { items, unread, loading, markRead, markAll, remove } = useNotifications();
  return (
    <Card>
      <div className="row between"><strong>{unread} unread</strong><Button size="sm" variant="ghost" disabled={!unread} onClick={markAll}>Mark all as read</Button></div>
      {!items.length && !loading ? <Empty text="You're all caught up. New orders and requests will show up here." /> : (
        <ul className="notes">
          {items.map((n) => (
            <li key={n.id} className={n.read ? '' : 'unread'}>
              <div>
                <b>{n.title}</b><p>{n.body}</p>
                <small>{when(n.createdAt)} {linkFor(n) && <Link to={linkFor(n)} onClick={() => markRead(n.id)}>Open</Link>}</small>
              </div>
              <div className="row">
                {!n.read && <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>}
                <Button size="sm" variant="ghost" onClick={() => remove(n.id)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Send({ onSent }) {
  const run = useRun();
  const [v, setV] = useState({ target: 'ALL', role: 'CUSTOMER', title: '', body: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    const body = { target: v.target, title: v.title, body: v.body, ...(v.target === 'ROLE' ? { role: v.role } : {}) };
    if (await run(() => admin.sendNotification(body))) { setV({ ...v, title: '', body: '' }); onSent(); }
    setBusy(false);
  };
  return (
    <Card>
      <form className="form" onSubmit={submit}>
        <p className="muted">Sends an in-app notification and a push to everyone who has the app installed. To message one person, use <b>Notify</b> on the Users page.</p>
        <div className="grid2">
          <Field label="Send to" type="select" value={v.target} onChange={set('target')} options={[{ value: 'ALL', label: 'Everyone' }, { value: 'ROLE', label: 'One group' }]} />
          {v.target === 'ROLE' && <Field label="Group" type="select" value={v.role} onChange={set('role')}
            options={[['CUSTOMER', 'Customers'], ['MAVSHI', 'Mess owners'], ['DELIVERY', 'Delivery boys'], ['ADMIN', 'Admins']].map(([value, label]) => ({ value, label }))} />}
        </div>
        <Field label="Title" value={v.title} onChange={set('title')} required minLength={2} maxLength={80} />
        <Field label="Message" type="textarea" value={v.body} onChange={set('body')} required minLength={2} maxLength={300} />
        <div className="actions"><Button loading={busy}>Send notification</Button></div>
      </form>
    </Card>
  );
}

function History({ refreshKey }) {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useApi(() => admin.sentNotifications({ page, limit: 10 }), [page, refreshKey]);
  return (
    <Card>
      <DataTable rows={asList(data)} loading={loading} error={error} onRetry={reload} empty="Nothing sent yet." columns={[
        { header: 'Sent', render: (r) => when(r.createdAt) },
        { header: 'To', render: (r) => <Badge value={r.target === 'ROLE' ? r.role : r.target} /> },
        { header: 'Message', render: (r) => <><b>{r.title}</b><small>{r.body}</small></> },
        { header: 'Reached', render: (r) => r.recipients },
        { header: 'By', render: (r) => r.sentByName || '-' }]} />
      <Pagination meta={meta} page={page} onPage={setPage} />
    </Card>
  );
}

export default function Notifications() {
  const [tab, setTab] = useState('inbox');
  const [key, setKey] = useState(0);
  const { unread } = useNotifications();
  return (
    <>
      <PageHeader title="Notifications" sub="Alerts for you, and announcements to your users" />
      <div className="tabs" role="tablist">
        {[['inbox', `Inbox${unread ? ` (${unread})` : ''}`], ['send', 'Send announcement'], ['sent', 'Sent history']].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>))}
      </div>
      {tab === 'inbox' && <Inbox />}
      {tab === 'send' && <Send onSent={() => { setKey((k) => k + 1); setTab('sent'); }} />}
      {tab === 'sent' && <History refreshKey={key} />}
    </>
  );
}
