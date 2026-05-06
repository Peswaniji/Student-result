import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '../services/api'
import Footer from '../components/Footer'

export default function PublicTestPage() {
  const { testId: routeTestId } = useParams()
  const [testId, setTestId] = useState(routeTestId || '')
  const [tests, setTests] = useState([])
  const [state, setState] = useState({ loading: true, error: '', payload: null, search: '' })
  const [activeView, setActiveView] = useState('leaderboard')

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
  const maxMarks = Number(analytics?.maxMarks || 100)
  const testName = state.payload?.data?.[0]?.testId?.name || tests.find(t => t._id === testId)?.name || 'Test'
  const leaderboard = state.payload?.leaderboard || []

  const groupedLeaderboard = useMemo(() => {
    const groups = []
    const byRank = new Map()

    leaderboard.forEach(row => {
      if (!byRank.has(row.rank)) {
        byRank.set(row.rank, [])
        groups.push({ rank: row.rank, rows: byRank.get(row.rank) })
      }
      byRank.get(row.rank).push(row)
    })

    return groups
  }, [leaderboard])

  const podiumGroups = groupedLeaderboard.slice(0, 3)

  return (
    <div className="page">
      <nav className="topbar">
        <div className="topbar-logo">
          <span className="dot" />
          ResultFlow
        </div>
        <BackButtonPublic />
      </nav>

      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderBottom: '1px solid var(--border-1)',
        marginBottom: 24
      }}>
        <img src="/logo.png" alt="School Logo" style={{ height: 70, minWidth: 70, objectFit: 'contain' }} />
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)', lineHeight: 1.3 }}>
            Vivekanand Sanskar Senior Secondary School
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
            Gangapur City
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Public Result
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          {state.payload ? 'Test Results' : 'Loading...'}
        </h1>
        {state.payload && (
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 10 }}>
            Exam: {testName} · Max marks: {maxMarks}
          </div>
        )}
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

      {state.loading && (
        <div className="loader-wrap">
          <div className="spinner" />
          Fetching results...
        </div>
      )}

      {state.error && (
        <div style={{ padding: '0 20px' }}>
          <div className="alert alert-error">{state.error}</div>
        </div>
      )}

      {state.payload && (
        <div className="animate-fade-in">
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
                <div className="stat-value green">{analytics.highestMarks}/{maxMarks}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Lowest</div>
                <div className="stat-value cyan">{analytics.lowestMarks}/{maxMarks}</div>
              </div>
            </div>
          </div>

          {podiumGroups.length >= 2 && (
            <div style={{ padding: '0 20px 16px' }}>
              <div className="card" style={{ paddingBottom: 0, overflow: 'hidden' }}>
                <div className="card-title">🏆 Podium</div>
                <div className="podium">
                  {[podiumGroups[1], podiumGroups[0], podiumGroups[2]].map((group, visualIdx) => {
                    if (!group) return <div key={visualIdx} style={{ flex: 1 }} />
                    const podiumClass = visualIdx === 1 ? 'podium-1' : visualIdx === 0 ? 'podium-2' : 'podium-3'
                    const first = group.rows[0]
                    return (
                      <div className={`podium-item ${podiumClass}`} key={first.rollNo}>
                        <div className="podium-avatar">{first.name?.[0]?.toUpperCase()}</div>
                        <div className="podium-name">{first.name}</div>
                        <div className="podium-marks">{group.rows.length} student{group.rows.length > 1 ? 's' : ''}</div>
                        <div className="podium-bar">#{group.rank}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

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

          {activeView === 'leaderboard' && (
            <div style={{ padding: '0 20px 32px' }} className="animate-fade-up">
              <div className="stack stack-12">
                {groupedLeaderboard.map((group, groupIndex) => (
                  <div className="card" key={group.rank} style={{ padding: 16, animationDelay: `${groupIndex * 0.04}s` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div className="card-title" style={{ margin: 0 }}>Rank #{group.rank}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{group.rows.length} student{group.rows.length > 1 ? 's' : ''}</div>
                    </div>
                    <div className="stack stack-8">
                      {group.rows.map((r, i) => (
                        <div className="rank-row leaderboard-card" key={r.rollNo} style={{ animationDelay: `${(groupIndex + i) * 0.04}s` }}>
                          <div className={`rank-num rank-${Math.min(group.rank, 3)}`} style={{ width: 36 }}>
                            {group.rank}
                          </div>
                          <div className="result-card-body" style={{ flex: 1 }}>
                            <div className="result-card-name">{r.name}</div>
                            <div className="result-card-meta">Roll number: {r.rollNo}</div>
                            <div className="result-card-meta">Exam: {testName}</div>
                          </div>
                          <div className="result-card-score">
                            <div className="result-card-score-label">You got</div>
                            <div className="rank-row-marks">{r.marks}/{maxMarks}</div>
                            <div className="progress-bar result-card-progress">
                              <div className="progress-fill" style={{ width: `${Math.min((Number(r.marks) / maxMarks) * 100, 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                <div className="rank-table result-grid">
                  {filteredRows.map((row, i) => {
                    const name = row.studentId?.name || row.name || 'Unknown'
                    const rollNo = row.studentId?.rollNo || row.rollNo || '—'
                    const marks = row.marks
                    const rank = row.rank
                    const rowTestName = row.testId?.name || testName

                    return (
                      <div className="rank-row result-card result-card-all" key={`${rollNo}-${i}`}>
                        <div className={`rank-num ${rank <= 3 ? `rank-${rank}` : ''}`} style={{ fontSize: 14 }}>
                          {rank}
                        </div>
                        <div className="result-card-body" style={{ flex: 1 }}>
                          <div className="result-card-name">Name: {name}</div>
                          <div className="result-card-meta">Roll number: {rollNo}</div>
                          <div className="result-card-meta">Exam: {rowTestName}</div>
                          <div className="result-card-meta">Max marks: {maxMarks}</div>
                          <div className="result-card-meta">You got: {marks}/{maxMarks}</div>
                        </div>
                        <div className="result-card-score">
                          <div className="result-card-score-label">Rank</div>
                          <div className="rank-row-marks">{rank}</div>
                          <div className="progress-bar result-card-progress">
                            <div className="progress-fill" style={{ width: `${Math.min((Number(marks) / maxMarks) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <Footer />
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
