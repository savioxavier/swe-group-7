import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import CanvasGarden from './components/garden/CanvasGarden'
import './App.css'

function AuthRedirect() {
  const { user } = useAuth()
  return user ? <Navigate to="/garden" replace /> : <Navigate to="/signin" replace />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route 
            path="/garden" 
            element={
              <ProtectedRoute>
                <CanvasGarden />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/canvas-garden" 
            element={
              <ProtectedRoute>
                <CanvasGarden />
              </ProtectedRoute>
            } 
          />
          <Route path="/app" element={<AuthRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
