import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LoadingSkeleton } from './components'
import { AppShell } from './layout'
import { AuthProvider } from './auth'
import { useAuth } from './useAuth'
import './App.css'
import './auth.css'

const corePage = (name: 'Dashboard' | 'Customers' | 'CustomerDetail' | 'Invoices' | 'Expenses') =>
  lazy(() => import('./pages/CorePages').then(module => ({ default: module[name] })))
const workflowPage = (name: 'CreateInvoice' | 'UploadReceipt' | 'Reports' | 'SettingsPage') =>
  lazy(() => import('./pages/WorkflowPages').then(module => ({ default: module[name] })))

const Dashboard = corePage('Dashboard')
const Customers = corePage('Customers')
const CustomerDetail = corePage('CustomerDetail')
const Invoices = corePage('Invoices')
const Expenses = corePage('Expenses')
const CreateInvoice = workflowPage('CreateInvoice')
const UploadReceipt = workflowPage('UploadReceipt')
const Reports = workflowPage('Reports')
const SettingsPage = workflowPage('SettingsPage')
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })))
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(module => ({ default: module.ProductsPage })))

function ProtectedRoutes() {
  const { loading, profile } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSkeleton />
  if (!profile) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <AppShell key={profile.company.id}><Suspense fallback={<LoadingSkeleton />}><Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/customers" element={<Customers />} />
    <Route path="/customers/:id" element={<CustomerDetail />} />
    <Route path="/products" element={<ProductsPage />} />
    <Route path="/invoices" element={<Invoices />} />
    <Route path="/invoices/new" element={<CreateInvoice />} />
    <Route path="/expenses" element={<Expenses />} />
    <Route path="/expenses/upload" element={<UploadReceipt />} />
    <Route path="/reports" element={<Reports />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></AppShell>
}

export default function App() {
  return <BrowserRouter><AuthProvider><Suspense fallback={<LoadingSkeleton />}><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/*" element={<ProtectedRoutes />} />
  </Routes></Suspense></AuthProvider></BrowserRouter>
}
