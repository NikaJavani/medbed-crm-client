import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Ticket,
  BedDouble,
  LogOut,
  Activity,
} from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()

  const isVendorSide =
    user?.role === 'vendor_admin' || user?.role === 'manager'

  const navItems = [
    ...(isVendorSide
      ? [{ to: '/', icon: LayoutDashboard, label: 'Dashboard' }]
      : []),
    { to: isVendorSide ? '/tickets' : '/', icon: Ticket, label: 'Tickets' },
    { to: '/assets', icon: BedDouble, label: 'Assets' },
  ]

  const roleLabel: Record<string, string> = {
    vendor_admin: 'Vendor Admin',
    manager: 'Manager',
    technician: 'Technician',
    hospital_admin: 'Hospital Admin',
    hospital_staff: 'Staff',
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-primary-700">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-300" />
            <div>
              <p className="font-bold text-sm">Piyatech</p>
              <p className="text-xs text-blue-300">Service Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-blue-200 hover:bg-primary-700 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-primary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-blue-300">
                {roleLabel[user?.role ?? ''] ?? user?.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-blue-300 hover:text-white rounded transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}