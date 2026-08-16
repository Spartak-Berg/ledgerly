import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button, Field, Input } from '../components';
import { Logo } from '../layout';
import { ApiError } from '../api';
import { useAuth } from '../useAuth';

export function Login() {
  const [show, setShow] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { loading, login, profile, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (!loading && profile) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const credentials = {
        email: String(data.get('email')),
        password: String(data.get('password')),
      };
      if (registering) {
        await register({
          ...credentials,
          companyName: String(data.get('companyName')),
          fullName: String(data.get('fullName')),
        });
      } else {
        await login(credentials);
      }
      navigate(from, { replace: true });
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : 'Could not connect to Ledgerly. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <main>
        <div className="login-form">
          <Logo />
          <div>
            <h1>{registering ? 'Create your workspace' : 'Welcome back'}</h1>
            <p>
              {registering
                ? 'Start with your owner account and first company.'
                : 'Sign in to continue to your Ledgerly workspace.'}
            </p>
          </div>
          <form onSubmit={(event) => void submit(event)}>
            {registering && (
              <>
                <Field label="Your full name">
                  <Input name="fullName" autoComplete="name" minLength={2} maxLength={120} required />
                </Field>
                <Field label="Company name">
                  <Input name="companyName" autoComplete="organization" minLength={2} maxLength={200} required />
                </Field>
              </>
            )}
            <Field label="Email address">
              <Input name="email" type="email" autoComplete="email" maxLength={320} required />
            </Field>
            <Field label="Password" hint={registering ? 'Use at least 12 characters.' : undefined}>
              <div className="password">
                <Input
                  name="password"
                  type={show ? 'text' : 'password'}
                  autoComplete={registering ? 'new-password' : 'current-password'}
                  minLength={registering ? 12 : 1}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow((value) => !value)}
                >
                  {show ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </Field>
            {!registering && (
              <div className="remember">
                <span>Secure session on this device</span>
                <span>Password reset coming later</span>
              </div>
            )}
            {error && <div className="form-error" role="alert">{error}</div>}
            <Button type="submit" disabled={submitting || loading}>
              {submitting
                ? registering ? 'Creating workspace…' : 'Signing in…'
                : registering ? 'Create account' : 'Sign in'}
              {!submitting && <ArrowRight size={16} />}
            </Button>
          </form>
          <p className="signup">
            {registering ? 'Already have an account?' : 'New to Ledgerly?'}{' '}
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setRegistering((value) => !value);
                setError('');
              }}
            >
              {registering ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </main>
      <aside>
        <div className="geometry"><i /><i /><i /></div>
        <div className="login-quote">
          <ShieldCheck />
          <h2>Your finances,<br />beautifully organised.</h2>
          <p>Invoices, expenses and reporting in one calm, dependable workspace.</p>
          <div>
            <span>Ł</span>
            <span><b>Your Ledgerly workspace</b><small>Private company data</small></span>
            <strong>Protected</strong>
          </div>
        </div>
        <small>© 2026 Ledgerly · Privacy · Terms</small>
      </aside>
    </div>
  );
}
