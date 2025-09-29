import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import apiClient from '../api/axios'

const colorOptions = [
  { value: '#f44336', label: 'Red' },
  { value: '#e91e63', label: 'Pink' },
  { value: '#9c27b0', label: 'Purple' },
  { value: '#673ab7', label: 'Deep Purple' },
  { value: '#3f51b5', label: 'Indigo' },
  { value: '#2196f3', label: 'Blue' },
  { value: '#03a9f4', label: 'Light Blue' },
  { value: '#00bcd4', label: 'Cyan' },
  { value: '#009688', label: 'Teal' },
  { value: '#4caf50', label: 'Green' },
  { value: '#8bc34a', label: 'Light Green' },
  { value: '#cddc39', label: 'Lime' },
  { value: '#ffeb3b', label: 'Yellow' },
  { value: '#ffc107', label: 'Amber' },
  { value: '#ff9800', label: 'Orange' },
  { value: '#ff5722', label: 'Deep Orange' },
  { value: '#795548', label: 'Brown' },
  { value: '#607d8b', label: 'Blue Grey' },
  { value: '#9e9e9e', label: 'Grey' }
]

export default function RoomStatuses() {
  const [roomStatuses, setRoomStatuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRoomStatus, setEditingRoomStatus] = useState(null)
  const [form, setForm] = useState({
    code: '',
    name: '',
    color: '#2196f3'
  })

  useEffect(() => {
    fetchRoomStatuses()
  }, [])

  const fetchRoomStatuses = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/room-statuses')
      setRoomStatuses(data)
    } catch (err) {
      setError('Failed to fetch room statuses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      
      if (editingRoomStatus) {
        await apiClient.put(`/room-statuses/${editingRoomStatus.id}`, form)
        setSuccess('Room status updated successfully')
      } else {
        await apiClient.post('/room-statuses', form)
        setSuccess('Room status created successfully')
      }
      
      setOpenDialog(false)
      setForm({ code: '', name: '', color: '#2196f3' })
      setEditingRoomStatus(null)
      fetchRoomStatuses()
    } catch (err) {
      setError(err?.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (roomStatus) => {
    setEditingRoomStatus(roomStatus)
    setForm({
      code: roomStatus.code,
      name: roomStatus.name,
      color: roomStatus.color || '#2196f3'
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room status?')) return
    
    try {
      setLoading(true)
      await apiClient.delete(`/room-statuses/${id}`)
      setSuccess('Room status deleted successfully')
      fetchRoomStatuses()
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setForm({ code: '', name: '', color: '#2196f3' })
    setEditingRoomStatus(null)
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Room Statuses Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Add Room Status
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Rooms Count</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roomStatuses.map((roomStatus) => (
              <TableRow key={roomStatus.id}>
                <TableCell>
                  <Chip 
                    label={roomStatus.code} 
                    sx={{ 
                      backgroundColor: roomStatus.color || '#2196f3',
                      color: 'white',
                      fontWeight: 'bold'
                    }} 
                  />
                </TableCell>
                <TableCell>{roomStatus.name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: roomStatus.color || '#2196f3',
                        borderRadius: 1,
                        border: '1px solid #ccc'
                      }}
                    />
                    <Typography variant="body2">
                      {colorOptions.find(c => c.value === roomStatus.color)?.label || 'Custom'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{roomStatus.rooms_count || 0}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleEdit(roomStatus)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(roomStatus.id)} color="error">
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRoomStatus ? 'Edit Room Status' : 'Add New Room Status'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Code"
                  fullWidth
                  variant="outlined"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                  helperText="Unique code for the status (e.g., AVAIL, OCCUPIED, MAINT)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="dense"
                  label="Name"
                  fullWidth
                  variant="outlined"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Color</InputLabel>
                  <Select
                    value={form.color}
                    label="Color"
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                  >
                    {colorOptions.map((color) => (
                      <MenuItem key={color.value} value={color.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              backgroundColor: color.value,
                              borderRadius: 1,
                              border: '1px solid #ccc'
                            }}
                          />
                          {color.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : (editingRoomStatus ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  )
}



