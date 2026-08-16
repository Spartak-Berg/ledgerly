import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  Building2,
  Check,
  CloudUpload,
  Download,
  FileText,
  KeyRound,
  Palette,
  Plus,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import {
  Button,
  Card,
  Field,
  Input,
  MetricCard,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
} from '../components';
import { customerApi } from '../api';
import { cashFlow } from '../data';
import { downloadInvoicePdf } from '../invoicePdf';
import { invoiceTotals, money, type Customer, type LineItem } from '../lib';

const invoiceSchema = z.object({
  customer: z.string().min(1, 'Select a customer'),
  number: z.string().min(1),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  currency: z.string(),
  notes: z.string(),
  terms: z.string(),
  items: z
    .array(
      z.object({
        id: z.string(),
        description: z.string().min(1),
        quantity: z.number().min(0.01),
        unitPrice: z.number().min(0),
        vatRate: z.number(),
      }),
    )
    .min(1),
});
type InvoiceForm = z.infer<typeof invoiceSchema>;
export function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState('');
  const {
    register,
    control,
    watch,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer: searchParams.get('customer') ?? '',
      number: 'INV-2026-0143',
      issueDate: '2026-07-21',
      dueDate: '2026-08-20',
      currency: 'NOK',
      notes: 'Thank you for your business.',
      terms: 'Payment due within 30 days.',
      items: [
        {
          id: crypto.randomUUID(),
          description: 'Brand strategy and visual direction',
          quantity: 1,
          unitPrice: 32000,
          vatRate: 25,
        },
        {
          id: crypto.randomUUID(),
          description: 'Design system implementation',
          quantity: 24,
          unitPrice: 1450,
          vatRate: 25,
        },
      ],
    },
  });
  useEffect(() => {
    let active = true;
    customerApi
      .list()
      .then((result) => active && setCustomerList(result))
      .catch((reason: unknown) =>
        active &&
        setCustomersError(
          reason instanceof Error ? reason.message : 'Could not load customers',
        ),
      )
      .finally(() => active && setCustomersLoading(false));
    return () => {
      active = false;
    };
  }, []);
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  // React Hook Form's watch subscription intentionally drives the live preview.
  // eslint-disable-next-line react-hooks/incompatible-library
  const values = watch();
  const totals = invoiceTotals(values.items as LineItem[]);
  const customer = customerList.find((c) => c.id === values.customer);
  const downloadPdf = async (data: InvoiceForm) => {
    const selectedCustomer = customerList.find((item) => item.id === data.customer);
    if (!selectedCustomer) {
      setError('customer', { message: 'Select an available customer' });
      return;
    }
    await downloadInvoicePdf({ ...data, customer: selectedCustomer });
  };
  const save = (action: string) => () => {
    window.alert(`Invoice ${action} (mock workflow)`);
    navigate('/invoices');
  };
  return (
    <div className="page invoice-create">
      <div className="back-row">
        <Link to="/invoices">
          <ArrowLeft size={17} /> Invoices
        </Link>
        <StatusBadge>Draft</StatusBadge>
      </div>
      <PageHeader
        title="Create invoice"
        description="Prepare and send a professional invoice to your customer."
      />
      <form onSubmit={handleSubmit(save('saved'))}>
        <div className="invoice-layout">
          <div className="form-column">
            <Card>
              <h3>Invoice details</h3>
              <div className="form-grid">
                <Field label="Customer">
                  <Select {...register('customer')} disabled={customersLoading}>
                    <option value="">
                      {customersLoading ? 'Loading customers…' : 'Select customer'}
                    </option>
                    {customerList.map((x) => (
                      <option
                        key={x.id}
                        value={x.id}
                      >
                        {x.company}
                      </option>
                    ))}
                  </Select>
                  {errors.customer && (
                    <small className="error">{errors.customer.message}</small>
                  )}
                  {customersError && <small className="error">{customersError}</small>}
                  {!customersLoading && !customersError && customerList.length === 0 && (
                    <small>
                      No customers yet. <Link to="/customers?new=1">Add a customer</Link>
                    </small>
                  )}
                </Field>
                <Field label="Invoice number">
                  <Input {...register('number')} />
                </Field>
                <Field label="Issue date">
                  <Input
                    type="date"
                    {...register('issueDate')}
                  />
                </Field>
                <Field label="Due date">
                  <Input
                    type="date"
                    {...register('dueDate')}
                  />
                </Field>
                <Field label="Currency">
                  <Select {...register('currency')}>
                    <option>NOK</option>
                    <option>EUR</option>
                    <option>USD</option>
                  </Select>
                </Field>
              </div>
            </Card>
            <Card>
              <div className="card-head">
                <div>
                  <h3>Line items</h3>
                  <p>Add the products or services being invoiced.</p>
                </div>
              </div>
              <div className="line-items">
                <div className="line-head">
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Unit price</span>
                  <span>VAT</span>
                  <span>Total</span>
                  <span />
                </div>
                {fields.map((field, index) => (
                  <div
                    className="line-item"
                    key={field.id}
                  >
                    <Input
                      aria-label={`Item ${index + 1} description`}
                      {...register(`items.${index}.description`)}
                    />
                    <Input
                      aria-label="Quantity"
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                    <Input
                      aria-label="Unit price"
                      type="number"
                      {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    />
                    <Select
                      aria-label="VAT rate"
                      {...register(`items.${index}.vatRate`, { valueAsNumber: true })}
                    >
                      <option value="25">25%</option>
                      <option value="15">15%</option>
                      <option value="12">12%</option>
                      <option value="0">0%</option>
                    </Select>
                    <b>
                      {money(
                        (values.items[index]?.quantity || 0) *
                          (values.items[index]?.unitPrice || 0),
                      )}
                    </b>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label="Remove line item"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2 size={17} />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  append({
                    id: crypto.randomUUID(),
                    description: '',
                    quantity: 1,
                    unitPrice: 0,
                    vatRate: 25,
                  })
                }
              >
                <Plus size={16} /> Add line item
              </Button>
              <div className="totals">
                <div>
                  <span>Subtotal</span>
                  <b>{money(totals.subtotal)}</b>
                </div>
                <div>
                  <span>VAT</span>
                  <b>{money(totals.vat)}</b>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{money(totals.total)}</strong>
                </div>
              </div>
            </Card>
            <Card>
              <h3>Notes & payment</h3>
              <div className="form-grid">
                <Field label="Notes">
                  <Textarea
                    rows={3}
                    {...register('notes')}
                  />
                </Field>
                <Field label="Payment terms">
                  <Textarea
                    rows={3}
                    {...register('terms')}
                  />
                </Field>
              </div>
            </Card>
          </div>
          <aside className="preview-column">
            <div className="preview-label">
              <span>Live preview</span>
              <Button
                type="button"
                variant="ghost"
                onClick={handleSubmit(downloadPdf)}
                disabled={customersLoading || customerList.length === 0}
              >
                <Download size={16} /> PDF
              </Button>
            </div>
            <InvoicePreview
              customer={customer?.company}
              number={values.number}
              issueDate={values.issueDate}
              dueDate={values.dueDate}
              currency={values.currency}
              items={values.items as LineItem[]}
              totals={totals}
            />
          </aside>
        </div>
        <div className="sticky-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSubmit(save('saved as draft'))}
          >
            <Save size={16} /> Save as draft
          </Button>
          <Button
            type="button"
            variant="secondary"
          >
            Preview
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(save('sent'))}
          >
            <Send size={16} /> Send invoice
          </Button>
        </div>
      </form>
    </div>
  );
}

function InvoicePreview({
  customer,
  number,
  issueDate,
  dueDate,
  currency,
  items,
  totals,
}: {
  customer?: string;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  items: LineItem[];
  totals: ReturnType<typeof invoiceTotals>;
}) {
  return (
    <div className="invoice-paper">
      <div className="paper-head">
        <div className="logo">
          <span>Ł</span>
          <b>Ledgerly</b>
        </div>
        <div>
          <h2>INVOICE</h2>
          <b>{number}</b>
        </div>
      </div>
      <div className="paper-dates">
        <span><small>ISSUED</small>{issueDate}</span>
        <span><small>DUE</small>{dueDate}</span>
        <span><small>CURRENCY</small>{currency}</span>
      </div>
      <div className="paper-address">
        <div>
          <small>FROM</small>
          <b>Nordic Studio AS</b>
          <span>Storgata 18, 0155 Oslo</span>
          <span>Org. no. 923 456 781</span>
        </div>
        <div>
          <small>BILL TO</small>
          <b>{customer || 'Select customer'}</b>
          <span>Norway</span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((x, i) => (
            <tr key={x.id || i}>
              <td>{x.description || 'New item'}</td>
              <td>{x.quantity}</td>
              <td>{money(x.unitPrice)}</td>
              <td>{money(x.quantity * x.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="paper-total">
        <span>
          Subtotal <b>{money(totals.subtotal)}</b>
        </span>
        <span>
          VAT <b>{money(totals.vat)}</b>
        </span>
        <strong>
          Total <b>{money(totals.total)}</b>
        </strong>
      </div>
      <footer>
        <b>Payment due within 30 days</b>
        <span>Thank you for your business.</span>
      </footer>
    </div>
  );
}

export function UploadReceipt() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const choose = (f?: File) => {
    if (!f) return;
    setFile(f);
    setProgress(35);
    setTimeout(() => setProgress(100), 500);
  };
  const drop = (e: DragEvent) => {
    e.preventDefault();
    choose(e.dataTransfer.files[0]);
  };
  return (
    <div className="page narrow">
      <div className="back-row">
        <Link to="/expenses">
          <ArrowLeft size={17} /> Expenses
        </Link>
      </div>
      <PageHeader
        title="Upload receipt"
        description="Upload a receipt and review the simulated extracted details before saving."
      />
      {!file ? (
        <Card
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={drop}
        >
          <CloudUpload size={36} />
          <h3>Drop your receipt here</h3>
          <p>or choose a file from your device</p>
          <Button
            type="button"
            onClick={() => input.current?.click()}
          >
            <Upload size={16} /> Choose file
          </Button>
          <input
            ref={input}
            type="file"
            hidden
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <small>JPG, PNG or PDF · Maximum 10 MB</small>
        </Card>
      ) : (
        <>
          <Card className="upload-status">
            <div className="file-icon">
              <FileText />
            </div>
            <div>
              <b>{file.name}</b>
              <span>
                {Math.round(file.size / 1024)} KB ·{' '}
                {progress < 100 ? 'Uploading…' : 'Upload complete'}
              </span>
              <div className="progress">
                <i style={{ width: `${progress}%` }} />
              </div>
            </div>
            {progress === 100 && <Check className="success" />}
          </Card>
          {progress === 100 && (
            <Card>
              <div className="notice">
                <Settings2 />
                <span>
                  <b>Simulated extraction</b>This data is mock OCR output.
                  Connect a backend OCR service for real extraction.
                </span>
              </div>
              <h3>Review expense details</h3>
              <div className="form-grid">
                <Field label="Merchant">
                  <Input defaultValue="IKEA Forus" />
                </Field>
                <Field label="Date">
                  <Input
                    type="date"
                    defaultValue="2026-07-21"
                  />
                </Field>
                <Field label="Total">
                  <Input
                    type="number"
                    defaultValue="6240"
                  />
                </Field>
                <Field label="VAT">
                  <Input
                    type="number"
                    defaultValue="1248"
                  />
                </Field>
                <Field label="Category">
                  <Select defaultValue="Office">
                    <option>Software</option>
                    <option>Travel</option>
                    <option>Office</option>
                    <option>Meals</option>
                    <option>Marketing</option>
                    <option>Equipment</option>
                  </Select>
                </Field>
                <Field label="Payment method">
                  <Select>
                    <option>Corporate card •• 4821</option>
                    <option>Personal card</option>
                    <option>Bank transfer</option>
                  </Select>
                </Field>
                <Field label="Description">
                  <Textarea
                    defaultValue="Office furniture and storage"
                    rows={3}
                  />
                </Field>
              </div>
              <div className="form-actions">
                <Button
                  variant="secondary"
                  onClick={() => setFile(null)}
                >
                  Replace file
                </Button>
                <Link
                  to="/expenses"
                  className="button button-primary"
                >
                  <Save size={16} /> Save expense
                </Link>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export function Reports() {
  const [reportCustomers, setReportCustomers] = useState<Customer[]>([]);
  const [reportCustomersError, setReportCustomersError] = useState('');
  useEffect(() => {
    let active = true;
    customerApi
      .list()
      .then((result) => active && setReportCustomers(result))
      .catch((reason: unknown) =>
        active &&
        setReportCustomersError(
          reason instanceof Error ? reason.message : 'Could not load customers',
        ),
      );
    return () => {
      active = false;
    };
  }, []);
  const categories = [
    { name: 'Software', value: 32, color: '#3b73ed' },
    { name: 'Travel', value: 24, color: '#7157d9' },
    { name: 'Office', value: 19, color: '#13a477' },
    { name: 'Marketing', value: 15, color: '#e49a32' },
    { name: 'Other', value: 10, color: '#9aa2b1' },
  ];
  return (
    <div className="page">
      <PageHeader
        title="Reports"
        description="Understand performance and make informed decisions."
        action={
          <div className="button-row">
            <Select>
              <option>Jan 1 – Jul 21, 2026</option>
              <option>This quarter</option>
              <option>Last year</option>
            </Select>
            <Button variant="secondary">
              <Download size={16} /> Export
            </Button>
          </div>
        }
      />
      <div className="metrics">
        <MetricCard
          label="Revenue"
          value={money(1732450)}
          change="↑ 14.8% year over year"
          tone="positive"
        />
        <MetricCard
          label="Expenses"
          value={money(746820)}
          change="↑ 6.4% year over year"
          tone="negative"
        />
        <MetricCard
          label="Net profit"
          value={money(985630)}
          change="56.9% profit margin"
          tone="positive"
        />
        <MetricCard
          label="Operating cash flow"
          value={money(842100)}
          change="Healthy cash position"
          tone="positive"
        />
      </div>
      <div className="reports-grid">
        <Card className="chart-card wide">
          <div className="card-head">
            <div>
              <h3>Revenue and expenses</h3>
              <p>Monthly performance in NOK thousands</p>
            </div>
          </div>
          <div className="chart">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart data={cashFlow}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Area
                  dataKey="income"
                  stroke="#3b73ed"
                  fill="#e8effe"
                  strokeWidth={2}
                />
                <Area
                  dataKey="expenses"
                  stroke="#e49a32"
                  fill="#fff3df"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="chart-card">
          <div className="card-head">
            <div>
              <h3>Expenses by category</h3>
              <p>{money(746820)} total</p>
            </div>
          </div>
          <div className="donut report-donut">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={80}
                >
                  {categories.map((x) => (
                    <Cell
                      key={x.name}
                      fill={x.color}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="status-legend">
            {categories.map((x) => (
              <span key={x.name}>
                <i style={{ background: x.color }} />
                {x.name}
                <b>{x.value}%</b>
              </span>
            ))}
          </div>
        </Card>
        <Card className="chart-card wide">
          <div className="card-head">
            <div>
              <h3>Monthly profit</h3>
              <p>Revenue less operating expenses</p>
            </div>
          </div>
          <div className="chart">
            <ResponsiveContainer>
              <BarChart
                data={cashFlow.map((x) => ({
                  ...x,
                  profit: x.income - x.expenses,
                }))}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar
                  dataKey="profit"
                  fill="#3b73ed"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="top-customers">
          <div className="card-head">
            <div>
              <h3>Customers</h3>
              <p>Live customer directory</p>
            </div>
          </div>
          {reportCustomers.slice(0, 5).map((x, i) => (
            <div key={x.id}>
              <span>{i + 1}</span>
              <Link to={`/customers/${x.id}`}><b>{x.company}</b></Link>
              <StatusBadge>{x.status}</StatusBadge>
            </div>
          ))}
          {!reportCustomersError && reportCustomers.length === 0 && (
            <div><span>—</span><b>No customers yet</b><Link to="/customers?new=1">Add one</Link></div>
          )}
          {reportCustomersError && <p className="api-error">{reportCustomersError}</p>}
        </Card>
      </div>
    </div>
  );
}

const settingsNav = [
  [Building2, 'Company'],
  [Users, 'Team members'],
  [ShieldCheck, 'Roles & permissions'],
  [FileText, 'Invoice templates'],
  [Settings2, 'Taxes'],
  [Palette, 'Branding'],
  [KeyRound, 'API keys'],
] as const;
export function SettingsPage() {
  const [section, setSection] = useState('Company');
  return (
    <div className="page">
      <PageHeader
        title="Settings"
        description="Manage your workspace, billing defaults and team access."
      />
      <div className="settings-layout">
        <nav className="settings-nav">
          {settingsNav.map(([Icon, label]) => (
            <button
              className={section === label ? 'active' : ''}
              onClick={() => setSection(label)}
              key={label}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div>
          {section === 'Company' ? (
            <CompanySettings />
          ) : section === 'Invoice templates' ? (
            <TemplateSettings />
          ) : (
            <Card className="placeholder">
              <div className="file-icon">
                <Settings2 />
              </div>
              <h3>{section}</h3>
              <p>This workspace section is ready for backend integration.</p>
              <Button variant="secondary">
                Configure {section.toLowerCase()}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
function CompanySettings() {
  return (
    <Card className="settings-card">
      <div className="card-head">
        <div>
          <h3>Company information</h3>
          <p>Details shown on your invoices and official documents.</p>
        </div>
      </div>
      <div className="company-logo-edit">
        <span>NS</span>
        <div>
          <Button variant="secondary">Change logo</Button>
          <small>PNG, JPG or SVG. Max 2 MB.</small>
        </div>
      </div>
      <div className="form-grid">
        <Field label="Legal company name">
          <Input defaultValue="Nordic Studio AS" />
        </Field>
        <Field label="Organisation number">
          <Input defaultValue="923 456 781" />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            defaultValue="hello@nordicstudio.no"
          />
        </Field>
        <Field label="Phone">
          <Input defaultValue="+47 22 45 67 89" />
        </Field>
        <Field label="Address">
          <Input defaultValue="Storgata 18" />
        </Field>
        <Field label="Postal code">
          <Input defaultValue="0155" />
        </Field>
        <Field label="City">
          <Input defaultValue="Oslo" />
        </Field>
        <Field label="Country">
          <Select>
            <option>Norway</option>
            <option>Sweden</option>
            <option>Denmark</option>
          </Select>
        </Field>
      </div>
      <div className="form-actions">
        <Button>
          <Save size={16} /> Save changes
        </Button>
      </div>
    </Card>
  );
}
function TemplateSettings() {
  return (
    <Card className="settings-card">
      <div className="card-head">
        <div>
          <h3>Invoice template</h3>
          <p>Choose how invoices look when sent to customers.</p>
        </div>
      </div>
      <div className="template-grid">
        <button className="template active">
          <div>
            <span className="template-logo" />
            <i />
            <i />
            <i />
            <strong />
          </div>
          <b>Nordic</b>
          <small>Clean and minimal</small>
          <Check />
        </button>
        <button className="template">
          <div>
            <span className="template-logo dark" />
            <i />
            <i />
            <i />
            <strong />
          </div>
          <b>Classic</b>
          <small>Traditional business</small>
        </button>
      </div>
      <div className="form-grid">
        <Field label="Accent colour">
          <div className="color-input">
            <span />
            <Input defaultValue="#356FE5" />
          </div>
        </Field>
        <Field label="Default payment terms">
          <Select>
            <option>30 days</option>
            <option>14 days</option>
            <option>7 days</option>
          </Select>
        </Field>
        <Field label="Invoice footer">
          <Textarea
            rows={3}
            defaultValue="Thank you for your business."
          />
        </Field>
      </div>
      <div className="form-actions">
        <Button>
          <Save size={16} /> Save template
        </Button>
      </div>
    </Card>
  );
}
