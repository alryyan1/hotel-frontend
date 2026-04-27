import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";

import "./App.css";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Floors from "./pages/Floors";
import RoomTypes from "./pages/RoomTypes";
import RoomStatuses from "./pages/RoomStatuses";
import Reservations from "./pages/Reservations";
import ReservationsList from "./pages/ReservationsList";
import Customers from "./pages/Customers";
import CustomerLedger from "./pages/CustomerLedger";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Costs from "./pages/Costs";
import Inventory from "./pages/Inventory";
import InventoryOrders from "./pages/InventoryOrders";
import InventoryReceipts from "./pages/InventoryReceipts";
import CleaningNotifications from "./pages/CleaningNotifications";
import PublicReservations from "./pages/PublicReservations";
import Accountant from "./pages/Accountant";
import MonthlyReport from "./pages/MonthlyReport";
import MainLayout from "./layouts/MainLayout";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Create RTL cache
const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

/** Renders the child only if the user has permission for the current path */
function PermissionGuard({ children }: { children: React.ReactNode }) {
  const { hasPermission, isLoadingUser } = useAuth()
  const location = useLocation()

  if (isLoadingUser) return null

  // CustomerLedger is accessible to anyone who can access /customers
  const checkPath = location.pathname.startsWith('/customers/')
    ? '/customers'
    : '/' + location.pathname.replace(/^\//, '')

  const normalizedPath = checkPath === '//' ? '/' : checkPath

  if (!hasPermission(normalizedPath === '' ? '/' : normalizedPath)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const handleStorageChange = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleStorageChange);
    };
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/book" element={<PublicReservations />} />
      <Route
        element={token ? <MainLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<PermissionGuard><Dashboard /></PermissionGuard>} />
        <Route path="rooms" element={<PermissionGuard><Rooms /></PermissionGuard>} />
        <Route path="floors" element={<PermissionGuard><Floors /></PermissionGuard>} />
        <Route path="room-types" element={<PermissionGuard><RoomTypes /></PermissionGuard>} />
        <Route path="room-statuses" element={<PermissionGuard><RoomStatuses /></PermissionGuard>} />
        <Route path="reservations" element={<PermissionGuard><Reservations /></PermissionGuard>} />
        <Route path="reservations-list" element={<PermissionGuard><ReservationsList /></PermissionGuard>} />
        <Route path="customers" element={<PermissionGuard><Customers /></PermissionGuard>} />
        <Route path="customers/:id/ledger" element={<PermissionGuard><CustomerLedger /></PermissionGuard>} />
        <Route path="costs" element={<PermissionGuard><Costs /></PermissionGuard>} />
        <Route path="inventory" element={<PermissionGuard><Inventory /></PermissionGuard>} />
        <Route path="inventory-orders" element={<PermissionGuard><InventoryOrders /></PermissionGuard>} />
        <Route path="inventory-receipts" element={<PermissionGuard><InventoryReceipts /></PermissionGuard>} />
        <Route path="cleaning-notifications" element={<PermissionGuard><CleaningNotifications /></PermissionGuard>} />
        <Route path="accountant" element={<PermissionGuard><Accountant /></PermissionGuard>} />
        <Route path="monthly-report" element={<PermissionGuard><MonthlyReport /></PermissionGuard>} />
        <Route path="users" element={<PermissionGuard><Users /></PermissionGuard>} />
        <Route path="settings" element={<PermissionGuard><Settings /></PermissionGuard>} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={token ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
