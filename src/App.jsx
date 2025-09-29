import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Floors from './pages/Floors'
import RoomTypes from './pages/RoomTypes'
import RoomStatuses from './pages/RoomStatuses'
import Reservations from './pages/Reservations'
import Settings from './pages/Settings'
import './App.css'

function App() {
  const token = localStorage.getItem('token')

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
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
