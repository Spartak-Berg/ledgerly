import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import { Download, Filter, Plus, Receipt, UserPlus } from 'lucide-react';
import {
  Button,
  Card,
  MenuButton,
  MetricCard,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatusBadge,
  TableWrap,
} from '../components';
import { cashFlow, customers, expenses, invoices } from '../data';
import { money, shortDate } from '../lib';

export function Dashboard() {
  const statusData = [
    { name: 'Paid', value: 61, color: '#16a36a' },
    { name: 'Sent', value: 25, color: '#3b73ed' },
    { name: 'Overdue', value: 9, color: '#e04747' },
    { name: 'Draft', value: 5, color: '#9aa2b1' },
  ];
  return (
    <div className="page">
      <PageHeader
        title="Good morning, Spartak"
        description="Here’s what’s happening with Nordic Studio this month."
        action={
          <div className="button-row">
            <Button variant="secondary">
              <Download size={16} /> Export
            </Button>
            <Link
              className="button button-primary"
              to="/invoices/new"
            >
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
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart data={cashFlow}>
                <defs>
                  <linearGradient
                    id="income"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#3b73ed"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="#3b73ed"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                />
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
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={58}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((x) => (
                    <Cell
                      key={x.name}
                      fill={x.color}
                    />
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
          <Link to="/customers">
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
                <Link
                  className="strong-link"
                  to="/invoices"
                >
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
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const list = customers.filter(
    (x) =>
      (status === 'All' || x.status === status) &&
      `${x.company} ${x.contact} ${x.email}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <PageHeader
        title="Customers"
        description="Manage customer details, contacts and outstanding balances."
        action={
          <Button>
            <Plus size={16} /> Add customer
          </Button>
        }
      />
      <Card>
        <div className="filterbar">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers…"
          />
          <div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>All</option>
              <option>Active</option>
              <option>Lead</option>
              <option>Archived</option>
            </Select>
            <Button variant="secondary">
              <Filter size={16} /> Filters
            </Button>
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
                  <th className="number">Outstanding</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <Link
                        className="customer-cell"
                        to={`/customers/${x.id}`}
                      >
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
                    <td className="number strong">{money(x.outstanding)}</td>
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
        </div>
        <div className="mobile-cards">
          {list.map((x) => (
            <Link
              to={`/customers/${x.id}`}
              className="mobile-record"
              key={x.id}
            >
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
                  <dt>Outstanding</dt>
                  <dd>{money(x.outstanding)}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
        <Pagination />
      </Card>
    </div>
  );
}

export function CustomerDetail() {
  const { id } = useParams();
  const customer = customers.find((x) => x.id === id) ?? customers[0];
  const [tab, setTab] = useState('Overview');
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
          <Button variant="secondary">Edit customer</Button>
          <Link
            className="button button-primary"
            to="/invoices/new"
          >
            <Plus size={16} /> Create invoice
          </Link>
        </div>
      </div>
      <div
        className="tabs"
        role="tablist"
      >
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
                <dd>{customer.contact}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${customer.email}`}>{customer.email}</a>
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{customer.phone}</dd>
              </div>
              <div>
                <dt>Organisation no.</dt>
                <dd>923 456 781</dd>
              </div>
              <div>
                <dt>Billing address</dt>
                <dd>
                  Storgata 14
                  <br />
                  0155 Oslo, Norway
                </dd>
              </div>
            </dl>
          </Card>
          <div>
            <Card className="balance">
              <p>Outstanding balance</p>
              <strong>{money(customer.outstanding)}</strong>
              <span>Across 2 open invoices</span>
            </Card>
            <Card className="mini-stats">
              <div>
                <span>Total invoiced</span>
                <b>{money(286400)}</b>
              </div>
              <div>
                <span>Average payment time</span>
                <b>12 days</b>
              </div>
            </Card>
          </div>
        </div>
      ) : tab === 'Invoices' ? (
        <Card>
          <InvoiceTable />
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
    </div>
  );
}

export function Invoices() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('All');
  const list = useMemo(
    () =>
      invoices.filter(
        (x) =>
          (tab === 'All' || x.status === tab) &&
          `${x.number} ${x.customer}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, tab],
  );
  return (
    <div className="page">
      <PageHeader
        title="Invoices"
        description="Create, send and track customer invoices."
        action={
          <Link
            className="button button-primary"
            to="/invoices/new"
          >
            <Plus size={16} /> Create invoice
          </Link>
        }
      />
      <div className="tabs invoice-tabs">
        {['All', 'Draft', 'Sent', 'Paid', 'Overdue'].map((x) => (
          <button
            className={tab === x ? 'active' : ''}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
            <span>
              {x === 'All'
                ? invoices.length
                : invoices.filter((i) => i.status === x).length}
            </span>
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
            <Select>
              <option>All dates</option>
              <option>This month</option>
              <option>Last month</option>
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
                  <td className="strong">{x.number}</td>
                  <td>{x.customer}</td>
                  <td>{shortDate(x.issueDate)}</td>
                  <td className={x.status === 'Overdue' ? 'overdue' : ''}>
                    {shortDate(x.dueDate)}
                  </td>
                  <td>
                    <StatusBadge>{x.status}</StatusBadge>
                  </td>
                  <td className="number strong">{money(x.amount)}</td>
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
          <Link
            className="button button-primary"
            to="/expenses/upload"
          >
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
