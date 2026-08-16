import { useEffect, useState, type FormEvent } from 'react';
import { Check, Pencil, Plus, Settings2, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  LoadingSkeleton,
  MetricCard,
  PageHeader,
  SearchInput,
  Select,
  StatusBadge,
  TableWrap,
  Textarea,
} from '../components';
import {
  categoriesApi,
  expensesApi,
  suppliersApi,
  type Expense,
  type ExpenseCategory,
  type ExpenseInput,
  type ExpensePaymentMethod,
  type Supplier,
} from '../expenses-api';
import { money, shortDate } from '../lib';
import { useAuth } from '../useAuth';

interface FormState {
  supplierId: string;
  categoryId: string;
  merchant: string;
  description: string;
  expenseDate: string;
  currency: string;
  net: number;
  vat: number;
  paymentMethod: ExpensePaymentMethod;
  notes: string;
}
const today = () => new Date().toISOString().slice(0, 10);
const blank = (currency = 'NOK'): FormState => ({
  supplierId: '',
  categoryId: '',
  merchant: '',
  description: '',
  expenseDate: today(),
  currency,
  net: 0,
  vat: 0,
  paymentMethod: 'CARD',
  notes: '',
});
const payload = (form: FormState): ExpenseInput => {
  const netMinor = Math.round(form.net * 100);
  const vatMinor = Math.round(form.vat * 100);
  return {
    supplierId: form.supplierId || null,
    categoryId: form.categoryId,
    merchant: form.merchant,
    description: form.description || null,
    expenseDate: form.expenseDate,
    currency: form.currency,
    netMinor,
    vatMinor,
    totalMinor: netMinor + vatMinor,
    paymentMethod: form.paymentMethod,
    notes: form.notes || null,
  };
};

export function ExpensesPage() {
  const { profile } = useAuth();
  const canManage = profile?.company.role !== 'EMPLOYEE';
  const [items, setItems] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [summary, setSummary] = useState({
    totalMinor: 0,
    vatMinor: 0,
    awaitingReview: 0,
  });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Expense | null>();
  const [form, setForm] = useState<FormState>(
    blank(profile?.company.defaultCurrency),
  );
  const [pendingArchive, setPendingArchive] = useState<Expense>();
  const [busy, setBusy] = useState(false);
  const [manageCategories, setManageCategories] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newVat, setNewVat] = useState(25);
  useEffect(() => {
    Promise.all([categoriesApi.list(), suppliersApi.list()])
      .then(([categoryItems, supplierItems]) => {
        setCategories(categoryItems);
        setSuppliers(supplierItems);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Could not load expense options',
        ),
      );
  }, []);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        currency: profile?.company.defaultCurrency ?? 'NOK',
      });
      if (query) params.set('search', query);
      if (status) params.set('status', status);
      if (category) params.set('categoryId', category);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      setLoading(true);
      expensesApi
        .list(params)
        .then((result) => {
          if (!active) return;
          setItems(result.items);
          setSummary(result.summary);
          setTotalPages(result.totalPages);
          setError('');
        })
        .catch(
          (reason: unknown) =>
            active &&
            setError(
              reason instanceof Error
                ? reason.message
                : 'Could not load expenses',
            ),
        )
        .finally(() => active && setLoading(false));
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    query,
    status,
    category,
    dateFrom,
    dateTo,
    page,
    profile?.company.defaultCurrency,
  ]);
  const open = (item?: Expense) => {
    setEditing(item ?? null);
    setForm(
      item
        ? {
            supplierId: item.supplierId ?? '',
            categoryId: item.categoryId,
            merchant: item.merchantSnapshot,
            description: item.description ?? '',
            expenseDate: item.expenseDate.slice(0, 10),
            currency: item.currency,
            net: item.netMinor / 100,
            vat: item.vatMinor / 100,
            paymentMethod: item.paymentMethod,
            notes: item.notes ?? '',
          }
        : {
            ...blank(profile?.company.defaultCurrency),
            categoryId: categories[0]?.id ?? '',
          },
    );
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const saved = editing
        ? await expensesApi.update(editing.id, payload(form))
        : await expensesApi.create(payload(form));
      setItems((current) =>
        editing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current],
      );
      setEditing(undefined);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not save expense',
      );
    } finally {
      setBusy(false);
    }
  };
  const review = async (item: Expense, next: 'APPROVED' | 'REJECTED') => {
    setBusy(true);
    try {
      const updated = await expensesApi.review(item.id, next);
      setItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not review expense',
      );
    } finally {
      setBusy(false);
    }
  };
  const archive = async () => {
    if (!pendingArchive) return;
    setBusy(true);
    try {
      await expensesApi.archive(pendingArchive.id);
      setItems((current) =>
        current.filter((item) => item.id !== pendingArchive.id),
      );
      setPendingArchive(undefined);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not archive expense',
      );
    } finally {
      setBusy(false);
    }
  };
  const addCategory = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const created = await categoriesApi.create({
        name: newCategory,
        vatRate: newVat,
      });
      setCategories((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewCategory('');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not add category',
      );
    } finally {
      setBusy(false);
    }
  };
  const removeCategory = async (item: ExpenseCategory) => {
    try {
      await categoriesApi.archive(item.id);
      setCategories((current) =>
        current.filter((entry) => entry.id !== item.id),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not archive category',
      );
    }
  };
  return (
    <div className="page">
      <div className="tabs">
        <Link className="active" to="/expenses">
          Expenses
        </Link>
        <Link to="/suppliers">Suppliers</Link>
      </div>
      <PageHeader
        title="Expenses"
        description="Record, review and find business spending."
        action={
          canManage ? (
            <div className="button-row">
              <Button
                variant="secondary"
                onClick={() => setManageCategories(true)}
              >
                <Settings2 size={16} />
                Categories
              </Button>
              <Button onClick={() => open()}>
                <Plus size={16} />
                Add expense
              </Button>
            </div>
          ) : undefined
        }
      />
      <div className="metrics expense-metrics">
        <MetricCard
          label="Filtered total"
          value={money(
            summary.totalMinor / 100,
            profile?.company.defaultCurrency,
          )}
          change="Current filters"
        />
        <MetricCard
          label="Awaiting review"
          value={String(summary.awaitingReview)}
          change="Draft expenses"
        />
        <MetricCard
          label="Recoverable VAT"
          value={money(
            summary.vatMinor / 100,
            profile?.company.defaultCurrency,
          )}
          change="Informational"
          tone="positive"
        />
      </div>
      <Card>
        <div className="filterbar">
          <SearchInput
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search expenses…"
          />
          <div>
            <Select
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Select>
            <Select
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Input
              aria-label="From date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              aria-label="To date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <LoadingSkeleton />
        ) : items.length ? (
          <>
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th className="number">Net</th>
                    <th className="number">VAT</th>
                    <th className="number">Total</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <b>{item.merchantSnapshot}</b>
                        <br />
                        <small>
                          {item.supplier?.name ?? item.description ?? ''}
                        </small>
                      </td>
                      <td>{item.category.name}</td>
                      <td>{shortDate(item.expenseDate)}</td>
                      <td className="number">
                        {money(item.netMinor / 100, item.currency)}
                      </td>
                      <td className="number">
                        {money(item.vatMinor / 100, item.currency)}
                      </td>
                      <td className="number strong">
                        {money(item.totalMinor / 100, item.currency)}
                      </td>
                      <td>
                        <StatusBadge>{item.status.toLowerCase()}</StatusBadge>
                      </td>
                      <td>
                        {canManage && (
                          <div className="row-actions">
                            {item.status !== 'APPROVED' && (
                              <Button
                                variant="ghost"
                                onClick={() => open(item)}
                              >
                                <Pencil size={15} />
                              </Button>
                            )}
                            {item.status !== 'APPROVED' && (
                              <>
                                <Button
                                  variant="ghost"
                                  onClick={() => void review(item, 'APPROVED')}
                                >
                                  <Check size={15} />
                                  Approve
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => void review(item, 'REJECTED')}
                                >
                                  <X size={15} />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              onClick={() => setPendingArchive(item)}
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
            <div className="pagination">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            title="No expenses found"
            description="Add a manual expense or adjust the filters."
          />
        )}
      </Card>
      {error && (
        <div className="api-error" role="alert">
          {error}
        </div>
      )}
      {editing !== undefined && (
        <div className="modal-backdrop">
          <section className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-head">
              <div>
                <h2>{editing ? 'Edit' : 'Add'} expense</h2>
                <p>Enter net and VAT; Ledgerly validates the total.</p>
              </div>
            </div>
            <form onSubmit={(e) => void save(e)}>
              <div className="form-grid">
                <Field label="Merchant">
                  <Input
                    autoFocus
                    required
                    value={form.merchant}
                    onChange={(e) =>
                      setForm({ ...form, merchant: e.target.value })
                    }
                  />
                </Field>
                <Field label="Supplier">
                  <Select
                    value={form.supplierId}
                    onChange={(e) => {
                      const supplier = suppliers.find(
                        (item) => item.id === e.target.value,
                      );
                      setForm({
                        ...form,
                        supplierId: e.target.value,
                        merchant: supplier?.name || form.merchant,
                      });
                    }}
                  >
                    <option value="">No linked supplier</option>
                    {suppliers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Category">
                  <Select
                    required
                    value={form.categoryId}
                    onChange={(e) => {
                      const selected = categories.find(
                        (item) => item.id === e.target.value,
                      );
                      setForm({
                        ...form,
                        categoryId: e.target.value,
                        vat: selected
                          ? Math.round(form.net * selected.vatRate) / 100
                          : form.vat,
                      });
                    }}
                  >
                    <option value="">Select category</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Date">
                  <Input
                    required
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) =>
                      setForm({ ...form, expenseDate: e.target.value })
                    }
                  />
                </Field>
                <Field label="Net">
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.net}
                    onChange={(e) =>
                      setForm({ ...form, net: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="VAT">
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.vat}
                    onChange={(e) =>
                      setForm({ ...form, vat: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Total">
                  <Input
                    disabled
                    value={money(form.net + form.vat, form.currency)}
                  />
                </Field>
                <Field label="Payment method">
                  <Select
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        paymentMethod: e.target.value as ExpensePaymentMethod,
                      })
                    }
                  >
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </Field>
              </div>
              <Field label="Description">
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </Field>
              <Field label="Notes">
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(undefined)}
                >
                  Cancel
                </Button>
                <Button disabled={busy}>
                  {busy ? 'Saving…' : 'Save expense'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
      {manageCategories && (
        <div className="modal-backdrop">
          <section className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-head">
              <div>
                <h2>Expense categories</h2>
                <p>Inactive categories remain on historical expenses.</p>
              </div>
            </div>
            <form onSubmit={(e) => void addCategory(e)}>
              <div className="form-grid">
                <Field label="New category">
                  <Input
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </Field>
                <Field label="Default VAT rate">
                  <Input
                    required
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newVat}
                    onChange={(e) => setNewVat(Number(e.target.value))}
                  />
                </Field>
              </div>
              <Button disabled={busy}>
                <Plus size={15} />
                Add category
              </Button>
            </form>
            <div className="category-list">
              {categories.map((item) => (
                <div key={item.id}>
                  <span>
                    <b>{item.name}</b>
                    <small>{item.vatRate}% VAT</small>
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => void removeCategory(item)}
                  >
                    Archive
                  </Button>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setManageCategories(false)}
              >
                Done
              </Button>
            </div>
          </section>
        </div>
      )}
      {pendingArchive && (
        <ConfirmDialog
          title={`Archive ${pendingArchive.merchantSnapshot}?`}
          description="The expense remains available for audit history."
          confirmLabel="Archive expense"
          onCancel={() => setPendingArchive(undefined)}
          onConfirm={() => void archive()}
        />
      )}
    </div>
  );
}
