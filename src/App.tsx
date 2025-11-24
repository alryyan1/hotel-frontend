import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

import './App.css'
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Floors from './pages/Floors';
import RoomTypes from './pages/RoomTypes';
import RoomStatuses from './pages/RoomStatuses';
import Reservations from './pages/Reservations';
import ReservationsList from './pages/ReservationsList';
import Customers from './pages/Customers';
import CustomerLedger from './pages/CustomerLedger';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Costs from './pages/Costs';
import MainLayout from './layouts/MainLayout';
import { Toaster } from './components/ui/sonner';

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
})

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'))
    }

    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events for same-tab changes
    window.addEventListener('auth-change', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleStorageChange)
    }
  }, [])

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={token ? <MainLayout /> : <Navigate to="/login" replace />}>
              <Route index element={<Dashboard />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="floors" element={<Floors />} />
              <Route path="room-types" element={<RoomTypes />} />
              <Route path="room-statuses" element={<RoomStatuses />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="reservations-list" element={<ReservationsList />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id/ledger" element={<CustomerLedger />} />
              <Route path="costs" element={<Costs />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </CacheProvider>
  )
}

export default App
