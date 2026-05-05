import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import PublicTestPage from './pages/PublicTestPage'
import PrivateResultPage from './pages/PrivateResultPage'
import { getAuthToken } from './services/api'

function ProtectedRoute({ children }) {
  return getAuthToken() ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/test/:testId" element={<PublicTestPage />} />
        <Route path="/public" element={<PublicTestPage />} />
        <Route path="/result/:token" element={<PrivateResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App