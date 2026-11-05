import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'

import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'

import { Home } from './pages/Home'
import { CommissionRequest } from './pages/CommissionRequest'
import { Members } from './pages/Members'
import { MemberProfile } from './pages/MemberProfile'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Moderation } from './pages/Moderation'
import { CreateMember } from './pages/CreateMember'
import { Discover } from './pages/Discover'
import { CommissionManagement } from './pages/CommissionManagement'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-white)] text-[var(--color-black)]">

      <Header />

      <main className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/commission" element={<CommissionRequest />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:memberId" element={<MemberProfile />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/login" element={<Login />} />

          {/* Any authenticated member */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Leadership only */}
          <Route element={<ProtectedRoute requiredRole="LEADERSHIP" />}>
            <Route path="/leadership/moderation" element={<Moderation />} />
            <Route path="/leadership/commissions" element={<CommissionManagement />} />
            <Route path="/leadership/members/new" element={<CreateMember />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />

    </div>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-24">
      <h1 className="type-subheading-1">Page not found</h1>
    </div>
  )
}