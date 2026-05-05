import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <div className="page">
      <div className="landing-bg">
        <div className="landing-blob blob-1" />
        <div className="landing-blob blob-2" />
        <div className="landing-blob blob-3" />
      </div>

      <nav className="topbar">
        <div className="topbar-logo">
          <span className="dot" />
          ResultFlow
        </div>
      </nav>

      <div className="landing-content" style={{ paddingTop: 52, paddingBottom: 40 }}>

        {/* Hero */}
        <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="landing-eyebrow" style={{ margin: '0 auto 20px' }}>
            <span>⚡</span> Mobile-first result management
          </div>
          <h1 className="landing-title">
            Results,<br />
            <span className="accent">without the</span><br />
            chaos.
          </h1>
          <p className="landing-desc" style={{ maxWidth: 320, margin: '0 auto' }}>
            Instant result sharing for students. Zero-friction workflow for teachers.
          </p>
        </div>

        {/* TWO CARDS — Student | Teacher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>

          {/* Student Card */}
          <div className="card" style={{
            border: '1px solid rgba(34,211,238,0.25)',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.06), var(--surface))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
              }}>👨‍🎓</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
                  I'm a Student
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                  Check your result using your private link
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 16, lineHeight: 1.6 }}>
              Your teacher will share a private link on WhatsApp. Tap that link to see your marks, rank, and answer sheets instantly.
            </div>
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)',
              fontSize: 12, color: 'var(--cyan)'
            }}>
              🔗 Open the link your teacher sent you on WhatsApp
            </div>
          </div>

          {/* Teacher Card */}
          <div className="card" style={{
            border: '1px solid rgba(59,130,246,0.25)',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.06), var(--surface))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
              }}>🎓</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
                  I'm a Teacher
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                  Manage tests, students and results
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 16, lineHeight: 1.6 }}>
              Create tests, add students, enter marks, upload answer sheets and share results — all from your phone.
            </div>
            <Link
              to="/login"
              className="btn btn-primary btn-full"
              style={{ fontSize: 14, padding: '12px' }}
            >
              🔐 Teacher Login →
            </Link>
          </div>
        </div>

        {/* How student flow works */}
        <div className="section-title" style={{ marginBottom: 12 }}>How it works</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['1', '📝', 'Teacher conducts test and uploads answer sheets'],
            ['2', '🔗', 'System auto-generates a private link for each student'],
            ['3', '📱', 'Teacher shares link on WhatsApp directly'],
            ['4', '✅', 'Student opens link — sees marks, rank, answer sheet'],
          ].map(([num, icon, text]) => (
            <div key={num} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                color: 'var(--blue)', flexShrink: 0
              }}>{num}</div>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{icon} {text}</span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'var(--ink-3)' }}>
          Built with MERN · No student login required · Mobile-first
        </p>
      </div>
      <Footer />
    </div>
  )
}