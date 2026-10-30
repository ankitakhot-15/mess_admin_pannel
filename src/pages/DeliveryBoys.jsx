import { useState } from 'react';
import { admin } from '../api/client';
import { asList, useApi } from '../hooks/useApi';
import { Badge, Card, DataTable, FilterBar, PageHeader, Pagination } from '../components/ui';

export default function DeliveryBoys() {
  const [f, setF] = useState({ pincode: '', available: '', status: '' });
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useApi(() => admin.deliveryBoys({ ...f, page, limit: 10 }), [f, page]);
  const cols = [
    { header: 'Name', render: (r) => <b>{r.fullName}</b> },
    { header: 'Mobile', render: (r) => r.mobile },
    { header: 'Pincode', render: (r) => r.pincode },
    { header: 'Vehicle', render: (r) => r.profile?.vehicleType || '-' },
    { header: 'Live orders', render: (r) => r.activeOrders },
    { header: 'Duty', render: (r) => <Badge value={r.isAvailable === false ? 'OFF DUTY' : 'ACTIVE'} /> },
    { header: 'Last seen in', render: (r) => r.currentLocation?.areaName || '-' },
    { header: 'Account', render: (r) => <Badge value={r.status} /> },
  ];
  return (
    <>
      <PageHeader title="Delivery boys" sub="Who is on duty and how many deliveries each has right now" />
      <Card>
        <FilterBar values={f} onChange={(v) => { setF(v); setPage(1); }} filters={[
          { name: 'pincode', label: 'Pincode', maxLength: 6 },
          { name: 'available', label: 'Duty', type: 'select', options: [{ value: '', label: 'All' }, { value: 'true', label: 'On duty' }, { value: 'false', label: 'Off duty' }] },
          { name: 'status', label: 'Account', type: 'select', options: ['', 'ACTIVE', 'BLOCKED'].map((v) => ({ value: v, label: v || 'All' })) }]} />
        <DataTable columns={cols} rows={asList(data)} loading={loading} error={error} onRetry={reload} empty="No delivery boys found." />
        <Pagination meta={meta} page={page} onPage={setPage} />
      </Card>
    </>
  );
}
