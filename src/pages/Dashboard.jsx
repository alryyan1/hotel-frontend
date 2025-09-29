import { Typography, Paper, Box } from '@mui/material'

export default function Dashboard() {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
      <Paper sx={{ p: 3 }}>Welcome to the hotel management dashboard.</Paper>
    </Box>
  )
}


