import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, getErrorMessage, setAuthToken } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus({ loading: true, error: '', success: '' })

    // Register validation
    if (mode === 'register') {
      if (form.password !== form.confirmPassword) {
        setStatus({ loading: false, error: 'Passwords do not match', success: '' })
        return
      }
      if (form.password.length < 6) {
        setStatus({ loading: false, error: 'Password must be at least 6 characters', success: '' })
        return
      }
    }

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const { data } = await api.post(endpoint, {
        email: form.email,
        password: form.password,
      })
      setAuthToken(data.token)
      navigate('/admin')
    } catch (err) {
      setStatus({ loading: false, error: getErrorMessage(err), success: '' })
    }
  }

  function switchMode(newMode) {
    setMode(newMode)
    setStatus({ loading: false, error: '', success: '' })
    setForm({ email: '', password: '', confirmPassword: '' })
  }

  return (
    <div className="page">
      <nav className="topbar">
        <div className="topbar-logo">
          <span className="dot" />
          ResultFlow
        </div>
        <Link to="/" className="btn btn-ghost btn-sm">← Back</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div style={{ width: '100%', maxWidth: 380 }} className="animate-fade-up">

          {/* Icon + heading */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, margin: '0 auto 16px'
            }}>🎓</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
              {mode === 'login' ? 'Teacher Login' : 'Create Account'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              {mode === 'login'
                ? 'Sign in to manage tests and results'
                : 'First time? Set up your teacher account'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="tab-nav" style={{ marginBottom: 20 }}>
            <button
              className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              🔐 Login
            </button>
            <button
              className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              ✨ Register
            </button>
          </div>

          {/* Register note */}
          {mode === 'register' && (
            <div className="alert alert-info" style={{ marginBottom: 16, fontSize: 12 }}>
              ℹ️ Register only once. After your account is created, use Login every time.
            </div>
          )}

          {/* Form */}
          <div className="card">
            <form className="stack stack-16" onSubmit={handleSubmit}>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@school.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {mode === 'register' && (
                <div className="field">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    autoComplete="new-password"
                  />
                </div>
              )}

              {status.error && (
                <div className="alert alert-error">{status.error}</div>
              )}

              {status.success && (
                <div className="alert alert-success">{status.success}</div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={status.loading}
                style={{ padding: '14px', fontSize: '15px', marginTop: 4 }}
              >
                {status.loading
                  ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                  : (mode === 'login' ? 'Login →' : 'Create Account →')
                }
              </button>
            </form>
          </div>

          {/* Helper text */}
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            {mode === 'login'
              ? <>No account? <button onClick={() => switchMode('register')} style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Register here →</button></>
              : <>Already registered? <button onClick={() => switchMode('login')} style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Login →</button></>
            }
          </p>
        </div>
      </div>
    </div>
  )
}