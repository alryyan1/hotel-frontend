import { useState, useEffect } from "react";
import type React from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import {
  Home,
  BedDouble,
  Building2,
  Tags,
  CalendarCheck2,
  List,
  Users as UsersIcon,
  Shield,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
  DollarSign,
  Package,
  ShoppingCart,
  ArrowDownCircle,
  Sparkles,
  Calculator,
  ChevronRight,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import apiClient from "../api/axios";

const drawerWidth = 250;

// Navigation groups structure
const navigationGroups = [
  {
    title: "الحجوزات",
    icon: <CalendarCheck2 className="size-5" />,
    items: [
      {
        to: "/reservations",
        label: "إنشاء حجز",
        icon: <CalendarCheck2 className="size-5" />,
      },
      {
        to: "/reservations-list",
        label: "قائمة الحجوزات",
        icon: <List className="size-5" />,
      },
    ],
  },
  {
    title: "العملاء",
    icon: <UsersIcon className="size-5" />,
    items: [
      {
        to: "/customers",
        label: "العملاء",
        icon: <UsersIcon className="size-5" />,
      },
    ],
  },
  {
    title: "إدارة الغرف",
    icon: <BedDouble className="size-5" />,
    items: [
      { to: "/rooms", label: "الغرف", icon: <BedDouble className="size-5" /> },
      {
        to: "/room-types",
        label: "أنواع الغرف",
        icon: <Tags className="size-5" />,
      },
      {
        to: "/floors",
        label: "الطوابق",
        icon: <Building2 className="size-5" />,
      },
    ],
  },
  {
    title: "المالية",
    icon: <DollarSign className="size-5" />,
    items: [
      {
        to: "/costs",
        label: "المصاريف",
        icon: <DollarSign className="size-5" />,
      },
      {
        to: "/accountant",
        label: "الحسابات",
        icon: <Calculator className="size-5" />,
      },
      {
        to: "/monthly-report",
        label: "التقرير الشهري",
        icon: <List className="size-5" />,
      },
    ],
  },
  {
    title: "المخزون",
    icon: <Package className="size-5" />,
    items: [
      {
        to: "/inventory",
        label: "المخزون",
        icon: <Package className="size-5" />,
      },
      {
        to: "/inventory-orders",
        label: "طلبات المخزون",
        icon: <ShoppingCart className="size-5" />,
      },
      {
        to: "/inventory-receipts",
        label: "واردات المخزون",
        icon: <ArrowDownCircle className="size-5" />,
      },
    ],
  },
  {
    title: "العمليات",
    icon: <Sparkles className="size-5" />,
    items: [
      {
        to: "/cleaning-notifications",
        label: "تنبيهات النظافة",
        icon: <Sparkles className="size-5" />,
      },
    ],
  },
  {
    title: "الإدارة",
    icon: <Shield className="size-5" />,
    items: [
      {
        to: "/users",
        label: "المستخدمين",
        icon: <Shield className="size-5" />,
      },
      {
        to: "/settings",
        label: "الإعدادات",
        icon: <Settings className="size-5" />,
      },
    ],
  },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("/logo.png");
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Responsive: handle mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
        setMobileOpen(false);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch hotel logo
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data } = await apiClient.get("/settings/hotel");
        if (data?.logo_url) {
          setLogoUrl(data.logo_url);
        } else if (data?.logo_path) {
          const baseUrl =
            (import.meta as any).env?.VITE_API_BASE?.replace("/api", "") ||
            "http://127.0.0.1:8000";
          setLogoUrl(`${baseUrl}/storage/${data.logo_path}`);
        }
      } catch (e) {
        console.error("Failed to fetch logo", e);
      }
    };
    fetchLogo();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Get current page label
  const getCurrentPageLabel = () => {
    for (const group of navigationGroups) {
      const item = group.items.find((item) => item.to === location.pathname);
      if (item) return item.label;
    }
    return "لوحة التحكم";
  };

  return (
    <>
      <div
        className="min-h-screen bg-background"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* Top bar */}
        <header className="w-full top-0 inset-x-0 z-40 border-b border-border/40 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 shadow-sm">
          <div className="flex items-center gap-3 px-4 h-16">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 hover:bg-accent transition-all duration-200"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              {mobileOpen || (!collapsed && !isMobile) ? (
                <X className="size-5" />
              ) : (
                <MenuIcon className="size-5" />
              )}
            </Button>
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
              title="الانتقال إلى لوحة التحكم"
            >
              {!logoError ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-8 w-8 rounded-lg object-contain shadow-md"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
                  🏨
                </div>
              )}
              <div>
                <div className="font-bold text-base leading-none">
                  نظام إدارة الفنادق
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {getCurrentPageLabel()}
                </div>
              </div>
            </div>
            <div className="ms-auto flex items-center gap-2">
              <NotificationBell />
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                onClick={handleLogout}
              >
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

        {/* Sidebar */}
        <div className="flex">
          <Sidebar
            collapsed={isMobile ? !mobileOpen : collapsed}
            toggled={isMobile ? mobileOpen : !collapsed}
            onToggle={toggleSidebar}
            breakPoint="md"
            width={`${drawerWidth}px`}
            rtl={true}
            rootStyles={{
              position: "fixed",
              top: "4rem",
              right: 0,
              height: "calc(100vh - 4rem)",
              zIndex: 30,
            }}
            className={isMobile && !mobileOpen ? "hidden" : ""}
          >
            <div
              style={{
                padding: "1rem",
                borderBottom: "1px solid hsl(var(--border))",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!logoError ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-10 w-10 rounded-lg object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-sm">
                    🏨
                  </div>
                )}
              </div>
            </div>
            <Menu
              menuItemStyles={{
                button: ({ active }) => ({
                  backgroundColor: active
                    ? "hsl(var(--primary))"
                    : "transparent",
                  color: active
                    ? "hsl(var(--primary-foreground))"
                    : "hsl(var(--foreground))",
                  "&:hover": {
                    backgroundColor: active
                      ? "hsl(var(--primary) / 0.9)"
                      : "hsl(var(--accent))",
                    color: active
                      ? "hsl(var(--primary-foreground))"
                      : "hsl(var(--accent-foreground))",
                  },
                }),
              }}
            >
              {navigationGroups.map((group) => {
                // If group has only one item, render as MenuItem
                if (group.items.length === 1) {
                  const item = group.items[0];
                  if (!item) return null;
                  return (
                    <MenuItem
                      key={item.to}
                      icon={item.icon}
                      component={<NavLink to={item.to} />}
                      onClick={() => {
                        if (isMobile) setMobileOpen(false);
                      }}
                    >
                      {item.label}
                    </MenuItem>
                  );
                }
                // Otherwise render as SubMenu
                return (
                  <SubMenu
                    key={group.title}
                    label={group.title}
                    icon={group.icon}
                    defaultOpen={group.items.some(
                      (item) => item && item.to === location.pathname,
                    )}
                  >
                    {group.items.map((item) => {
                      if (!item) return null;
                      return (
                        <MenuItem
                          key={item.to}
                          icon={item.icon}
                          component={<NavLink to={item.to} />}
                          onClick={() => {
                            if (isMobile) setMobileOpen(false);
                          }}
                        >
                          {item.label}
                        </MenuItem>
                      );
                    })}
                  </SubMenu>
                );
              })}
            </Menu>
            <div
              style={{
                padding: "1rem",
                borderTop: "1px solid hsl(var(--border))",
                marginTop: "auto",
              }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                <span>تسجيل الخروج</span>
              </Button>
            </div>
          </Sidebar>

          {/* Main content */}
          <main
            className="flex-1 transition-all duration-300 flex justify-center"
            style={{
              marginRight:
                window.innerWidth >= 768
                  ? collapsed
                    ? "80px"
                    : `${drawerWidth}px`
                  : 0,
            }}
          >
            <div className="container max-w-7xl p-1 mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
