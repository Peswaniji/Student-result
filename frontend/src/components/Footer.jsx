export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)',
      borderTop: '1px solid var(--border-1)',
      padding: '40px 20px',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        alignItems: 'center'
      }}>
        {/* Developer Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink)',
            letterSpacing: '0.5px'
          }}>
            Developed by Sujal Peswani
          </div>
          <div style={{
            display: 'flex',
            gap: 16,
            fontSize: 12,
            color: 'var(--ink-2)',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <a
              href="mailto:developersujalpeswani@gmail.com"
              style={{
                color: 'var(--ink)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--border-1)',
                paddingBottom: 2,
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.target.style.borderBottomColor = 'var(--ink)';
                e.target.style.color = 'var(--ink)';
              }}
              onMouseLeave={e => {
                e.target.style.borderBottomColor = 'var(--border-1)';
                e.target.style.color = 'var(--ink)';
              }}
            >
              developersujalpeswani@gmail.com
            </a>
            <span style={{ color: 'var(--border-1)' }}>•</span>
            <a
              href="tel:+918696336893"
              style={{
                color: 'var(--ink)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--border-1)',
                paddingBottom: 2,
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.target.style.borderBottomColor = 'var(--ink)';
                e.target.style.color = 'var(--ink)';
              }}
              onMouseLeave={e => {
                e.target.style.borderBottomColor = 'var(--border-1)';
                e.target.style.color = 'var(--ink)';
              }}
            >
              +91 8696336893
            </a>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: 40,
          height: 1,
          background: 'var(--border-1)'
        }} />

        {/* Copyright */}
        <div style={{
          fontSize: 11,
          color: 'var(--ink-3)',
          textAlign: 'center',
          letterSpacing: '0.3px'
        }}>
          © {new Date().getFullYear()} All rights reserved by @peswaniji
        </div>
      </div>
    </footer>
  )
}
