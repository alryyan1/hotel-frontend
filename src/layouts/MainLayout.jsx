import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Tooltip,
  Avatar,
  Button
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import ApartmentIcon from '@mui/icons-material/Apartment'
import CategoryIcon from '@mui/icons-material/Category'
import FactCheckIcon from '@mui/icons-material/FactCheck'

const drawerWidth = 240

const navItems = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/rooms', label: 'Rooms', icon: <MeetingRoomIcon /> },
  { to: '/floors', label: 'Floors', icon: <ApartmentIcon /> },
  { to: '/room-types', label: 'Room Types', icon: <CategoryIcon /> },
  { to: '/room-statuses', label: 'Room Statuses', icon: <FactCheckIcon /> },
  { to: '/reservations', label: 'Reservations', icon: <BookOnlineIcon /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
]

export default function MainLayout() {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }} color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setOpen(!open)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>Hotel Admin</Typography>
          <Tooltip title="Logout">
            <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" open={open}
        sx={{
          width: open ? drawerWidth : 72,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 72,
            boxSizing: 'border-box',
            transition: (t) => t.transitions.create('width', { duration: t.transitions.duration.shorter }),
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              <ListItemButton key={item.to} component={NavLink} to={item.to} sx={{ '&.active': { bgcolor: 'action.selected' } }}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}


