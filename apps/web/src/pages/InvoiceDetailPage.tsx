import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Copy, Download, Pencil, Send, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
  TableWrap,
  Textarea,
} from '../components';
import { invoicesApi, type Invoice, type InvoiceStatus } from '../invoices-api';
import { money, shortDate } from '../lib';
import { useAuth } from '../useAuth';

const statusLabel = (status: InvoiceStatus) =>
  status
    .toLowerCase()
    .replace('_', ' ')
    .replace(/^./, (character) => character.toUpperCase());
const snapshotValue = (snapshot: Record<string, unknown>, key: string) =>
  typeof snapshot[key] === 'string' ? snapshot[key] : '';

export function InvoiceDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const canManage = profile?.company.role !== 'EMPLOYEE';
  const [invoice, setInvoice] = useState<Invoice>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmIssue, setConfirmIssue] = useState(false);
  const [showVoid, setShowVoid] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    let active = true;
    invoicesApi
      .get(id)
      .then((result) => active && setInvoice(result))
      .catch(
        (reason: unknown) =>
          active &&
          setError(
            reason instanceof Error ? reason.message : 'Could not load invoice',
          ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const action = async (operation: () => Promise<Invoice>) => {
    setBusy(true);
    setError('');
    try {
      setInvoice(await operation());
      setConfirmIssue(false);
      setShowVoid(false);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Invoice action failed',
      );
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async () => {
    if (!invoice) return;
    setBusy(true);
    try {
      const copy = await invoicesApi.duplicate(invoice.id);
      navigate(`/invoices/${copy.id}/edit`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not duplicate invoice',
      );
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    if (!invoice) return;
    setBusy(true);
    setError('');
    try {
      const document = await invoicesApi.downloadPdf(invoice.id);
      const url = URL.createObjectURL(document.blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not download PDF',
      );
    } finally {
      setBusy(false);
    }
  };

  const submitVoid = (event: FormEvent) => {
    event.preventDefault();
    if (!invoice || voidReason.trim().length < 3) return;
    void action(() => invoicesApi.void(invoice.id, voidReason));
  };

  if (loading) return <LoadingSkeleton />;
  if (!invoice) {
    return (
      <EmptyState
        title="Invoice unavailable"
        description={error || 'The invoice could not be found in this company.'}
      />
    );
  }

  const company = invoice.companySnapshot;
  const customer = invoice.customerSnapshot;
  const canVoid = ['ISSUED', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(
    invoice.status,
  );
  return (
    <div className="page">
      <div className="back-row">
        <Link to="/invoices">
          <ArrowLeft size={17} /> Invoices
        </Link>
        <StatusBadge>{statusLabel(invoice.status)}</StatusBadge>
      </div>
      <PageHeader
        title={invoice.number ?? 'Invoice draft'}
        description={`${invoice.customerNameSnapshot} · ${shortDate(invoice.issueDate)}`}
        action={
          <div className="button-row">
            {invoice.status === 'DRAFT' && canManage && (
              <>
                <Link
                  className="button button-secondary"
                  to={`/invoices/${invoice.id}/edit`}
                >
                  <Pencil size={16} /> Edit draft
                </Link>
                <Button onClick={() => setConfirmIssue(true)} disabled={busy}>
                  <Send size={16} /> Issue invoice
                </Button>
              </>
            )}
            {invoice.status !== 'DRAFT' && (
              <Button
                variant="secondary"
                onClick={() => void downloadPdf()}
                disabled={busy}
              >
                <Download size={16} /> Download PDF
              </Button>
            )}
            {invoice.status === 'ISSUED' && canManage && (
              <Button
                onClick={() =>
                  void action(() => invoicesApi.markSent(invoice.id))
                }
                disabled={busy}
              >
                <Send size={16} /> Mark sent
              </Button>
            )}
            {canManage && (
              <Button
                variant="secondary"
                onClick={() => void duplicate()}
                disabled={busy}
              >
                <Copy size={16} /> Duplicate
              </Button>
            )}
            {canVoid && canManage && (
              <Button
                variant="ghost"
                onClick={() => setShowVoid(true)}
                disabled={busy}
              >
                <XCircle size={16} /> Void
              </Button>
            )}
          </div>
        }
      />
      {error && (
        <div className="api-error" role="alert">
          {error}
        </div>
      )}
      <div className="detail-grid">
        <Card className="wide">
          <div className="card-head padded">
            <div>
              <h3>Invoice</h3>
              <p>Canonical values stored by Ledgerly</p>
            </div>
          </div>
          <div className="details">
            <div>
              <small>From</small>
              <b>{invoice.companyNameSnapshot}</b>
              <span>{snapshotValue(company, 'addressLine1')}</span>
              <span>
                {[
                  snapshotValue(company, 'postalCode'),
                  snapshotValue(company, 'city'),
                ]
                  .filter(Boolean)
                  .join(' ')}
              </span>
            </div>
            <div>
              <small>Bill to</small>
              <b>{invoice.customerNameSnapshot}</b>
              <span>{snapshotValue(customer, 'contactName')}</span>
              <span>{snapshotValue(customer, 'billingAddressLine1')}</span>
            </div>
            <div>
              <small>Issue date</small>
              <b>{shortDate(invoice.issueDate)}</b>
            </div>
            <div>
              <small>Due date</small>
              <b>{shortDate(invoice.dueDate)}</b>
            </div>
          </div>
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>VAT</th>
                  <th className="number">Unit price</th>
                  <th className="number">Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>
                      {item.quantity} {item.unit}
                    </td>
                    <td>{item.vatRate}%</td>
                    <td className="number">
                      {money(item.unitPriceMinor / 100, invoice.currency)}
                    </td>
                    <td className="number strong">
                      {money(item.totalMinor / 100, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <div className="totals">
            <div>
              <span>Subtotal</span>
              <b>{money(invoice.subtotalMinor / 100, invoice.currency)}</b>
            </div>
            <div>
              <span>VAT</span>
              <b>{money(invoice.vatMinor / 100, invoice.currency)}</b>
            </div>
            <div>
              <span>Total</span>
              <strong>
                {money(invoice.totalMinor / 100, invoice.currency)}
              </strong>
            </div>
          </div>
        </Card>
        <Card>
          <h3>Activity</h3>
          <div className="timeline">
            <div>
              <i />
              <span>
                <b>Draft created</b>
                <small>{shortDate(invoice.createdAt)}</small>
              </span>
            </div>
            {invoice.issuedAt && (
              <div>
                <i />
                <span>
                  <b>Invoice issued</b>
                  <small>{shortDate(invoice.issuedAt)}</small>
                </span>
              </div>
            )}
            {invoice.sentAt && (
              <div>
                <i />
                <span>
                  <b>Marked as sent</b>
                  <small>{shortDate(invoice.sentAt)}</small>
                </span>
              </div>
            )}
            {invoice.voidedAt && (
              <div>
                <i />
                <span>
                  <b>Invoice voided</b>
                  <small>{invoice.voidReason}</small>
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
      {confirmIssue && (
        <ConfirmDialog
          title="Issue this invoice?"
          description="Ledgerly will allocate the next company invoice number. Customer, company and financial values become immutable after issuance."
          confirmLabel={busy ? 'Issuing…' : 'Issue invoice'}
          onCancel={() => setConfirmIssue(false)}
          onConfirm={() =>
            void action(() => invoicesApi.issue(invoice.id, invoice.version))
          }
        />
      )}
      {showVoid && (
        <div className="modal-backdrop">
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="void-title"
          >
            <div className="modal-head">
              <div>
                <h2 id="void-title">Void {invoice.number}</h2>
                <p>The invoice remains in history and cannot be edited.</p>
              </div>
            </div>
            <form onSubmit={submitVoid}>
              <Field label="Reason">
                <Textarea
                  autoFocus
                  required
                  minLength={3}
                  rows={4}
                  value={voidReason}
                  onChange={(event) => setVoidReason(event.target.value)}
                />
              </Field>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowVoid(false)}
                >
                  Cancel
                </Button>
                <Button disabled={busy || voidReason.trim().length < 3}>
                  {busy ? 'Voiding…' : 'Void invoice'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
