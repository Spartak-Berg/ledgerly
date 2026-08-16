import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  HTMLAttributes,
} from 'react';
import {
  Search,
  Inbox,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  LoaderCircle,
} from 'lucide-react';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      {...props}
    />
  );
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="input"
      {...props}
    />
  );
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="input select"
      {...props}
    />
  );
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="input textarea"
      {...props}
    />
  );
}
export function Card({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      className={`card ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </div>
  );
}
export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className={`badge badge-${String(children).toLowerCase()}`}>
      <i />
      {children}
    </span>
  );
}
export function SearchInput({
  placeholder = 'Search…',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="search">
      <Search size={16} />
      <span className="sr-only">Search</span>
      <input
        placeholder={placeholder}
        {...props}
      />
    </label>
  );
}
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function EmptyState({
  title = 'Nothing here yet',
  description = 'New records will appear here.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <Inbox />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
export function LoadingSkeleton() {
  return (
    <div
      className="loading"
      aria-label="Loading"
    >
      <LoaderCircle className="spin" />
      <span>Loading your workspace…</span>
    </div>
  );
}
export function Pagination() {
  return (
    <div className="pagination">
      <span>1–6 of 24</span>
      <Button
        variant="secondary"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </Button>
      <Button
        variant="secondary"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
export function MenuButton() {
  return (
    <Button
      variant="ghost"
      aria-label="More actions"
    >
      <MoreHorizontal size={18} />
    </Button>
  );
}
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="table-wrap">{children}</div>;
}
export function MetricCard({
  label,
  value,
  change,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  change: string;
  tone?: 'neutral' | 'positive' | 'negative';
}) {
  return (
    <Card className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <span className={tone}>{change}</span>
    </Card>
  );
}

export function ConfirmDialog({ title, description, confirmLabel, onCancel, onConfirm, busy = false }: { title: string; description: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void; busy?: boolean }) {
  return <div className="modal-backdrop"><section className="modal-card confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><div className="modal-head"><div><h2 id="confirm-title">{title}</h2><p>{description}</p></div></div><div className="modal-actions"><Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button><Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</Button></div></section></div>
}
