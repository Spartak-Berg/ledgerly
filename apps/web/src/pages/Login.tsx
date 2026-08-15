import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button, Field, Input } from '../components';
import { Logo } from '../layout';

export function Login() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="login">
      <main>
        <div className="login-form">
          <Logo />
          <div>
            <h1>Welcome back</h1>
            <p>Sign in to continue to your Ledgerly workspace.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            <Field label="Email address">
              <Input
                type="email"
                defaultValue="spartak@nordicstudio.no"
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password">
              <div className="password">
                <Input
                  type={show ? 'text' : 'password'}
                  defaultValue="ledgerly-demo"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow((v) => !v)}
                >
                  {show ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </Field>
            <div className="remember">
              <label>
                <input
                  type="checkbox"
                  defaultChecked
                />{' '}
                Remember me
              </label>
              <a href="#forgot">Forgot password?</a>
            </div>
            <Button type="submit">
              Sign in <ArrowRight size={16} />
            </Button>
          </form>
          <div className="divider">
            <span>or continue with</span>
          </div>
          <div className="social-buttons">
            <Button variant="secondary">
              G <span>Google</span>
            </Button>
            <Button variant="secondary">
              M <span>Microsoft</span>
            </Button>
          </div>
          <p className="signup">
            New to Ledgerly? <a href="#register">Create an account</a>
          </p>
        </div>
      </main>
      <aside>
        <div className="geometry">
          <i />
          <i />
          <i />
        </div>
        <div className="login-quote">
          <ShieldCheck />
          <h2>
            Your finances,
            <br />
            beautifully organised.
          </h2>
          <p>
            Invoices, expenses and reporting in one calm, dependable workspace.
          </p>
          <div>
            <span>NS</span>
            <span>
              <b>Nordic Studio AS</b>
              <small>Books are up to date</small>
            </span>
            <strong>All good</strong>
          </div>
        </div>
        <small>© 2026 Ledgerly · Privacy · Terms</small>
      </aside>
    </div>
  );
}
