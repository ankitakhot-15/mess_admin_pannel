import { Link } from 'react-router-dom';
import { admin } from '../api/client';
import { money, useApi } from '../hooks/useApi';
import { Badge, Card, DataTable, ErrorBox, PageHeader, Spinner, StatCard } from '../components/ui';

const label = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

export default function Dashboard() {
  const { data, loading, error, reload } = useApi(() => admin.dashboard(), []);
  const stats = Object.entries(data || {}).filter(([, v]) => typeof v === 'number');
  return (
    <>
      <PageHeader title="Dashboard" sub="Platform overview" />
      {loading ? <div className="center"><Spinner /></div> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <>
          <div className="stats">{stats.map(([k, v]) => <StatCard key={k} label={label(k)} value={/revenue/i.test(k) ? money(v) : v} />)}</div>
          <Card>
            <div className="row between"><h3 style={{ margin: 0 }}>Latest orders</h3><Link to="/orders">See all orders</Link></div>
            <DataTable rows={data?.recentOrders || []} empty="No orders yet." columns={[
              { header: 'Order', render: (r) => <b>#{r.orderNumber}</b> }, { header: 'Customer', render: (r) => r.customerName },
              { header: 'Mess', render: (r) => r.mavshiName }, { header: 'Total', render: (r) => money(r.pricing?.total) },
              { header: 'Status', render: (r) => <Badge value={r.status} /> }]} />
          </Card>
        </>
      )}
    </>
  );
}
