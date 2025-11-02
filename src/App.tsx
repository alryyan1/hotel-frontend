import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
import MainLayout from './layouts/MainLayout';
import { Toaster } from './components/ui/sonner';

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
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
