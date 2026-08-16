import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { CustomerInput } from './api';
import { Button, Field, Input, Select } from './components';
import type { Customer } from './lib';

const initialInput: CustomerInput = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  status: 'ACTIVE',
};

const fromCustomer = (customer?: Customer): CustomerInput =>
  customer
    ? {
        companyName: customer.company,
        contactName: customer.contact,
        email: customer.email,
        phone: customer.phone,
        status: customer.status.toUpperCase() as CustomerInput['status'],
      }
    : initialInput;

export function CustomerDialog({
  customer,
  onClose,
  onSave,
}: {
  customer?: Customer;
  onClose: () => void;
  onSave: (input: CustomerInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CustomerInput>(() => fromCustomer(customer));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 id="customer-dialog-title">
              {customer ? 'Edit customer' : 'Add customer'}
            </h2>
            <p>Store the contact details used for billing.</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <Field label="Company name">
              <Input
                value={form.companyName}
                onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                maxLength={200}
                required
                autoFocus
              />
            </Field>
            <Field label="Contact person">
              <Input
                value={form.contactName}
                onChange={(event) => setForm({ ...form, contactName: event.target.value })}
                maxLength={200}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                maxLength={320}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                maxLength={50}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as CustomerInput['status'] })
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="LEAD">Lead</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </Field>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : customer ? 'Save changes' : 'Add customer'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
