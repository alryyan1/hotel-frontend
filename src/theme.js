import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e40af', // blue-800
      light: '#3b82f6',
      dark: '#1e3a8a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f59e0b', // amber-500
      light: '#fbbf24',
      dark: '#b45309',
      contrastText: '#111827',
    },
    success: { main: '#22c55e' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#0ea5e9' },
    background: {
      default: '#f8fafc', // slate-50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 4 },
    },
  },
})

export default theme


