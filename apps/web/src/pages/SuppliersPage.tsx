import { useEffect, useState, type FormEvent } from 'react';
import { Archive, Pencil, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
  TableWrap,
  Textarea,
} from '../components';
import {
  suppliersApi,
  type Supplier,
  type SupplierInput,
} from '../expenses-api';
import { money } from '../lib';
import { useAuth } from '../useAuth';

const blank: SupplierInput = {
  name: '',
  organisationNumber: '',
  email: '',
  phone: '',
  addressLine1: '',
  postalCode: '',
  city: '',
  countryCode: 'NO',
  notes: '',
};
export function SuppliersPage() {
  const { profile } = useAuth();
  const canManage = profile?.company.role !== 'EMPLOYEE';
  const [items, setItems] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Supplier | null>();
  const [form, setForm] = useState<SupplierInput>(blank);
  const [archive, setArchive] = useState<Supplier>();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(
      () =>
        suppliersApi
          .list(search)
          .then((x) => active && setItems(x))
          .catch(
            (e: unknown) =>
              active &&
              setError(
                e instanceof Error ? e.message : 'Could not load suppliers',
              ),
          )
          .finally(() => active && setLoading(false)),
      250,
    );
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);
  const open = (item?: Supplier) => {
    setEditing(item ?? null);
    setForm(
      item
        ? {
            name: item.name,
            organisationNumber: item.organisationNumber,
            email: item.email,
            phone: item.phone,
            addressLine1: item.addressLine1,
            postalCode: item.postalCode,
            city: item.city,
            countryCode: item.countryCode,
            notes: item.notes,
          }
        : blank,
    );
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const saved = editing
        ? await suppliersApi.update(editing.id, form)
        : await suppliersApi.create(form);
      const normalized = {
        ...saved,
        expenseCount: saved.expenseCount ?? 0,
        totalExpenseMinor: saved.totalExpenseMinor ?? 0,
      };
      setItems((current) =>
        editing
          ? current.map((x) => (x.id === saved.id ? normalized : x))
          : [...current, normalized].sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
      );
      setEditing(undefined);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not save supplier',
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!archive) return;
    setBusy(true);
    try {
      await suppliersApi.archive(archive.id);
      setItems((current) => current.filter((x) => x.id !== archive.id));
      setArchive(undefined);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not archive supplier',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page">
      <div className="tabs">
        <Link to="/expenses">Expenses</Link>
        <Link className="active" to="/suppliers">
          Suppliers
        </Link>
      </div>
      <PageHeader
        title="Suppliers"
        description="Maintain supplier details and expense history."
        action={
          canManage ? (
            <Button onClick={() => open()}>
              <Plus size={16} />
              Add supplier
            </Button>
          ) : undefined
        }
      />
      <Card>
        <div className="filterbar">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers…"
          />
        </div>
        {loading ? (
          <LoadingSkeleton />
        ) : items.length ? (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Organisation no.</th>
                  <th>Contact</th>
                  <th className="number">Expenses</th>
                  <th className="number">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="strong">{item.name}</td>
                    <td>{item.organisationNumber || '—'}</td>
                    <td>{item.email || item.phone || '—'}</td>
                    <td className="number">{item.expenseCount}</td>
                    <td className="number strong">
                      {money(
                        item.totalExpenseMinor / 100,
                        profile?.company.defaultCurrency,
                      )}
                    </td>
                    <td>
                      {canManage && (
                        <div className="row-actions">
                          <Button variant="ghost" onClick={() => open(item)}>
                            <Pencil size={15} />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setArchive(item)}
                          >
                            <Archive size={15} />
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
            title="No suppliers yet"
            description="Add a supplier to connect expenses and history."
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
                <h2>{editing ? 'Edit' : 'Add'} supplier</h2>
                <p>Contact and address details remain company-scoped.</p>
              </div>
            </div>
            <form onSubmit={(e) => void submit(e)}>
              <div className="form-grid">
                <Field label="Name">
                  <Input
                    autoFocus
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Organisation number">
                  <Input
                    value={form.organisationNumber ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, organisationNumber: e.target.value })
                    }
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={form.phone ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </Field>
                <Field label="Address">
                  <Input
                    value={form.addressLine1 ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, addressLine1: e.target.value })
                    }
                  />
                </Field>
                <Field label="Postal code">
                  <Input
                    value={form.postalCode ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, postalCode: e.target.value })
                    }
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={form.city ?? ''}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea
                  rows={3}
                  value={form.notes ?? ''}
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
                  {busy ? 'Saving…' : 'Save supplier'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
      {archive && (
        <ConfirmDialog
          title={`Archive ${archive.name}?`}
          description="Existing expense history stays intact."
          confirmLabel="Archive supplier"
          onCancel={() => setArchive(undefined)}
          onConfirm={() => void remove()}
        />
      )}
    </div>
  );
}
