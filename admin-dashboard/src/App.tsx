import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Performers from './pages/Performers'
import Content from './pages/Content'
import Upload from './pages/Upload'
import Analytics from './pages/Analytics'
import Admins from './pages/Admins'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import Import from './pages/Import'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="performers" element={<Performers />} />
        <Route path="content" element={<Content />} />
        <Route path="categories" element={<Categories />} />
        <Route path="upload" element={<Upload />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="admins" element={<Admins />} />
        <Route path="import" element={<Import />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
