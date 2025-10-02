import { useState } from 'react'
import type React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Home, BedDouble, Building2, Tags, ListChecks, CalendarCheck2, Settings, LogOut, PanelRight } from 'lucide-react'

const drawerWidth = 240

const navItems: Array<{ to: string; label: string; icon: React.ReactNode }> = [
  { to: '/', label: 'لوحة التحكم', icon: <Home className="size-5" /> },
  { to: '/rooms', label: 'الغرف', icon: <BedDouble className="size-5" /> },
  { to: '/floors', label: 'الأدوار', icon: <Building2 className="size-5" /> },
  { to: '/room-types', label: 'أنواع الغرف', icon: <Tags className="size-5" /> },
  { to: '/room-statuses', label: 'حالات الغرف', icon: <ListChecks className="size-5" /> },
  { to: '/reservations', label: 'الحجوزات', icon: <CalendarCheck2 className="size-5" /> },
  { to: '/settings', label: 'الإعدادات', icon: <Settings className="size-5" /> },
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
          <Button variant="outline" size="sm" className="rtl:ml-2 ltr:mr-2 h-9 w-9 p-0" onClick={() => setOpen(!open)} aria-label="Toggle sidebar">
            <PanelRight className="size-4" />
          </Button>
          <div className="font-extrabold text-lg">لوحة إدارة الفندق</div>
          <div className="ms-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className="fixed top-14 bottom-0 right-0 z-30 border-s bg-white"
        style={{ width: open ? drawerWidth : 72 }}
        aria-label="الشريط الجانبي"
      >
        <TooltipProvider>
          <nav className="h-full overflow-y-auto py-3" role="navigation">
            <ul className="px-2 space-y-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }: { isActive: boolean }) => [
                      'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                      isActive ? 'bg-neutral-100 text-neutral-900' : 'hover:bg-neutral-100 text-neutral-700',
                    ].join(' ')}
                  >
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
                          {item.icon}
                        </span>
                      </TooltipTrigger>
                      {!open && (
                        <TooltipContent side="left" className="px-2 py-1 text-xs">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <span className={open ? 'whitespace-nowrap' : 'sr-only'}>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </TooltipProvider>
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


