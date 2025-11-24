import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Tajawal, system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: 'Tajawal, system-ui, Avenir, Helvetica, Arial, sans-serif',
        },
      },
    },
  },
})

export default theme

