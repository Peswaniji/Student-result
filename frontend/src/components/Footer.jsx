export default function Footer() {
  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border-1)',
      padding: '24px 20px',
      marginTop: 'auto',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center'
      }}>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
          Developed by Sujal Peswani
        </div>
        <div style={{
          display: 'flex',
          gap: 16,
          fontSize: 12,
          color: 'var(--ink-3)',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <a href="mailto:developersujalpeswani@gmail.com" style={{ color: 'var(--blue)', textDecoration: 'none' }}>
            developersujalpeswani@gmail.com
          </a>
          <span>•</span>
          <a href="tel:+918696336893" style={{ color: 'var(--blue)', textDecoration: 'none' }}>
            +91 8696336893
          </a>
        </div>
      </div>
    </footer>
  )
}
