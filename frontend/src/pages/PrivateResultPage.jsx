import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api, fileBaseUrl, getErrorMessage } from '../services/api'
import { jsPDF } from 'jspdf'

export default function PrivateResultPage() {
  const { token } = useParams()
  const [state, setState] = useState({ loading: true, error: '', payload: null })
  const [imgExpanded, setImgExpanded] = useState(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const { data } = await api.get(`/results/private/${token}`)
        if (!ignore) setState({ loading: false, error: '', payload: data.data })
      } catch (err) {
        if (!ignore) setState({ loading: false, error: getErrorMessage(err), payload: null })
      }
    }
    load()
    return () => { ignore = true }
  }, [token])

  const r = state.payload
  const percentage = r ? Math.round((r.marks / 100) * 100) : 0
  const grade = r
    ? r.marks >= 90 ? 'A+' : r.marks >= 80 ? 'A' : r.marks >= 70 ? 'B' : r.marks >= 60 ? 'C' : r.marks >= 40 ? 'D' : 'F'
    : ''
  const gradeColor = grade === 'A+' || grade === 'A' ? 'var(--green)'
    : grade === 'B' ? 'var(--blue)'
    : grade === 'C' ? 'var(--amber)'
    : 'var(--red)'

  function resolveSheetUrl(sheet) {
    if (!sheet) return ''
    if (typeof sheet === 'string' && /^https?:\/\//i.test(sheet)) return sheet
    return `${fileBaseUrl}${sheet}`
  }

  async function downloadSheetsAsPdf() {
    if (!r?.answerSheets?.length) return

    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    for (let i = 0; i < r.answerSheets.length; i += 1) {
      const url = resolveSheetUrl(r.answerSheets[i])
      const response = await fetch(url)
      const blob = await response.blob()
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      const img = await new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = dataUrl
      })

      const imgWidth = img.width
      const imgHeight = img.height
      const ratio = Math.min((pageWidth - 40) / imgWidth, (pageHeight - 40) / imgHeight)
      const drawWidth = imgWidth * ratio
      const drawHeight = imgHeight * ratio
      const x = (pageWidth - drawWidth) / 2
      const y = (pageHeight - drawHeight) / 2

      if (i > 0) pdf.addPage()
      pdf.addImage(dataUrl, blob.type.includes('png') ? 'PNG' : 'JPEG', x, y, drawWidth, drawHeight)
      pdf.setFontSize(10)
      pdf.text(`Answer Sheet ${i + 1}`, 20, 20)
    }

    pdf.save(`${r.student?.name || 'result'}-answer-sheets.pdf`)
  }

  return (
    <div className="page">
      {/* Topbar */}
      <nav className="topbar">
        <div className="topbar-logo">
          <span className="dot" />
          ResultFlow
        </div>
        <BackButton />
      </nav>

      {/* Loading */}
      {state.loading && (
        <div className="loader-wrap">
          <div className="spinner" />
          Loading your result...
        </div>
      )}

      {/* Error */}
      {state.error && (
        <div style={{ padding: '24px 20px' }}>
          <div className="alert alert-error" style={{ marginBottom: 16 }}>{state.error}</div>
          <div style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
            This link may be invalid or expired. Contact your teacher.
          </div>
        </div>
      )}

      {r && (
        <div className="animate-fade-in">
          {/* School Header */}
          <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
            <img src="/logo.png" alt="School Logo" style={{ height: 60, marginBottom: 8 }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 16 }}>
              Vivekanand Sanskar Senior Secondary School Gangapur City
            </div>
          </div>

          {/* Score hero */}
          <div style={{ padding: '20px 20px 0' }}>
            <div className="private-score">
              {/* Avatar */}
              <div style={{
                width: 56, height: 56, borderRadius: 50,
                background: 'var(--surface)', border: '2px solid var(--border-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
                color: 'var(--blue)', margin: '0 auto 12px'
              }}>
                {r.student?.name?.[0]?.toUpperCase()}
              </div>

              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 2 }}>
                {r.student?.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 20 }}>
                Roll No: {r.student?.rollNo}
              </div>

              {/* Big score */}
              <div className="private-score-value">{r.marks}</div>
              <div className="private-score-label">out of 100</div>

              {/* Grade badge */}
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28,
                  color: gradeColor
                }}>{grade}</span>
              </div>

              {/* Rank pill */}
              <div className="private-score-rank">
                🏆 Rank #{r.rank}
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 20 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${percentage}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--ink-3)' }}>
                  <span>0</span>
                  <span>{percentage}%</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test info */}
          <div style={{ padding: '14px 20px 0' }}>
            <div className="card">
              <div className="card-title">Test Details</div>
              <div className="stack stack-12" style={{ marginTop: 4 }}>
                {[
                  ['📋 Test', r.test?.name],
                  ['📅 Date', r.test?.date?.slice(0, 10)],
                  ['📊 Marks', `${r.marks} / 100`],
                  ['🏅 Rank', `#${r.rank}`],
                  ['📈 Grade', grade],
                ].map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{key}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Answer sheets */}
          <div style={{ padding: '14px 20px 32px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div className="card-title">Answer Sheets</div>
                  <div className="card-sub" style={{ margin: 0 }}>
                    {r.answerSheets?.length
                      ? `${r.answerSheets.length} image${r.answerSheets.length > 1 ? 's' : ''} uploaded`
                      : 'Not uploaded yet'}
                  </div>
                </div>
                {r.answerSheets?.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => window.print()}
                    >
                      🖨️ Print
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={downloadSheetsAsPdf}
                    >
                      ⬇️ Download PDF
                    </button>
                  </div>
                )}
              </div>

              {!r.answerSheets?.length ? (
                <div className="empty">
                  <div className="empty-icon">📄</div>
                  Your answer sheets haven't been uploaded yet.
                  <br />
                  <span style={{ fontSize: 12 }}>Check back later or contact your teacher.</span>
                </div>
              ) : (
                <div className="stack stack-12">
                  {r.answerSheets.map((sheet, i) => {
                    const url = resolveSheetUrl(sheet)
                    return (
                      <div
                        key={sheet}
                        className="sheet-img-wrap"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setImgExpanded(imgExpanded === i ? null : i)}
                      >
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', background: 'var(--surface-2)',
                          borderBottom: imgExpanded === i ? '1px solid var(--border)' : 'none'
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>
                            📄 Sheet {i + 1}
                          </span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost btn-sm"
                              onClick={e => e.stopPropagation()}
                            >
                              Open ↗
                            </a>
                            <a
                              href={url}
                              download
                              className="btn btn-ghost btn-sm"
                              onClick={e => e.stopPropagation()}
                            >
                              Download
                            </a>
                            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>
                              {imgExpanded === i ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>
                        {imgExpanded === i && (
                          <img
                            src={url}
                            alt={`Answer sheet ${i + 1}`}
                            style={{ width: '100%', display: 'block' }}
                            loading="lazy"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen image overlay */}
      {imgExpanded !== null && r?.answerSheets?.[imgExpanded] && (
        <div
          onClick={() => setImgExpanded(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20
          }}
        >
          <img
            src={resolveSheetUrl(r.answerSheets[imgExpanded])}
            alt="Sheet"
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12 }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setImgExpanded(null)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600
            }}
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  )
}

function BackButton() {
  const navigate = useNavigate()
  function goBack() {
    try {
      if (window.history.length > 1) navigate(-1)
      else navigate('/admin')
    } catch (e) {
      navigate('/admin')
    }
  }
  return (
    <button className="btn btn-ghost btn-sm" onClick={goBack}>← Back</button>
  )
}