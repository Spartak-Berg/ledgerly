import { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Download,
  Filter,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  Input,
  MenuButton,
  MetricCard,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatusBadge,
  TableWrap,
} from '../components';
import { customerApi, type CustomerInput } from '../api';
import { CustomerDialog } from '../CustomerDialog';
import { cashFlow, expenses, invoices } from '../data';
import { money, shortDate, type Customer } from '../lib';
import { useAuth } from '../useAuth';
import {
  invoicesApi,
  type Invoice as PersistedInvoice,
  type InvoiceStatus as PersistedInvoiceStatus,
} from '../invoices-api';

export function Dashboard() {
  const { profile } = useAuth();
  const firstName = profile?.user.fullName.split(/\s+/)[0] ?? 'there';
  const statusData = [
    { name: 'Paid', value: 61, color: '#16a36a' },
    { name: 'Sent', value: 25, color: '#3b73ed' },
    { name: 'Overdue', value: 9, color: '#e04747' },
    { name: 'Draft', value: 5, color: '#9aa2b1' },
  ];
  return (
    <div className="page">
      <PageHeader
        title={`Good morning, ${firstName}`}
        description={`Here’s what’s happening with ${profile?.company.name ?? 'your company'} this month.`}
        action={
          <div className="button-row">
            <Button variant="secondary">
              <Download size={16} /> Export
            </Button>
            <Link className="button button-primary" to="/invoices/new">
              <Plus size={16} /> New invoice
            </Link>
          </div>
        }
      />
      <div className="metrics">
        <MetricCard
          label="Revenue this month"
          value={money(312450)}
          change="↑ 12.4% from last month"
          tone="positive"
        />
        <MetricCard
          label="Expenses this month"
          value={money(134280)}
          change="↑ 5.2% from last month"
          tone="negative"
        />
        <MetricCard
          label="Outstanding"
          value={money(170300)}
          change="4 invoices awaiting payment"
        />
        <MetricCard
          label="Net profit"
          value={money(178170)}
          change="↑ 18.1% from last month"
          tone="positive"
        />
      </div>
      <div className="dashboard-grid">
        <Card className="chart-card wide">
          <div className="card-head">
            <div>
              <h3>Cash flow</h3>
              <p>Income and expenses over the last 6 months</p>
            </div>
            <Select aria-label="Chart period">
              <option>Last 6 months</option>
              <option>This year</option>
            </Select>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlow}>
                <defs>
                  <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b73ed" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b73ed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}k`}
                />
                <Tooltip formatter={(v) => money(Number(v) * 1000)} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#3b73ed"
                  strokeWidth={2}
                  fill="url(#income)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#9aa2b1"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            <span>
              <i className="blue" />
              Income
            </span>
            <span>
              <i className="gray" />
              Expenses
            </span>
          </div>
        </Card>
        <Card className="chart-card">
          <div className="card-head">
            <div>
              <h3>Invoice status</h3>
              <p>July overview</p>
            </div>
          </div>
          <div className="donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={58}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((x) => (
                    <Cell key={x.name} fill={x.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <strong>
              24<small>invoices</small>
            </strong>
          </div>
          <div className="status-legend">
            {statusData.map((x) => (
              <span key={x.name}>
                <i style={{ background: x.color }} />
                {x.name}
                <b>{x.value}%</b>
              </span>
            ))}
          </div>
        </Card>
      </div>
      <div className="dashboard-grid">
        <Card className="wide">
          <div className="card-head padded">
            <div>
              <h3>Recent invoices</h3>
              <p>Latest customer billing activity</p>
            </div>
            <Link to="/invoices">View all</Link>
          </div>
          <InvoiceTable compact />
        </Card>
        <Card className="quick">
          <div className="card-head">
            <div>
              <h3>Quick actions</h3>
              <p>Common tasks</p>
            </div>
          </div>
          <Link to="/invoices/new">
            <span>
              <Plus />
            </span>
            <div>
              <b>Create an invoice</b>
              <small>Bill a customer for your work</small>
            </div>
          </Link>
          <Link to="/expenses/upload">
            <span>
              <Receipt />
            </span>
            <div>
              <b>Upload a receipt</b>
              <small>Record a business expense</small>
            </div>
          </Link>
          <Link to="/customers?new=1">
            <span>
              <UserPlus />
            </span>
            <div>
              <b>Add a customer</b>
              <small>Create a new customer record</small>
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
}

function InvoiceTable({ compact = false }: { compact?: boolean }) {
  return (
    <TableWrap>
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Due date</th>
            <th>Status</th>
            <th className="number">Amount</th>
            {!compact && <th />}
          </tr>
        </thead>
        <tbody>
          {invoices.slice(0, compact ? 4 : 5).map((x) => (
            <tr key={x.id}>
              <td>
                <Link className="strong-link" to="/invoices">
                  {x.number}
                </Link>
              </td>
              <td>{x.customer}</td>
              <td>{shortDate(x.dueDate)}</td>
              <td>
                <StatusBadge>{x.status}</StatusBadge>
              </td>
              <td className="number strong">{money(x.amount)}</td>
              {!compact && (
                <td>
                  <MenuButton />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

export function Customers() {
  const { profile } = useAuth();
  const canManage =
    profile?.company.role === 'OWNER' || profile?.company.role === 'ADMIN';
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Customer | null>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingArchive, setPendingArchive] = useState<Customer>();
  const [archiving, setArchiving] = useState(false);
  const query = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? 'All';
  const showDialog = editing !== undefined || searchParams.get('new') === '1';

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set('search', query);
      if (status !== 'All') params.set('status', status.toUpperCase());
      customerApi
        .search(params)
        .then((result) => active && setList(result.items))
        .catch(
          (reason: unknown) =>
            active &&
            setError(
              reason instanceof Error
                ? reason.message
                : 'Could not load customers',
            ),
        )
        .finally(() => active && setLoading(false));
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, status]);

  const filtered = list;

  const closeDialog = () => {
    setEditing(undefined);
    if (searchParams.has('new')) {
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  };

  const saveCustomer = async (input: CustomerInput) => {
    if (editing) {
      const updated = await customerApi.update(editing.id, input);
      setList((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } else {
      const created = await customerApi.create(input);
      setList((current) =>
        [...current, created].sort((a, b) =>
          a.company.localeCompare(b.company),
        ),
      );
    }
    closeDialog();
  };

  const removeCustomer = async (customer: Customer) => {
    setArchiving(true);
    try {
      await customerApi.remove(customer.id);
      setList((current) => current.filter((item) => item.id !== customer.id));
      setPendingArchive(undefined);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not archive customer',
      );
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Customers"
        description="Manage customer details and billing contacts."
        action={
          canManage ? (
            <Button onClick={() => setEditing(null)}>
              <Plus size={16} /> Add customer
            </Button>
          ) : undefined
        }
      />
      <Card>
        <div className="filterbar">
          <SearchInput
            value={query}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('q', e.target.value);
              else next.delete('q');
              setSearchParams(next, { replace: true });
            }}
            placeholder="Search customers…"
          />
          <div>
            <Select
              value={status}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value === 'All') next.delete('status');
                else next.set('status', e.target.value);
                setSearchParams(next, { replace: true });
              }}
            >
              <option>All</option>
              <option>Active</option>
              <option>Lead</option>
              <option>Archived</option>
            </Select>
          </div>
        </div>
        <div className="desktop-table">
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Contact details</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <Link className="customer-cell" to={`/customers/${x.id}`}>
                        <span>{x.company.slice(0, 2).toUpperCase()}</span>
                        <b>{x.company}</b>
                      </Link>
                    </td>
                    <td>{x.contact}</td>
                    <td>
                      <div className="stack">
                        <span>{x.email}</span>
                        <small>{x.phone}</small>
                      </div>
                    </td>
                    <td>
                      <StatusBadge>{x.status}</StatusBadge>
                    </td>
                    <td>
                      {canManage && (
                        <div className="row-actions">
                          <Button
                            variant="ghost"
                            aria-label={`Edit ${x.company}`}
                            onClick={() => setEditing(x)}
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            aria-label={`Archive ${x.company}`}
                            onClick={() => setPendingArchive(x)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </div>
        <div className="mobile-cards">
          {filtered.map((x) => (
            <div className="mobile-record" key={x.id}>
              <div>
                <span className="mini-avatar">
                  {x.company.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <b>{x.company}</b>
                  <small>{x.contact}</small>
                </span>
                <StatusBadge>{x.status}</StatusBadge>
              </div>
              <dl>
                <div>
                  <dt>Email</dt>
                  <dd>{x.email}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{x.phone || 'Not provided'}</dd>
                </div>
              </dl>
              <div className="mobile-record-actions">
                <Link
                  className="button button-secondary"
                  to={`/customers/${x.id}`}
                >
                  View
                </Link>
                {canManage && (
                  <>
                    <Button variant="secondary" onClick={() => setEditing(x)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setPendingArchive(x)}
                    >
                      Archive
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {loading && <LoadingSkeleton />}
        {!loading && error && (
          <div className="api-error" role="alert">
            {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title={list.length ? 'No matching customers' : 'No customers yet'}
            description={
              list.length
                ? 'Try changing your search or status filter.'
                : 'Add your first customer to get started.'
            }
          />
        )}
      </Card>
      {showDialog && (
        <CustomerDialog
          customer={editing ?? undefined}
          onClose={closeDialog}
          onSave={saveCustomer}
        />
      )}
      {pendingArchive && (
        <ConfirmDialog
          title={`Archive ${pendingArchive.company}?`}
          description="The customer will be hidden from active workflows while its history remains preserved."
          confirmLabel="Archive customer"
          busy={archiving}
          onCancel={() => setPendingArchive(undefined)}
          onConfirm={() => void removeCustomer(pendingArchive)}
        />
      )}
    </div>
  );
}

export function CustomerDetail() {
  const { profile } = useAuth();
  const canManage =
    profile?.company.role === 'OWNER' || profile?.company.role === 'ADMIN';
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('Overview');
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    customerApi
      .get(id)
      .then((result) => active && setCustomer(result))
      .catch(
        (reason: unknown) =>
          active &&
          setError(
            reason instanceof Error
              ? reason.message
              : 'Could not load customer',
          ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading)
    return (
      <div className="page">
        <LoadingSkeleton />
      </div>
    );
  if (!customer) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            title="Customer not found"
            description={error || 'This customer may have been deleted.'}
          />
        </Card>
      </div>
    );
  }

  const updateCustomer = async (input: CustomerInput) => {
    const updated = await customerApi.update(customer.id, input);
    setCustomer(updated);
    setEditing(false);
  };

  const removeCustomer = async () => {
    try {
      await customerApi.remove(customer.id);
      navigate('/customers');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not archive customer',
      );
    }
  };

  return (
    <div className="page">
      <div className="detail-head">
        <div className="detail-title">
          <span>{customer.company.slice(0, 2).toUpperCase()}</span>
          <div>
            <p>
              <Link to="/customers">Customers</Link> / Customer
            </p>
            <h1>{customer.company}</h1>
            <StatusBadge>{customer.status}</StatusBadge>
          </div>
        </div>
        <div className="button-row">
          {canManage && (
            <>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit customer
              </Button>
              <Button variant="ghost" onClick={() => setConfirmArchive(true)}>
                <Trash2 size={16} /> Archive
              </Button>
            </>
          )}
          <Link
            className="button button-primary"
            to={`/invoices/new?customer=${customer.id}`}
          >
            <Plus size={16} /> Create invoice
          </Link>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {['Overview', 'Invoices', 'Notes', 'Activity'].map((x) => (
          <button
            role="tab"
            aria-selected={tab === x}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>
      {tab === 'Overview' ? (
        <div className="detail-grid">
          <Card>
            <div className="card-head">
              <h3>Contact information</h3>
            </div>
            <dl className="details">
              <div>
                <dt>Contact person</dt>
                <dd>{customer.contact || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`}>{customer.email}</a>
                  ) : (
                    'Not provided'
                  )}
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{customer.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Organisation number</dt>
                <dd>{customer.organisationNumber || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Billing address</dt>
                <dd>
                  {[
                    customer.billingAddressLine1,
                    customer.billingPostalCode,
                    customer.billingCity,
                    customer.countryCode,
                  ]
                    .filter(Boolean)
                    .join(', ') || 'Not provided'}
                </dd>
              </div>
              <div>
                <dt>VAT number</dt>
                <dd>{customer.vatNumber || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Payment terms</dt>
                <dd>
                  {customer.defaultPaymentDays} days ·{' '}
                  {customer.defaultCurrency}
                </dd>
              </div>
            </dl>
          </Card>
          <div>
            <Card className="balance">
              <p>Outstanding balance</p>
              <strong>{money(customer.outstanding)}</strong>
              <span>
                Invoice balances will appear after invoice integration
              </span>
            </Card>
            <Card className="mini-stats">
              <div>
                <span>Total invoiced</span>
                <b>—</b>
              </div>
              <div>
                <span>Average payment time</span>
                <b>—</b>
              </div>
            </Card>
          </div>
        </div>
      ) : tab === 'Invoices' ? (
        <Card>
          <EmptyState
            title="No connected invoices yet"
            description="Customer-specific invoices will appear here after invoice persistence is connected."
          />
        </Card>
      ) : (
        <Card>
          <div className="empty">
            <strong>No {tab.toLowerCase()} yet</strong>
            <p>
              Updates will appear here as your team works with this customer.
            </p>
          </div>
        </Card>
      )}
      {error && (
        <div className="api-error" role="alert">
          {error}
        </div>
      )}
      {editing && (
        <CustomerDialog
          customer={customer}
          onClose={() => setEditing(false)}
          onSave={updateCustomer}
        />
      )}
      {confirmArchive && (
        <ConfirmDialog
          title={`Archive ${customer.company}?`}
          description="The customer history will remain preserved."
          confirmLabel="Archive customer"
          onCancel={() => setConfirmArchive(false)}
          onConfirm={() => void removeCustomer()}
        />
      )}
    </div>
  );
}

export function Invoices() {
  const { profile } = useAuth();
  const canManage = profile?.company.role !== 'EMPLOYEE';
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('All');
  const [list, setList] = useState<PersistedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingArchive, setPendingArchive] = useState<PersistedInvoice>();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      if (tab === 'Outstanding') params.set('outstanding', 'true');
      else if (tab !== 'All')
        params.set('status', tab.toUpperCase().replace(' ', '_'));
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (minAmount)
        params.set(
          'minAmountMinor',
          String(Math.round(Number(minAmount) * 100)),
        );
      if (maxAmount)
        params.set(
          'maxAmountMinor',
          String(Math.round(Number(maxAmount) * 100)),
        );
      setLoading(true);
      invoicesApi
        .list(params)
        .then((result) => {
          if (!active) return;
          setList(result);
          setError('');
        })
        .catch(
          (reason: unknown) =>
            active &&
            setError(
              reason instanceof Error
                ? reason.message
                : 'Could not load invoices',
            ),
        )
        .finally(() => active && setLoading(false));
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, tab, dateFrom, dateTo, minAmount, maxAmount]);

  const label = (status: PersistedInvoiceStatus) =>
    status
      .toLowerCase()
      .replace('_', ' ')
      .replace(/^./, (character) => character.toUpperCase());

  const duplicate = async (invoice: PersistedInvoice) => {
    try {
      const copy = await invoicesApi.duplicate(invoice.id);
      setList((current) => [copy, ...current]);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not duplicate invoice',
      );
    }
  };

  const archive = async () => {
    if (!pendingArchive) return;
    try {
      await invoicesApi.archive(pendingArchive.id);
      setList((current) =>
        current.filter((item) => item.id !== pendingArchive.id),
      );
      setPendingArchive(undefined);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not archive invoice',
      );
    }
  };
  return (
    <div className="page">
      <PageHeader
        title="Invoices"
        description="Create, send and track customer invoices."
        action={
          canManage ? (
            <Link className="button button-primary" to="/invoices/new">
              <Plus size={16} /> Create invoice
            </Link>
          ) : undefined
        }
      />
      <div className="tabs invoice-tabs">
        {[
          'All',
          'Outstanding',
          'Draft',
          'Issued',
          'Sent',
          'Partially paid',
          'Paid',
          'Overdue',
          'Void',
        ].map((x) => (
          <button
            className={tab === x ? 'active' : ''}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>
      <Card>
        <div className="filterbar">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoices…"
          />
          <div>
            <Input
              aria-label="Issued from"
              title="Issued from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <Input
              aria-label="Issued to"
              title="Issued to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
            <Input
              aria-label="Minimum amount"
              placeholder="Min amount"
              type="number"
              min="0"
              step="0.01"
              value={minAmount}
              onChange={(event) => setMinAmount(event.target.value)}
            />
            <Input
              aria-label="Maximum amount"
              placeholder="Max amount"
              type="number"
              min="0"
              step="0.01"
              value={maxAmount}
              onChange={(event) => setMaxAmount(event.target.value)}
            />
          </div>
        </div>
        {error && (
          <div className="api-error" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <LoadingSkeleton />
        ) : list.length ? (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th className="number">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((x) => (
                  <tr key={x.id}>
                    <td className="strong">
                      <Link className="strong-link" to={`/invoices/${x.id}`}>
                        {x.number ?? 'Draft'}
                      </Link>
                    </td>
                    <td>{x.customerNameSnapshot}</td>
                    <td>{shortDate(x.issueDate)}</td>
                    <td className={x.status === 'OVERDUE' ? 'overdue' : ''}>
                      {shortDate(x.dueDate)}
                    </td>
                    <td>
                      <StatusBadge>{label(x.status)}</StatusBadge>
                    </td>
                    <td className="number strong">
                      {money(x.totalMinor / 100, x.currency)}
                      {x.amountPaidMinor > 0 && (
                        <small>
                          {money(x.remainingMinor / 100, x.currency)} remaining
                        </small>
                      )}
                    </td>
                    <td>
                      {x.status === 'DRAFT' && canManage && (
                        <div className="row-actions">
                          <Link
                            className="button button-ghost"
                            to={`/invoices/${x.id}/edit`}
                          >
                            <Pencil size={15} /> Edit
                          </Link>
                          <Button
                            variant="ghost"
                            onClick={() => void duplicate(x)}
                          >
                            Duplicate
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setPendingArchive(x)}
                          >
                            Archive
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState
            title="No invoices found"
            description="Create a draft or adjust the current filters."
          />
        )}
      </Card>
      {pendingArchive && (
        <ConfirmDialog
          title="Archive this draft?"
          description="The draft will be hidden from the invoice list."
          confirmLabel="Archive draft"
          onCancel={() => setPendingArchive(undefined)}
          onConfirm={() => void archive()}
        />
      )}
    </div>
  );
}

export function Expenses() {
  const [query, setQuery] = useState('');
  const list = expenses.filter((x) =>
    `${x.merchant} ${x.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <PageHeader
        title="Expenses"
        description="Track receipts, purchases and business spending."
        action={
          <Link className="button button-primary" to="/expenses/upload">
            <Plus size={16} /> Upload receipt
          </Link>
        }
      />
      <div className="metrics expense-metrics">
        <MetricCard
          label="Total this month"
          value={money(134280)}
          change="↑ 5.2% vs last month"
          tone="negative"
        />
        <MetricCard
          label="Awaiting review"
          value={money(8130)}
          change="2 expenses"
        />
        <MetricCard
          label="Recoverable VAT"
          value={money(21840)}
          change="For current period"
          tone="positive"
        />
      </div>
      <Card>
        <div className="filterbar">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search expenses…"
          />
          <div>
            <Select>
              <option>All categories</option>
              <option>Software</option>
              <option>Travel</option>
              <option>Office</option>
            </Select>
            <Button variant="secondary">
              <Filter size={16} /> Filters
            </Button>
          </div>
        </div>
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Date</th>
                <th className="number">VAT</th>
                <th className="number">Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id}>
                  <td>
                    <span
                      className="receipt-thumb"
                      style={{ background: x.color }}
                    >
                      <Receipt size={16} />
                    </span>
                  </td>
                  <td className="strong">{x.merchant}</td>
                  <td>{x.category}</td>
                  <td>{shortDate(x.date)}</td>
                  <td className="number muted">{money(x.vat)}</td>
                  <td className="number strong">{money(x.amount)}</td>
                  <td>
                    <StatusBadge>{x.status}</StatusBadge>
                  </td>
                  <td>
                    <MenuButton />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <Pagination />
      </Card>
    </div>
  );
}
