import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '../services/api'

export default function PublicTestPage() {
  const { testId: routeTestId } = useParams()
  const [testId, setTestId] = useState(routeTestId || '')
  const [tests, setTests] = useState([])
  const [state, setState] = useState({ loading: true, error: '', payload: null, search: '' })
  const [activeView, setActiveView] = useState('leaderboard') // leaderboard | all

  useEffect(() => {
    let ignore = false
    async function loadTestsIfNeeded() {
      if (routeTestId) {
        setTestId(routeTestId)
        return
      }
      try {
        const { data } = await api.get('/tests')
        if (ignore) return
        const rows = data?.data || []
        setTests(rows)
        if (rows.length > 0) {
          const latest = [...rows].sort((a, b) => {
            const da = new Date(a.date || a.createdAt || 0).getTime()
            const db = new Date(b.date || b.createdAt || 0).getTime()
            return db - da
          })[0]
          setTestId(latest?._id || '')
        } else {
          setState({ loading: false, error: 'No tests available', payload: null, search: '' })
        }
      } catch (err) {
        if (!ignore) setState({ loading: false, error: getErrorMessage(err), payload: null, search: '' })
      }
    }
    loadTestsIfNeeded()
    return () => { ignore = true }
  }, [routeTestId])

  useEffect(() => {
    if (!testId) return
    let ignore = false
    async function load() {
      try {
        const { data } = await api.get(`/results/public/${testId}`)
        if (!ignore) setState({ loading: false, error: '', payload: data, search: '' })
      } catch (err) {
        if (!ignore) setState({ loading: false, error: getErrorMessage(err), payload: null, search: '' })
      }
    }
    load()
    return () => { ignore = true }
  }, [testId])

  const filteredRows = useMemo(() => {
    if (!state.payload) return []
    const term = state.search.trim().toLowerCase()
    const rows = state.payload.data || []
    if (!term) return rows
    return rows.filter(row => {
      const name = (row.studentId?.name || row.name || '').toLowerCase()
      const roll = (row.studentId?.rollNo || row.rollNo || '').toLowerCase()
      return name.includes(term) || roll.includes(term)
    })
  }, [state.payload, state.search])

  const analytics = state.payload?.analytics
  const leaderboard = state.payload?.leaderboard || []
  const top3 = leaderboard.slice(0, 3)

  return (
    <div className="page">
      {/* Topbar */}
      <nav className="topbar">
        <div className="topbar-logo">
          <span className="dot" />
          ResultFlow
        </div>
        <BackButtonPublic />
      </nav>

      {/* Header */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Public Result
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          {state.payload ? 'Test Results' : 'Loading...'}
        </h1>
        {!routeTestId && tests.length > 0 && (
          <div className="card" style={{ marginTop: 10, marginBottom: 10, padding: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Select Test</label>
              <select
                value={testId}
                onChange={e => {
                  setState(s => ({ ...s, loading: true, error: '' }))
                  setTestId(e.target.value)
                }}
              >
                {tests.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({(t.date || '').slice(0, 10)})</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'monospace', marginBottom: 16 }}>
          ID: {testId}
        </p>
      </div>

      {/* Loading */}
      {state.loading && (
        <div className="loader-wrap">
          <div className="spinner" />
          Fetching results...
        </div>
      )}

      {/* Error */}
      {state.error && (
        <div style={{ padding: '0 20px' }}>
          <div className="alert alert-error">{state.error}</div>
        </div>
      )}

      {state.payload && (
        <div className="animate-fade-in">
          {/* Analytics */}
          <div style={{ padding: '0 20px 16px' }}>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-label">Students</div>
                <div className="stat-value blue">{analytics.totalStudents}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Average</div>
                <div className="stat-value amber">{analytics.averageMarks}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Highest</div>
                <div className="stat-value green">{analytics.highestMarks}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Lowest</div>
                <div className="stat-value cyan">{analytics.lowestMarks}</div>
              </div>
            </div>
          </div>

          {/* Podium for top 3 */}
          {top3.length >= 2 && (
            <div style={{ padding: '0 20px 16px' }}>
              <div className="card" style={{ paddingBottom: 0, overflow: 'hidden' }}>
                <div className="card-title">🏆 Podium</div>
                <div className="podium">
                  {/* Reorder: 2, 1, 3 for visual podium */}
                  {[top3[1], top3[0], top3[2]].map((r, visualIdx) => {
                    if (!r) return <div key={visualIdx} style={{ flex: 1 }} />
                    const podiumClass = r.rank === 1 ? 'podium-1' : r.rank === 2 ? 'podium-2' : 'podium-3'
                    return (
                      <div className={`podium-item ${podiumClass}`} key={r.rollNo}>
                        <div className="podium-avatar">{r.name?.[0]?.toUpperCase()}</div>
                        <div className="podium-name">{r.name}</div>
                        <div className="podium-marks">{r.marks} pts</div>
                        <div className="podium-bar">#{r.rank}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* View toggle */}
          <div style={{ padding: '0 20px 12px' }}>
            <div className="tab-nav">
              <button
                className={`tab-btn ${activeView === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setActiveView('leaderboard')}
              >
                🏅 Leaderboard
              </button>
              <button
                className={`tab-btn ${activeView === 'all' ? 'active' : ''}`}
                onClick={() => setActiveView('all')}
              >
                📋 All Results
              </button>
            </div>
          </div>

          {/* Leaderboard */}
          {activeView === 'leaderboard' && (
            <div style={{ padding: '0 20px 32px' }} className="animate-fade-up">
              <div className="rank-table">
                {leaderboard.map((r, i) => (
                  <div className="rank-row" key={r.rollNo} style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className={`rank-num ${i < 3 ? `rank-${i + 1}` : ''}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${r.rank}`}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="rank-row-name">{r.name}</div>
                      <div className="rank-row-roll">{r.rollNo}</div>
                    </div>
                    <div>
                      <div className="rank-row-marks">{r.marks}</div>
                      <div className="progress-bar" style={{ width: 60 }}>
                        <div className="progress-fill" style={{ width: `${r.marks}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All results + search */}
          {activeView === 'all' && (
            <div style={{ padding: '0 20px 32px' }} className="animate-fade-up">
              <div className="search-wrap" style={{ marginBottom: 14 }}>
                <span className="search-icon">🔍</span>
                <input
                  placeholder="Search by name or roll no..."
                  value={state.search}
                  onChange={e => setState(s => ({ ...s, search: e.target.value }))}
                />
              </div>

              {filteredRows.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">🔍</div>
                  No students match your search
                </div>
              ) : (
                <div className="rank-table">
                  {filteredRows.map((row, i) => {
                    const name = row.studentId?.name || row.name || 'Unknown'
                    const rollNo = row.studentId?.rollNo || row.rollNo || '—'
                    const marks = row.marks
                    const rank = row.rank
                    return (
                      <div className="rank-row" key={`${rollNo}-${i}`}>
                        <div className={`rank-num ${rank <= 3 ? `rank-${rank}` : ''}`} style={{ fontSize: 14 }}>
                          #{rank}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="rank-row-name">{name}</div>
                          <div className="rank-row-roll">{rollNo}</div>
                        </div>
                        <div className="rank-row-marks">{marks}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BackButtonPublic() {
  const navigate = useNavigate()
  function goBack() {
    try {
      if (window.history.length > 1) navigate(-1)
      else navigate('/')
    } catch (e) {
      navigate('/')
    }
  }
  return (
    <button className="btn btn-ghost btn-sm" onClick={goBack}>← Back</button>
  )
}