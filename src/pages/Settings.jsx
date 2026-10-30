import { useEffect, useState } from 'react';
import { admin } from '../api/client';
import { useApi } from '../hooks/useApi';
import { useRun } from '../context/ToastContext';
import { Button, Card, ErrorBox, Field, PageHeader, Spinner } from '../components/ui';

export default function Settings() {
  const run = useRun();
  const { data, loading, error, reload } = useApi(() => admin.settings(), []);
  const [v, setV] = useState({ deliveryCharge: '', baseDeliveryMinutes: '', NORMAL: 0, MODERATE: 10, HEAVY: 20 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const t = data.trafficExtraMinutes || {};
    setV({ deliveryCharge: data.deliveryCharge ?? '', baseDeliveryMinutes: data.baseDeliveryMinutes ?? '', NORMAL: t.NORMAL ?? 0, MODERATE: t.MODERATE ?? 10, HEAVY: t.HEAVY ?? 20 });
  }, [data]);

  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    const body = { deliveryCharge: +v.deliveryCharge, baseDeliveryMinutes: +v.baseDeliveryMinutes, trafficExtraMinutes: { NORMAL: +v.NORMAL, MODERATE: +v.MODERATE, HEAVY: +v.HEAVY } };
    if (await run(() => admin.saveSettings(body), 'Settings saved')) reload();
    setBusy(false);
  };
  return (
    <>
      <PageHeader title="Delivery settings" sub="Menu prices never include delivery. The charge below is added at checkout." />
      {loading ? <div className="center"><Spinner /></div> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <Card>
          <form className="form grid2" onSubmit={save}>
            <Field label="Delivery charge (₹)" type="number" min={0} value={v.deliveryCharge} onChange={set('deliveryCharge')} required />
            <Field label="Base delivery time (minutes)" type="number" min={1} value={v.baseDeliveryMinutes} onChange={set('baseDeliveryMinutes')} required />
            <Field label="Extra minutes: normal traffic" type="number" min={0} value={v.NORMAL} onChange={set('NORMAL')} />
            <Field label="Extra minutes: moderate traffic" type="number" min={0} value={v.MODERATE} onChange={set('MODERATE')} />
            <Field label="Extra minutes: heavy traffic" type="number" min={0} value={v.HEAVY} onChange={set('HEAVY')} />
            <div className="actions span2"><Button loading={busy}>Save settings</Button></div>
          </form>
        </Card>
      )}
    </>
  );
}
