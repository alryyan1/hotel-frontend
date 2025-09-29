import { useState } from 'react'
import { Container, Paper, Box, Typography, TextField, Button, Alert, CircularProgress, InputAdornment, Link } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import apiClient from '../api/axios'


export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.post(
        '/login',
        { email, password, device_name: 'web' },
        
      )
      localStorage.setItem('token', data.token)
      window.location.href = '/'
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ p: 5, width: '100%' }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" color="primary" fontWeight={700}>Hotel Admin</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to manage rooms and reservations</Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            fullWidth
            InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment>) }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
            fullWidth
            InputProps={{ startAdornment: (<InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment>) }}
          />
          <Button size="large" startIcon={loading ? null : <LoginIcon />} variant="contained" type="submit" disabled={loading}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link component="button" type="button" variant="body2" onClick={()=>alert('Contact admin to reset password')}>
              Forgot password?
            </Link>
            <Typography variant="caption" color="text.secondary">v1.0.0</Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}


