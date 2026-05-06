import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TicketsPage from './pages/TicketsPage'
import AssetsPage from './pages/AssetsPage'
import Layout from './components/Layout'
import SignUpPage from './pages/SignUpPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

const RoleBasedHome = () => {
  const { user } = useAuth()
  if (user?.role === 'vendor_admin' || user?.role === 'manager') {
    return <DashboardPage />
  }
  return <TicketsPage />
}

export default function App() {
  const { user } = useAuth()

  const isVendorSide =
    user?.role === 'vendor_admin' || user?.role === 'manager'

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleBasedHome />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="assets" element={<AssetsPage />} />
          
          {isVendorSide && (
            <Route path="dashboard" element={<DashboardPage />} />
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}