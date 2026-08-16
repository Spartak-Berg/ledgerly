import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { CustomerInput } from './api';
import { Button, Field, Input, Select, Textarea } from './components';
import type { Customer } from './lib';

const initialInput: CustomerInput = {
  companyName: '',
  type: 'COMPANY', organisationNumber: '',
  contactName: '',
  email: '',
  phone: '',
  billingAddressLine1: '', billingAddressLine2: '', billingPostalCode: '', billingCity: '',
  postalAddressLine1: '', postalAddressLine2: '', postalPostalCode: '', postalCity: '',
  countryCode: 'NO', vatNumber: '', defaultCurrency: 'NOK', defaultPaymentDays: 14, notes: '',
  status: 'ACTIVE',
};

const fromCustomer = (customer?: Customer): CustomerInput =>
  customer
    ? {
        companyName: customer.company,
        type: customer.type.toUpperCase() as CustomerInput['type'], organisationNumber: customer.organisationNumber,
        contactName: customer.contact,
        email: customer.email,
        phone: customer.phone,
        billingAddressLine1: customer.billingAddressLine1, billingAddressLine2: customer.billingAddressLine2, billingPostalCode: customer.billingPostalCode, billingCity: customer.billingCity,
        postalAddressLine1: customer.postalAddressLine1, postalAddressLine2: customer.postalAddressLine2, postalPostalCode: customer.postalPostalCode, postalCity: customer.postalCity,
        countryCode: customer.countryCode, vatNumber: customer.vatNumber, defaultCurrency: customer.defaultCurrency, defaultPaymentDays: customer.defaultPaymentDays, notes: customer.notes,
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
            <Field label="Customer type"><Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CustomerInput['type'] })}><option value="COMPANY">Company</option><option value="INDIVIDUAL">Individual</option></Select></Field>
            <Field label="Company name">
              <Input
                value={form.companyName}
                onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                maxLength={200}
                required
                autoFocus
              />
            </Field>
            <Field label="Organisation number"><Input value={form.organisationNumber} onChange={(event) => setForm({ ...form, organisationNumber: event.target.value })} /></Field>
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
            <Field label="Billing address"><Input value={form.billingAddressLine1} onChange={(event) => setForm({ ...form, billingAddressLine1: event.target.value })} /></Field>
            <Field label="Billing address line 2"><Input value={form.billingAddressLine2} onChange={(event) => setForm({ ...form, billingAddressLine2: event.target.value })} /></Field>
            <Field label="Postal code"><Input value={form.billingPostalCode} onChange={(event) => setForm({ ...form, billingPostalCode: event.target.value })} /></Field>
            <Field label="City"><Input value={form.billingCity} onChange={(event) => setForm({ ...form, billingCity: event.target.value })} /></Field>
            <Field label="Country"><Select value={form.countryCode} onChange={(event) => setForm({ ...form, countryCode: event.target.value })}><option value="NO">Norway</option><option value="SE">Sweden</option><option value="DK">Denmark</option></Select></Field>
            <Field label="VAT number"><Input value={form.vatNumber} onChange={(event) => setForm({ ...form, vatNumber: event.target.value })} /></Field>
            <Field label="Currency"><Select value={form.defaultCurrency} onChange={(event) => setForm({ ...form, defaultCurrency: event.target.value })}><option>NOK</option><option>SEK</option><option>DKK</option><option>EUR</option><option>USD</option></Select></Field>
            <Field label="Payment terms (days)"><Input type="number" min={1} max={365} value={form.defaultPaymentDays} onChange={(event) => setForm({ ...form, defaultPaymentDays: Number(event.target.value) })} /></Field>
          </div>
          <Field label="Notes"><Textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} maxLength={5000} /></Field>
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
