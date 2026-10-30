import { useEffect, useState } from 'react';

export const Spinner = () => <div className="spinner" role="progressbar" aria-label="Loading" />;

export function Button({ variant = 'primary', size, loading, disabled, children, ...p }) {
  return <button className={`btn ${variant} ${size || ''}`} {...p} disabled={disabled || loading}>{loading ? 'Please wait…' : children}</button>;
}

const TONES = {
  green: ['ACTIVE', 'ACCEPTED', 'DELIVERED', 'READY', 'PAID', 'true'],
  amber: ['PENDING', 'PLACED', 'PAYMENT_PENDING', 'PREPARING', 'OUT_FOR_DELIVERY'],
  red: ['REJECTED', 'BLOCKED', 'CANCELLED', 'INACTIVE', 'false'],
};
export function Badge({ value }) {
  const v = String(value ?? '-');
  const tone = Object.keys(TONES).find((k) => TONES[k].includes(v)) || 'gray';
  return <span className={`badge ${tone}`}>{v.replaceAll('_', ' ')}</span>;
}

export function PageHeader({ title, sub, children }) {
  return <div className="page-head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div><div className="row">{children}</div></div>;
}

export function Card({ children, className = '' }) { return <section className={`card ${className}`}>{children}</section>; }

export function StatCard({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

export function Empty({ text = 'Nothing here yet.' }) { return <div className="empty">{text}</div>; }

export function ErrorBox({ message, onRetry }) {
  return <div className="error-box">{message} {onRetry && <button className="link" onClick={onRetry}>Try again</button>}</div>;
}

export function Field({ label, type = 'text', options, error, ...p }) {
  return (
    <label className="field">
      <span>{label}</span>
      {type === 'select' ? (
        <select {...p}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      ) : type === 'textarea' ? <textarea rows={3} {...p} /> : <input type={type} {...p} />}
      {error && <em>{error}</em>}
    </label>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close">✕</button></header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/** Config-driven form in a modal. fields: [{name,label,type,options,required,...}] */
export function FormModal({ title, fields, initial = {}, submitLabel = 'Save changes', note, onSubmit, onClose, danger }) {
  const [v, setV] = useState(() => Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? (f.type === 'checkbox' ? false : '')])));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    const out = { ...v };
    fields.forEach((f) => { if (f.type === 'number' && out[f.name] !== '') out[f.name] = Number(out[f.name]); });
    try { await onSubmit(out); } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="form">
        {note && <p className="muted">{note}</p>}
        {fields.map(({ name, type, ...f }) =>
          type === 'checkbox' ? (
            <label key={name} className="check"><input type="checkbox" checked={v[name]} onChange={(e) => setV({ ...v, [name]: e.target.checked })} />{f.label}</label>
          ) : (
            <Field key={name} type={type} {...f} value={v[name]} onChange={(e) => setV({ ...v, [name]: e.target.value })} />
          ))}
        {err && <div className="error-box">{err}</div>}
        <div className="actions"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} loading={busy}>{submitLabel}</Button></div>
      </form>
    </Modal>
  );
}

export function ConfirmModal({ title, text, confirmLabel = 'Confirm', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <p>{text}</p>
      <div className="actions"><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" loading={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }}>{confirmLabel}</Button></div>
    </Modal>
  );
}

export function DataTable({ columns, rows, loading, error, onRetry, empty }) {
  if (error) return <ErrorBox message={error} onRetry={onRetry} />;
  if (loading && !rows.length) return <div className="center"><Spinner /></div>;
  if (!rows.length) return <Empty text={empty} />;
  return (
    <div className={`table-wrap ${loading ? 'dim' : ''}`}>
      <table>
        <thead><tr>{columns.map((c) => <th key={c.header}>{c.header}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r._id || r.id || i}>{columns.map((c) => <td key={c.header} data-label={c.header}>{c.render(r)}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function Pagination({ meta, page, onPage, limit = 10 }) {
  const total = meta?.total ?? 0;
  const pages = meta?.totalPages ?? Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="pager">
      <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
      <span>Page {page} of {pages}</span>
      <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  );
}

export function FilterBar({ filters, values, onChange }) {
  return (
    <div className="filters">
      {filters.map(({ name, type = 'text', ...f }) => (
        <Field key={name} type={type} {...f} value={values[name]} onChange={(e) => onChange({ ...values, [name]: e.target.value })} />
      ))}
    </div>
  );
}
