import { useState } from 'react'
import type React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const drawerWidth = 240

const navItems: Array<{ to: string; label: string; icon?: React.ReactNode }> = [
  { to: '/', label: 'لوحة التحكم' },
  { to: '/rooms', label: 'الغرف' },
  { to: '/floors', label: 'الأدوار' },
  { to: '/room-types', label: 'أنواع الغرف' },
  { to: '/room-statuses', label: 'حالات الغرف' },
  { to: '/reservations', label: 'الحجوزات' },
  { to: '/settings', label: 'الإعدادات' },
]

export default function MainLayout() {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  // Theme handling removed

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center gap-2 px-4 h-14">
          <button
            className="rtl:ml-2 ltr:mr-2 inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-800"
            onClick={() => setOpen(!open)}
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="font-extrabold text-lg">لوحة إدارة الفندق</div>
          <div className="ms-auto flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md border px-3.5 h-9 text-sm bg-white hover:bg-neutral-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className="fixed top-14 bottom-0 right-0 z-30 border-s bg-white"
        style={{ width: open ? drawerWidth : 72 }}
      >
        <nav className="h-full overflow-y-auto py-3">
          <ul className="px-2 space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => [
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive ? 'bg-neutral-100 text-neutral-900' : 'hover:bg-neutral-100 text-neutral-700',
                  ].join(' ')}
                >
                  {/* Placeholder circle icon */}
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">•</span>
                  <span className={open ? 'whitespace-nowrap' : 'sr-only'}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 pt-14"
        style={{ marginRight: open ? drawerWidth : 72 }}
      >
        <div className="p-3">
          <Outlet />
        </div>
      </main>
    </div>
  )
}


