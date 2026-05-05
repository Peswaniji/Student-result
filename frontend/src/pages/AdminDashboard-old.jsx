import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, clearAuthToken, getAuthToken, getErrorMessage } from '../services/api'

const TABS = ['Tests', 'Students', 'Results', 'Upload', 'Overview']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const token = getAuthToken()
  const [me, setMe] = useState(null)
  const [tests, setTests] = useState([])
  const [students, setStudents] = useState([])
  const [activeTab, setActiveTab] = useState(0)
  const [notice, setNotice] = useState({ msg: '', type: '' })
  const [busy, setBusy] = useState('')

  const [testForm, setTestForm] = useState({ name: '', date: new Date().toISOString().slice(0, 10) })
  const [studentForm, setStudentForm] = useState({ name: '', rollNo: '', phone: '' })
  const [resultForm, setResultForm] = useState({ studentId: '', testId: '', marks: '' })
  const [generatedToken, setGeneratedToken] = useState('')
  const [generatedStudent, setGeneratedStudent] = useState(null)
  const [uploadForm, setUploadForm] = useState({ resultId: '' })
  const [uploadFiles, setUploadFiles] = useState([])
  const [overviewTestId, setOverviewTestId] = useState('')
  const [overviewData, setOverviewData] = useState(null)

  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return }
    loadAll()
  }, [])

  async function loadAll() {
    try {
      const [meRes, testsRes, studentsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/tests'),
        api.get('/students'),
      ])
      setMe(meRes.data.data)
      const t = testsRes.data.data || []
      const s = studentsRes.data.data || []
      setTests(t)
      setStudents(s)
      if (t[0]) setResultForm(f => ({ ...f, testId: t[0]._id }))
      if (s[0]) setResultForm(f => ({ ...f, studentId: s[0]._id }))
    } catch (err) {
      clearAuthToken()
      navigate('/login', { replace: true })
    }
  }

  async function refreshLists() {
    const [t, s] = await Promise.all([api.get('/tests'), api.get('/students')])
    setTests(t.data.data || [])
    setStudents(s.data.data || [])
  }

  function showNotice(msg, type = 'success') {
    setNotice({ msg, type })
    setTimeout(() => setNotice({ msg: '', type: '' }), 4000)
  }

  async function createTest(e) {
    e.preventDefault()
    setBusy('test')
    try {
      await api.post('/tests', testForm)
      setTestForm({ name: '', date: new Date().toISOString().slice(0, 10) })
      await refreshLists()
      showNotice('Test created')
    } catch (err) { showNotice(getErrorMessage(err), 'error') }
    finally { setBusy('') }
  }

  async function addStudent(e) {
    e.preventDefault()
    setBusy('student')
    try {
      await api.post('/students', studentForm)
      setStudentForm({ name: '', rollNo: '', phone: '' })
      await refreshLists()
      showNotice('Student added')
    } catch (err) { showNotice(getErrorMessage(err), 'error') }
    finally { setBusy('') }
  }

  async function saveResult(e) {
    e.preventDefault()
    setBusy('result')
    try {
      const { data } = await api.post('/results', resultForm)
      const tok = data?.data?.token || ''
      setGeneratedToken(tok)
      const stu = students.find(s => s._id === resultForm.studentId)
      setGeneratedStudent(stu || null)
      showNotice('Result saved')
    } catch (err) { showNotice(getErrorMessage(err), 'error') }
    finally { setBusy('') }
  }

  async function uploadSheets(e) {
    e.preventDefault()
    if (!uploadForm.resultId || uploadFiles.length === 0) {
      showNotice('Enter result ID and select images', 'error')
      return
    }
    setBusy('upload')
    try {
      const fd = new FormData()
      uploadFiles.forEach(f => fd.append('images', f))
      const { data } = await api.post(`/results/${uploadForm.resultId}/uploads`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      showNotice(data.message || 'Uploaded')
      setUploadFiles([])
      setUploadForm({ resultId: '' })
    } catch (err) { showNotice(getErrorMessage(err), 'error') }
    finally { setBusy('') }
  }

  async function loadOverview() {
    if (!overviewTestId) return
    setBusy('overview')
    try {
      const { data } = await api.get(`/results/public/${overviewTestId}`)
      setOverviewData(data)
    } catch (err) { showNotice(getErrorMessage(err), 'error') }
    finally { setBusy('') }
  }

  function logout() { clearAuthToken(); navigate('/login', { replace: true }) }

  function copyLink(tok) {
    navigator.clipboard?.writeText(`${window.location.origin}/result/${tok}`)
    showNotice('Link copied!')
  }

  function buildWhatsappHref(tok, student) {
    const url = `${window.location.origin}/result/${tok}`
    const name = student?.name || 'Student'
    const msg = `📊 *ResultFlow*\n\nHi ${name}! Your result is ready.\n\n🔗 View your marks, rank and answer sheets:\n${url}\n\n_No login required — just open the link_ ✅`
    if (student?.phone) {
      const phone = student.phone.replace(/\D/g, '')
      return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    }
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="page">
      <nav className="topbar">
        <div className="topbar-logo">
          <span className="dot" />
          ResultFlow
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
      </nav>

      {notice.msg && (
        <div style={{ padding: '8px 20px' }}>
          <div className={`alert alert-${notice.type === 'error' ? 'error' : 'success'}`}>
            {notice.msg}
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px 0' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          {me ? `Hi, ${me.email.split('@')[0]} 👋` : 'Dashboard'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14 }}>
          Manage your tests, students and results
        </p>
        <div className="stat-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-label">Tests</div>
            <div className="stat-value blue">{tests.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Students</div>
            <div className="stat-value green">{students.length}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 12px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 4, minWidth: 'max-content' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === i ? 'active' : ''}`}
              onClick={() => setActiveTab(i)}
              style={{ flexShrink: 0 }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-content" style={{ flex: 1 }}>

        {activeTab === 0 && (
          <div className="stack stack-16 animate-fade-up">
            <div className="card">
              <div className="card-title">Create New Test</div>
              <div className="card-sub">Add a test name and date</div>
              <form className="stack stack-12" onSubmit={createTest}>
                <div className="field">
                  <label>Test Name</label>
                  <input
                    placeholder="e.g. Math Unit 3 Test"
                    value={testForm.name}
                    onChange={e => setTestForm({ ...testForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={testForm.date}
                    onChange={e => setTestForm({ ...testForm, date: e.target.value })}
                    required
                  />
                </div>
                <button className="btn btn-primary btn-full" type="submit" disabled={busy === 'test'}>
                  {busy === 'test' ? 'Creating...' : '+ Create Test'}
                </button>
              </form>
            </div>

            <div>
              <div className="section-header">
                <div className="section-title">All Tests ({tests.length})</div>
              </div>
              {tests.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📋</div>
                  No tests yet
                </div>
              ) : (
                <div className="rank-table">
                  {tests.map((t) => (
                    <div className="row-item" key={t._id}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'var(--blue-dim)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 16, flexShrink: 0
                      }}>📋</div>
                      <div className="row-item-main">
                        <div className="row-item-name">{t.name}</div>
                        <div className="row-item-sub">{t.date?.slice(0, 10)} · ID: {t._id.slice(-6)}</div>
                      </div>
                      <Link to={`/test/${t._id}`} className="btn btn-ghost btn-sm">View</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="stack stack-16 animate-fade-up">
            <div className="card">
              <div className="card-title">Add Student</div>
              <div className="card-sub">Roll number must be unique</div>
              <form className="stack stack-12" onSubmit={addStudent}>
                <div className="field">
                  <label>Full Name</label>
                  <input
                    placeholder="Rahul Sharma"
                    value={studentForm.name}
                    onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Roll Number</label>
                  <input
                    placeholder="e.g. 2024-001"
                    value={studentForm.rollNo}
                    onChange={e => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>
                    WhatsApp Number
                    <span style={{ color: 'var(--ink-3)', fontWeight: 400, marginLeft: 4 }}>(optional)</span>
                  </label>
                  <input
                    placeholder="919876543210 (country code + number)"
                    value={studentForm.phone}
                    onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })}
                    type="tel"
                  />
                </div>
                <button className="btn btn-primary btn-full" type="submit" disabled={busy === 'student'}>
                  {busy === 'student' ? 'Saving...' : '+ Add Student'}
                </button>
              </form>
            </div>

            <div>
              <div className="section-header">
                <div className="section-title">All Students ({students.length})</div>
              </div>
              {students.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">👨‍🎓</div>
                  No students yet
                </div>
              ) : (
                <div className="stack stack-8">
                  {students.map((s) => (
                    <div className="row-item" key={s._id}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 50,
                        background: 'var(--surface-2)', border: '1px solid var(--border-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                        color: 'var(--blue)', flexShrink: 0
                      }}>
                        {s.name[0].toUpperCase()}
                      </div>
                      <div className="row-item-main">
                        <div className="row-item-name">{s.name}</div>
                        <div className="row-item-sub">
                          Roll: {s.rollNo}
                          {s.phone ? ` · 📱 ${s.phone}` : ''}
                        </div>
                      </div>
                      <span className="badge badge-blue">{s.rollNo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="stack stack-16 animate-fade-up">
            <div className="card">
              <div className="card-title">Enter Result</div>
              <div className="card-sub">Assign marks — private link auto-generates</div>
              <form className="stack stack-12" onSubmit={saveResult}>
                <div className="field">
                  <label>Student</label>
                  <select
                    value={resultForm.studentId}
                    onChange={e => {
                      setResultForm({ ...resultForm, studentId: e.target.value })
                      setGeneratedToken('')
                      setGeneratedStudent(null)
                    }}
                    required
                  >
                    <option value="">Select student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.rollNo})</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Test</label>
                  <select
                    value={resultForm.testId}
                    onChange={e => setResultForm({ ...resultForm, testId: e.target.value })}
                    required
                  >
                    <option value="">Select test</option>
                    {tests.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Marks (out of 100)</label>
                  <input
                    type="number"
                    placeholder="85"
                    min="0"
                    max="100"
                    value={resultForm.marks}
                    onChange={e => setResultForm({ ...resultForm, marks: e.target.value })}
                    required
                  />
                </div>
                <button className="btn btn-primary btn-full" type="submit" disabled={busy === 'result'}>
                  {busy === 'result' ? 'Saving...' : '💾 Save Result'}
                </button>
              </form>

              {generatedToken && (
                <div style={{ marginTop: 16 }}>
                  <div style={{
                    background: 'var(--blue-dim)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginBottom: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--blue)' }}>
                        🔗 Private Link Ready
                      </span>
                      <button className="copy-btn" onClick={() => copyLink(generatedToken)}>
                        Copy
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cyan)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                      {window.location.origin}/result/{generatedToken}
                    </div>
                  </div>

                  <a
                    href={buildWhatsappHref(generatedToken, generatedStudent)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '13px',
                      borderRadius: 12,
                      background: '#25D366',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 14,
                      textDecoration: 'none',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>📱</span>
                    {generatedStudent?.phone
                      ? `Send to ${generatedStudent.name} on WhatsApp`
                      : 'Share on WhatsApp'}
                  </a>

                  {!generatedStudent?.phone && (
                    <p style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', marginTop: 8 }}>
                      💡 Add student WhatsApp number to send directly to their chat
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="stack stack-16 animate-fade-up">
            <div className="card">
              <div className="card-title">Upload Answer Sheets</div>
              <div className="card-sub">Attach images to a result using its ID</div>
              <form className="stack stack-12" onSubmit={uploadSheets}>
                <div className="field">
                  <label>Result ID</label>
                  <input
                    placeholder="Paste the result _id here"
                    value={uploadForm.resultId}
                    onChange={e => setUploadForm({ resultId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{
                    fontSize: 12, fontWeight: 500, color: 'var(--ink-2)',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    display: 'block', marginBottom: 6
                  }}>
                    Answer Sheets
                  </label>
                  <div className={`file-zone ${uploadFiles.length > 0 ? 'drag' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => {
                        const newFiles = Array.from(e.target.files || []);
                        if (newFiles.length === 0) return;
                        setUploadFiles(prev => [...prev, ...newFiles]);
                        e.target.value = null;
                      }}
                    />
                    <div className="file-zone-icon">📸</div>
                    {uploadFiles.length > 0 ? (
                      <div className="file-zone-text" style={{ color: 'var(--green)' }}>
                        {uploadFiles.length} image{uploadFiles.length > 1 ? 's' : ''} selected
                      </div>
                    ) : (
                      <>
                        <div className="file-zone-text">Tap to open camera or gallery</div>
                        <div className="file-zone-sub">JPG, PNG, HEIC accepted</div>
                      </>
                    )}
                  </div>
                </div>
                {uploadFiles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {uploadFiles.map((f, i) => (
                      <span key={i} className="badge badge-green">{f.name.slice(0, 18)}</span>
                    ))}
                  </div>
                )}
                <button className="btn btn-primary btn-full" type="submit" disabled={busy === 'upload'}>
                  {busy === 'upload' ? 'Uploading...' : '📤 Upload Images'}
                </button>
              </form>
            </div>
            <div className="alert alert-info">
              💡 Result ID milega MongoDB Atlas mein — Collections — results — us document ka _id
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="stack stack-16 animate-fade-up">
            <div className="card">
              <div className="card-title">Test Overview</div>
              <div className="card-sub">Load public results for any test</div>
              <div className="stack stack-12">
                <div className="field">
                  <label>Select Test</label>
                  <select
                    value={overviewTestId}
                    onChange={e => { setOverviewTestId(e.target.value); setOverviewData(null) }}
                  >
                    <option value="">Choose a test</option>
                    {tests.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={loadOverview}
                    disabled={busy === 'overview' || !overviewTestId}
                  >
                    {busy === 'overview' ? 'Loading...' : '📊 Load Overview'}
                  </button>
                  {overviewTestId && (
                    <Link to={`/test/${overviewTestId}`} className="btn btn-ghost" style={{ whiteSpace: 'nowrap' }}>
                      Open
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {overviewData && (
              <>
                <div className="stat-grid">
                  {[
                    ['Total', overviewData.analytics.totalStudents, 'blue'],
                    ['Average', overviewData.analytics.averageMarks, 'amber'],
                    ['Highest', overviewData.analytics.highestMarks, 'green'],
                    ['Lowest', overviewData.analytics.lowestMarks, 'cyan'],
                  ].map(([label, val, cls]) => (
                    <div className="stat-card" key={label}>
                      <div className="stat-label">{label}</div>
                      <div className={`stat-value ${cls}`}>{val}</div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-title">Leaderboard</div>
                  <div className="card-sub">Top rankers</div>
                  <div className="rank-table">
                    {overviewData.leaderboard.map((r) => (
                      <div className="rank-row" key={r.rollNo}>
                        <div className={`rank-num rank-${r.rank}`}>
                          {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="rank-row-name">{r.name}</div>
                          <div className="rank-row-roll">{r.rollNo}</div>
                        </div>
                        <div className="rank-row-marks">{r.marks}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}