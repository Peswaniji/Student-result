import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, clearAuthToken, getAuthToken, getErrorMessage } from '../services/api'

const TABS = ['Tests', 'Students', 'Results', 'Private Links', 'Overview']
const SCHOOL_NAME = 'Swami Vivekanand Govt Model School Gangapur City'

// Confirmation Dialog Component
function ConfirmDialog({ title, message, onConfirm, onCancel, isDangerous = false }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: 16
    }}>
      <div style={{
        background: 'var(--surface-1, #071127)', borderRadius: 14, padding: 24,
        maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.03)'
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost btn-full"
            onClick={onCancel}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            className={`btn btn-full ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            style={{
              flex: 1,
              background: isDangerous ? 'var(--red)' : undefined,
              color: isDangerous ? '#fff' : undefined,
              border: isDangerous ? 'none' : undefined,
              padding: '10px 12px',
              borderRadius: 10,
              fontWeight: 700
            }}
          >
            {isDangerous ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const token = getAuthToken()
  const [me, setMe] = useState(null)
  const [tests, setTests] = useState([])
  const [students, setStudents] = useState([])
  const [results, setResults] = useState([])
  const [activeTab, setActiveTab] = useState(0)
  const [notice, setNotice] = useState({ msg: '', type: '' })
  const [busy, setBusy] = useState('')

  // Test form state
  const [testForm, setTestForm] = useState({ name: '', date: new Date().toISOString().slice(0, 10) })
  const [editingTestId, setEditingTestId] = useState(null)

  // Student form state
  const [studentForm, setStudentForm] = useState({ name: '', rollNo: '', phone: '' })
  const [editingStudentId, setEditingStudentId] = useState(null)

  // Result form state
  const [resultForm, setResultForm] = useState({ studentId: '', testId: '', marks: '' })
  const [editingResultId, setEditingResultId] = useState(null)
  const [generatedToken, setGeneratedToken] = useState('')
  const [generatedStudent, setGeneratedStudent] = useState(null)
  const [pendingResults, setPendingResults] = useState([]) // batch before final save
  const [sharedResultIds, setSharedResultIds] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('srms_shared_result_ids') || '[]')
    } catch (err) {
      return []
    }
  })

  // Upload form state
  const [uploadForm, setUploadForm] = useState({ resultId: '' })
  const [uploadFiles, setUploadFiles] = useState([])

  // Overview state
  const [overviewTestId, setOverviewTestId] = useState('')
  const [overviewData, setOverviewData] = useState(null)

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState(null)

  // Import state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFromTest, setImportFromTest] = useState('')

  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return }
    loadAll()
  }, [])

  useEffect(() => {
    window.localStorage.setItem('srms_shared_result_ids', JSON.stringify(sharedResultIds))
  }, [sharedResultIds])

  // sharedResultIds persisted to localStorage

  async function loadAll() {
    try {
      const [meRes, testsRes, studentsRes, resultsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/tests'),
        api.get('/students'),
        api.get('/results'),
      ])
      setMe(meRes.data.data)
      const t = testsRes.data.data || []
      const s = studentsRes.data.data || []
      const r = resultsRes.data.data || []
      setTests(t)
      setStudents(s)
      setResults(r)
      if (t[0]) setResultForm(f => ({ ...f, testId: t[0]._id }))
      if (s[0]) setResultForm(f => ({ ...f, studentId: s[0]._id }))
    } catch (err) {
      clearAuthToken()
      navigate('/login', { replace: true })
    }
  }

  async function refreshLists() {
    const [t, s, r] = await Promise.all([
      api.get('/tests'),
      api.get('/students'),
      api.get('/results'),
    ])
    setTests(t.data.data || [])
    setStudents(s.data.data || [])
    setResults(r.data.data || [])
  }

  function showNotice(msg, type = 'success') {
    setNotice({ msg, type })
    setTimeout(() => setNotice({ msg: '', type: '' }), 4000)
  }

  // ==================== TEST FUNCTIONS ====================
  async function createOrUpdateTest(e) {
    e.preventDefault()
    if (!testForm.name || !testForm.date) {
      showNotice('Please fill all fields', 'error')
      return
    }

    setConfirmDialog({
      title: editingTestId ? 'Update Test?' : 'Create Test?',
      message: editingTestId
        ? `Update "${testForm.name}"?`
        : `Create new test "${testForm.name}"?`,
      onConfirm: async () => {
        setConfirmDialog(null)
        setBusy('test')
        try {
          if (editingTestId) {
            await api.put(`/tests/${editingTestId}`, testForm)
            showNotice('Test updated')
            setEditingTestId(null)
          } else {
            await api.post('/tests', testForm)
            showNotice('Test created')
          }
          setTestForm({ name: '', date: new Date().toISOString().slice(0, 10) })
          await refreshLists()
        } catch (err) { showNotice(getErrorMessage(err), 'error') }
        finally { setBusy('') }
      },
      onCancel: () => setConfirmDialog(null)
    })
  }

  function editTest(test) {
    setTestForm({ name: test.name, date: test.date?.slice(0, 10) })
    setEditingTestId(test._id)
  }

  function deleteTest(test) {
    setConfirmDialog({
      title: 'Delete Test?',
      message: `"${test.name}" and all results will be deleted permanently.`,
      isDangerous: true,
      onConfirm: async () => {
        setConfirmDialog(null)
        setBusy('test')
        try {
          await api.delete(`/tests/${test._id}`)
          showNotice('Test deleted')
          await refreshLists()
        } catch (err) { showNotice(getErrorMessage(err), 'error') }
        finally { setBusy('') }
      },
      onCancel: () => setConfirmDialog(null)
    })
  }

  function cancelEditTest() {
    setEditingTestId(null)
    setTestForm({ name: '', date: new Date().toISOString().slice(0, 10) })
  }

  // ==================== STUDENT FUNCTIONS ====================
  async function createOrUpdateStudent(e) {
    e.preventDefault()
    if (!studentForm.name || !studentForm.rollNo) {
      showNotice('Please fill required fields', 'error')
      return
    }

    setConfirmDialog({
      title: editingStudentId ? 'Update Student?' : 'Add Student?',
      message: editingStudentId
        ? `Update "${studentForm.name}"?`
        : `Add "${studentForm.name}" to class?`,
      onConfirm: async () => {
        setConfirmDialog(null)
        setBusy('student')
        try {
          if (editingStudentId) {
            await api.put(`/students/${editingStudentId}`, studentForm)
            showNotice('Student updated')
            setEditingStudentId(null)
          } else {
            await api.post('/students', studentForm)
            showNotice('Student added')
          }
          setStudentForm({ name: '', rollNo: '', phone: '' })
          await refreshLists()
        } catch (err) { showNotice(getErrorMessage(err), 'error') }
        finally { setBusy('') }
      },
      onCancel: () => setConfirmDialog(null)
    })
  }

  function editStudent(student) {
    setStudentForm({ name: student.name, rollNo: student.rollNo, phone: student.phone || '' })
    setEditingStudentId(student._id)
  }

  function deleteStudent(student) {
    setConfirmDialog({
      title: 'Delete Student?',
      message: `"${student.name}" will be removed permanently.`,
      isDangerous: true,
      onConfirm: async () => {
        setConfirmDialog(null)
        setBusy('student')
        try {
          await api.delete(`/students/${student._id}`)
          showNotice('Student deleted')
          await refreshLists()
        } catch (err) { showNotice(getErrorMessage(err), 'error') }
        finally { setBusy('') }
      },
      onCancel: () => setConfirmDialog(null)
    })
  }

  function cancelEditStudent() {
    setEditingStudentId(null)
    setStudentForm({ name: '', rollNo: '', phone: '' })
  }

  async function importStudentsFromTest() {
    if (!importFromTest) {
      showNotice('Select a test to import from', 'error')
      return
    }

    setBusy('import')
    try {
      const { data } = await api.get(`/tests/${importFromTest}`)
      // Assuming the API returns students for that test
      // For now, just show a message
      showNotice('Import feature coming soon!', 'info')
    } catch (err) {
      showNotice(getErrorMessage(err), 'error')
    } finally {
      setBusy('')
      setShowImportModal(false)
    }
  }

  // ==================== RESULT FUNCTIONS ====================
  async function createOrUpdateResult(e) {
    e.preventDefault()
    if (!resultForm.studentId || !resultForm.testId || resultForm.marks === '') {
      showNotice('Please fill all fields', 'error')
      return
    }

    // If editing existing result, keep original behavior
    if (editingResultId) {
      setConfirmDialog({
        title: 'Update Result?',
        message: `Update marks to ${resultForm.marks}?`,
        onConfirm: async () => {
          setConfirmDialog(null)
          setBusy('result')
          try {
            await api.put(`/results/${editingResultId}`, { marks: resultForm.marks })
            showNotice('Result updated')
            setEditingResultId(null)
            await refreshLists()
            setResultForm({ studentId: resultForm.studentId, testId: resultForm.testId, marks: '' })
          } catch (err) { showNotice(getErrorMessage(err), 'error') }
          finally { setBusy('') }
        },
        onCancel: () => setConfirmDialog(null)
      })
      return
    }

    // Add to pending batch (student + marks). Uploads handled per item.
    setPendingResults(p => [...p, { ...resultForm, files: uploadFiles }])
    setResultForm({ studentId: resultForm.studentId, testId: resultForm.testId, marks: '' })
    setUploadFiles([])
    showNotice('Added to batch. You can add more or Save All.')
  }

  function editResult(result) {
    const stu = students.find(s => s._id === result.studentId)
    setResultForm({ studentId: result.studentId, testId: result.testId, marks: result.marks.toString() })
    setGeneratedStudent(stu || null)
    setEditingResultId(result._id)
  }

  function deleteResult(result) {
    const stu = students.find(s => s._id === result.studentId)
    setConfirmDialog({
      title: 'Delete Result?',
      message: `${stu?.name || 'Student'}'s result will be deleted permanently.`,
      isDangerous: true,
      onConfirm: async () => {
        setConfirmDialog(null)
        setBusy('result')
        try {
          await api.delete(`/results/${result._id}`)
          showNotice('Result deleted')
          await refreshLists()
        } catch (err) { showNotice(getErrorMessage(err), 'error') }
        finally { setBusy('') }
      },
      onCancel: () => setConfirmDialog(null)
    })
  }

  function cancelEditResult() {
    setEditingResultId(null)
    setGeneratedToken('')
    setGeneratedStudent(null)
    setResultForm({ studentId: resultForm.studentId, testId: resultForm.testId, marks: '' })
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

  async function finalizeBatch() {
    if (pendingResults.length === 0) {
      showNotice('No pending entries to save', 'error')
      return
    }
    setBusy('saving')
    const created = []
    try {
      for (const p of pendingResults) {
        const payload = { studentId: p.studentId, testId: p.testId, marks: p.marks }
        const res = await api.post('/results', payload)
        const result = res.data?.data
        if (result) {
          let uploadedDocs = []
          // upload files if any
          if (p.files && p.files.length > 0) {
            const fd = new FormData()
            p.files.forEach(f => fd.append('images', f))
            try {
              const uploadRes = await api.post(`/results/${result._id}/uploads`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
              uploadedDocs = uploadRes.data?.data || []
            } catch (uploadErr) {
              console.error('Upload failed for', result._id, uploadErr)
            }
          }
          if (uploadedDocs.length > 0) {
            result.answerSheets = [...(result.answerSheets || []), ...uploadedDocs]
          }
          created.push(result)
        }
      }
      setResults(prev => {
        const combined = [...created, ...prev]
        const unique = []
        const seen = new Set()
        for (const item of combined) {
          const id = item?._id || item?.id
          if (!id || seen.has(id)) continue
          seen.add(id)
          unique.push(item)
        }
        return unique
      })
      setPendingResults([])
      await refreshLists()
      showNotice(`Saved ${created.length} results`)
    } catch (err) {
      showNotice(getErrorMessage(err), 'error')
    } finally {
      setBusy('')
    }
  }

  function openShareLink(result) {
    const student = result.studentId && typeof result.studentId === 'object' ? result.studentId : students.find(s => s._id === result.studentId)
    const tok = result.token || result._id
    const url = buildWhatsappHref(tok, student)
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (!opened) {
      showNotice('Popup blocked. Allow popups and try again.', 'error')
      return false
    }
    return true
  }

  function shareResult(result) {
    // Immediately mark as shared in UI/localStorage
    setSharedResultIds(prev => (prev.includes(result._id) ? prev : [...prev, result._id]))
    const student = result.studentId && typeof result.studentId === 'object' ? result.studentId : students.find(s => s._id === result.studentId)
    // Try opening WhatsApp; notify user if popup blocked
    const opened = openShareLink(result)
    if (!opened) {
      showNotice(`Marked as shared locally. Popup blocked; allow popups to open WhatsApp.`, 'info')
    } else {
      showNotice(`WhatsApp opened for ${student?.name || 'student'}. Marked as shared.`, 'success')
    }
  }

  function getStudentById(studentId) {
    return students.find(s => s._id === studentId) || null
  }

  function getTestById(testId) {
    return tests.find(t => t._id === testId) || null
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
    const publicUrl = `${window.location.origin}/public`
    const name = student?.name || 'Student'
    const congratMsg = student?.rank === 1 ? '\n\n🎉 *Congratulations! You topped the test!*' : ''
    const msg = `📊 *${SCHOOL_NAME}*\n\nHi ${name}! Your ${generatedStudent ? 'result' : 'results'} are ready.${congratMsg}\n\n🔗 View marks & answer sheets:\n${url}\n\n📋 See full leaderboard:\n${publicUrl}\n\n_No login required_`
    if (student?.phone) {
      const phone = student.phone.replace(/\D/g, '')
      return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    }
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="page">
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          isDangerous={confirmDialog.isDangerous}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}

      <nav className="topbar">
        <div>
          <div className="topbar-logo">
            <span className="dot" />
            ResultFlow
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{SCHOOL_NAME}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
      </nav>

      {notice.msg && (
        <div style={{ padding: '8px 20px' }}>
          <div className={`alert alert-${notice.type === 'error' ? 'error' : notice.type === 'info' ? 'info' : 'success'}`}>
            {notice.msg}
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px 0' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          {me ? `Hi, ${me.email.split('@')[0]} 👋` : 'Dashboard'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14 }}>
          Manage tests, students and results
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
          <div className="stat-card">
            <div className="stat-label">Results</div>
            <div className="stat-value cyan">{results.length}</div>
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

        {/* TESTS TAB */}
        {activeTab === 0 && (
          <div className="stack stack-16 animate-fade-up">
            <div className="card">
              <div className="card-title">{editingTestId ? '✏️ Edit Test' : 'Create New Test'}</div>
              <div className="card-sub">{editingTestId ? 'Update test details' : 'Add a test name and date'}</div>
              <form className="stack stack-12" onSubmit={createOrUpdateTest}>
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
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-full" type="submit" disabled={busy === 'test'} style={{ flex: 1 }}>
                    {busy === 'test' ? 'Saving...' : editingTestId ? '✅ Update' : '+ Create'}
                  </button>
                  {editingTestId && (
                    <button
                      className="btn btn-ghost btn-full"
                      type="button"
                      onClick={cancelEditTest}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
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
                    <div className="row-item" key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: 'var(--blue-dim)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 16, flexShrink: 0
                        }}>📋</div>
                        <div className="row-item-main">
                          <div className="row-item-name">{t.name}</div>
                          <div className="row-item-sub">{t.date?.slice(0, 10)} · ID: {t._id.slice(-6)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => editTest(t)}>✏️</button>
                        <button
                          className="btn btn-sm"
                          onClick={() => deleteTest(t)}
                          style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 8 }}
                        >
                          Delete
                        </button>
                        <Link to={`/test/${t._id}`} className="btn btn-ghost btn-sm">View</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 1 && (
          <div className="stack stack-16 animate-fade-up">
            <div className="card">
              <div className="card-title">{editingStudentId ? '✏️ Edit Student' : 'Add Student'}</div>
              <div className="card-sub">Roll number must be unique</div>
              <form className="stack stack-12" onSubmit={createOrUpdateStudent}>
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
                    disabled={editingStudentId ? false : false}
                  />
                </div>
                <div className="field">
                  <label>
                    WhatsApp Number
                    <span style={{ color: 'var(--ink-3)', fontWeight: 400, marginLeft: 4 }}>(optional - any format)</span>
                  </label>
                  <input
                    placeholder="9876543210"
                    value={studentForm.phone}
                    onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })}
                    type="tel"
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-full" type="submit" disabled={busy === 'student'} style={{ flex: 1 }}>
                    {busy === 'student' ? 'Saving...' : editingStudentId ? '✅ Update' : '+ Add'}
                  </button>
                  {editingStudentId && (
                    <button
                      className="btn btn-ghost btn-full"
                      type="button"
                      onClick={cancelEditStudent}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                className="btn btn-ghost btn-full"
                onClick={() => setShowImportModal(true)}
              >
                📥 Import from Previous Test
              </button>
            </div>

            {showImportModal && (
              <div style={{
                background: 'var(--surface-2)', padding: 16, borderRadius: 10, marginBottom: 16
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Import Students</div>
                <select
                  value={importFromTest}
                  onChange={e => setImportFromTest(e.target.value)}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  <option value="">Select a test to copy students from</option>
                  {tests.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={importStudentsFromTest}
                    disabled={busy === 'import'}
                    style={{ flex: 1 }}
                  >
                    {busy === 'import' ? 'Importing...' : 'Import'}
                  </button>
                  <button
                    className="btn btn-ghost btn-full"
                    onClick={() => setShowImportModal(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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
                    <div className="row-item" key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
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
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => editStudent(s)}>✏️</button>
                        <button
                          className="btn btn-sm"
                          onClick={() => deleteStudent(s)}
                          style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 8 }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 2 && (
          <div className="stack stack-16 animate-fade-up">
            <div className="card">
              <div className="card-title">{editingResultId ? '✏️ Edit Result' : 'Enter Result'}</div>
              <div className="card-sub">{editingResultId ? 'Update marks' : 'Assign marks — personalized link auto-generates'}</div>
              <form className="stack stack-12" onSubmit={createOrUpdateResult}>
                <div className="field">
                  <label>Student</label>
                  <select
                    value={resultForm.studentId}
                    onChange={e => {
                      setResultForm({ ...resultForm, studentId: e.target.value })
                      if (!editingResultId) {
                        setGeneratedToken('')
                        setGeneratedStudent(null)
                      }
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
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Answer Sheets (optional)</label>
                  <div className={`file-zone ${uploadFiles.length > 0 ? 'drag' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={e => setUploadFiles(Array.from(e.target.files || []))}
                    />
                    <div className="file-zone-icon">📸</div>
                    {uploadFiles.length > 0 ? (
                      <div className="file-zone-text" style={{ color: 'var(--green)' }}>
                        {uploadFiles.length} image{uploadFiles.length > 1 ? 's' : ''} selected
                      </div>
                    ) : (
                      <>
                        <div className="file-zone-text">Attach answer sheet images here</div>
                        <div className="file-zone-sub">Optional: multiple images</div>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-primary btn-full" type="submit" disabled={busy === 'result'} style={{ flex: 1 }}>
                    {busy === 'result' ? 'Processing...' : editingResultId ? '✅ Update' : '+ Add To Batch'}
                  </button>
                  {editingResultId && (
                    <button
                      className="btn btn-ghost btn-full"
                      type="button"
                      onClick={cancelEditResult}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
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

            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-title">Pending Batch ({pendingResults.length})</div>
              <div className="card-sub">Review entries before saving all. Each row shows student, test, marks and documents.</div>
              {pendingResults.length === 0 ? (
                <div className="empty" style={{ padding: 12 }}><div className="empty-icon">📝</div>No pending entries</div>
              ) : (
                <div style={{ padding: 8 }}>
                  {pendingResults.map((p, idx) => {
                    const s = getStudentById(p.studentId)
                    const t = getTestById(p.testId)
                    return (
                      <div key={idx} className="row-item" style={{ display: 'block', marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                          <div className="row-item-main" style={{ flex: 1 }}>
                            <div className="row-item-name">{s?.name || 'Unknown'} <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>{s?.rollNo ? `(${s.rollNo})` : ''}</span></div>
                            <div className="row-item-sub">Test: {t?.name || 'Unknown'} · Marks: {p.marks}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                              setResultForm({ studentId: p.studentId, testId: p.testId, marks: p.marks })
                              setUploadFiles(p.files || [])
                              setPendingResults(prev => prev.filter((_, i) => i !== idx))
                            }}>Edit</button>
                            <button className="btn btn-sm" onClick={() => setPendingResults(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'var(--red)', color: '#fff', border: 'none' }}>Delete</button>
                          </div>
                        </div>

                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border-2)' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--ink-2)' }}>Uploaded Documents</div>
                          {p.files?.length ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {p.files.map((f, fileIndex) => (
                                <span key={`${idx}-${fileIndex}`} className="badge badge-green">{f.name || `file-${fileIndex + 1}`}</span>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>No documents uploaded for this student.</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn btn-primary btn-full" onClick={finalizeBatch} disabled={busy === 'saving'} style={{ flex: 1 }}>{busy === 'saving' ? 'Saving...' : '✅ Save All'}</button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="section-header">
                <div className="section-title">Recent Results ({results.length})</div>
              </div>
              {results.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📊</div>
                  No results yet
                </div>
              ) : (
                <div className="rank-table">
                  {results.slice(0, 10).map((r) => {
                    const studentObj = r.studentId && typeof r.studentId === 'object' ? r.studentId : null
                    const testObj = r.testId && typeof r.testId === 'object' ? r.testId : null

                    const studentId = studentObj ? studentObj._id : r.studentId
                    const testId = testObj ? testObj._id : r.testId

                    const stu = students.find(s => s._id === studentId)
                    const tst = tests.find(t => t._id === testId)

                    const studentName = stu?.name || studentObj?.name || 'Unknown'
                    const testName = tst?.name || testObj?.name || 'Unknown'
                    const isShared = sharedResultIds.includes(r._id)

                    return (
                      <div className="row-item" key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="row-item-main">
                          <div className="row-item-name">
                            {studentName}
                            <span className={`badge ${isShared ? 'badge-green' : 'badge-gray'}`} style={{ marginLeft: 8 }}>
                              {isShared ? 'Shared' : 'Not shared'}
                            </span>
                          </div>
                          <div className="row-item-sub">{testName} · {r.marks} marks</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                          <button
                            className="btn btn-sm"
                            onClick={() => shareResult(r)}
                            style={{
                              background: isShared ? 'var(--green)' : '#25D366',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: 8
                            }}
                          >
                            {isShared ? 'Shared' : 'Share'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => editResult(r)}>✏️</button>
                          <button
                            className="btn btn-sm"
                            onClick={() => deleteResult(r)}
                            style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 8 }}
                          >
                            Delete
                          </button>
                          <Link to={`/result/${r.token || r._id}`} className="btn btn-ghost btn-sm">View</Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 3 && (
          <div className="stack stack-16 animate-fade-up">
            <div className="card">
              <div className="card-title">Private Result Links</div>
              <div className="card-sub">Students whose results are already created. Each link opens the private result page.</div>
            </div>

            {results.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🔗</div>
                No generated links yet
              </div>
            ) : (
              <div className="rank-table">
                {results.map((r) => {
                  const studentObj = r.studentId && typeof r.studentId === 'object' ? r.studentId : null
                  const testObj = r.testId && typeof r.testId === 'object' ? r.testId : null
                  const studentId = studentObj ? studentObj._id : r.studentId
                  const testId = testObj ? testObj._id : r.testId
                  const stu = students.find(s => s._id === studentId)
                  const tst = tests.find(t => t._id === testId)
                  const studentName = stu?.name || studentObj?.name || 'Unknown'
                  const rollNo = stu?.rollNo || studentObj?.rollNo || '—'
                  const testName = tst?.name || testObj?.name || 'Unknown'
                  const privateUrl = `${window.location.origin}/result/${r.token || r._id}`

                  return (
                    <div className="row-item" key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div className="row-item-main" style={{ flex: 1 }}>
                        <div className="row-item-name">{studentName}</div>
                        <div className="row-item-sub">Roll: {rollNo} · {testName} · {r.marks} marks</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', wordBreak: 'break-all', marginTop: 6 }}>
                          {privateUrl}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => copyLink(r.token || r._id)}
                        >
                          Copy Link
                        </button>
                        <Link to={`/result/${r.token || r._id}`} className="btn btn-primary btn-sm">
                          Open
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
                    style={{ flex: 1 }}
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
