import { useState, useEffect } from 'react'
import type React from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Home, BedDouble, Building2, Tags, ListChecks, CalendarCheck2, List, Users as UsersIcon, Shield, Settings, LogOut, Menu, X, ChevronLeft, DollarSign, Package, ShoppingCart, ArrowDownCircle, Sparkles } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

const drawerWidth = 220

const navItems: Array<{ to: string; label: string; icon: React.ReactNode }> = [
  { to: '/reservations', label: 'إنشاء حجز', icon: <CalendarCheck2 className="size-5" /> },
  { to: '/reservations-list', label: 'قائمة الحجوزات', icon: <List className="size-5" /> },
  { to: '/customers', label: 'العملاء', icon: <UsersIcon className="size-5" /> },
  { to: '/rooms', label: 'الغرف', icon: <BedDouble className="size-5" /> },
  { to: '/room-types', label: 'أنواع الغرف', icon: <Tags className="size-5" /> },
  { to: '/floors', label: 'الطوابق', icon: <Building2 className="size-5" /> },
  // { to: '/room-statuses', label: 'حالات الغرف', icon: <ListChecks className="size-5" /> },
  { to: '/costs', label: 'المصاريف', icon: <DollarSign className="size-5" /> },
  { to: '/inventory', label: 'المخزون', icon: <Package className="size-5" /> },
  { to: '/inventory-orders', label: 'طلبات المخزون', icon: <ShoppingCart className="size-5" /> },
  { to: '/inventory-receipts', label: 'واردات المخزون', icon: <ArrowDownCircle className="size-5" /> },
  { to: '/cleaning-notifications', label: 'تنبيهات النظافة', icon: <Sparkles className="size-5" /> },
  { to: '/users', label: 'المستخدمين', icon: <Shield className="size-5" /> },
  { to: '/settings', label: 'الإعدادات', icon: <Settings className="size-5" /> },
]

export default function MainLayout() {
  const [open, setOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Responsive: close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setOpen(false)
      } else {
        setOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  const currentPage = navItems.find(item => item.to === location.pathname)?.label || 'لوحة التحكم'

  return (
    <div className=" min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Top bar - Modern glassmorphism */}
      <header className="w-full top-0 inset-x-0 z-40 border-b border-border/40 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="flex items-center gap-3 px-4 h-16">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 w-10 p-0 hover:bg-accent transition-all duration-200" 
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileOpen(!mobileOpen)
              } else {
                setOpen(!open)
              }
            }} 
            aria-label="Toggle sidebar"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
              🏨
            </div>
            <div>
              <div className="font-bold text-base leading-none">نظام إدارة الفنادق</div>
              <div className="text-xs text-muted-foreground hidden sm:block">{currentPage}</div>
            </div>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-all duration-200" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Modern with smooth animations */}
      <div className=' flex gap-1'>
          <aside
        className={`fixed top-16 right-0 border-e border-border/40 bg-card/95 backdrop-blur-xl shadow-xl transition-all duration-300 ease-in-out z-30 ${
          mobileOpen ? 'translate-x-0' : window.innerWidth < 768 && !open ? 'translate-x-full' : ''
        }`}
        style={{ 
          width: open || mobileOpen ? drawerWidth : 72,
          height: 'calc(100vh - 4rem)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        aria-label="الشريط الجانبي"
      >
        <TooltipProvider>
          <nav className="h-full overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent" role="navigation">
            <ul className="px-3 space-y-1">
              {navItems.map((item, index) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }: { isActive: boolean }) => [
                      'group flex items-center gap-3 rounded-xl px-1 py-1 text-sm font-bold transition-all duration-200',
                      'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                      isActive
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                        : 'hover:bg-accent/80 text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                          location.pathname === item.to 
                            ? 'bg-primary-foreground/20 text-primary-foreground' 
                            : 'bg-accent/50 text-foreground/70 group-hover:bg-accent group-hover:text-foreground'
                        }`}>
                          {item.icon}
                        </span>
                      </TooltipTrigger>
                      {!open && !mobileOpen && (
                        <TooltipContent side="right" className="px-3 py-2 text-sm font-bold">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <span className={(open || mobileOpen) ? 'whitespace-nowrap flex-1 text-black' : 'sr-only'}>{item.label}</span>
                    {(open || mobileOpen) && location.pathname === item.to && (
                      <ChevronLeft className="size-4 opacity-70" />
                    )}
                  </NavLink>
                  {/* Subtle divider between items */}
                  {index < navItems.length - 1 && (
                    <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </TooltipProvider>
      </aside>

      {/* Main content - Modern with padding and max-width */}
      <main
        className="flex-1 transition-all duration-300 md:mr-0 "
        style={{ 
          marginRight: window.innerWidth >= 768 ? (open ? drawerWidth : 72) : 0
        }}
      >
        <div className="container max-w-7xl p-1">
          <Outlet />
        </div>
      </main>
      </div>
    
    </div>
  )
}


