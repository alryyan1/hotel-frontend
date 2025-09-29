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
  Grid
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import apiClient from '../api/axios'

export default function RoomTypes() {
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRoomType, setEditingRoomType] = useState(null)
  const [form, setForm] = useState({
    code: '',
    name: '',
    capacity: 1,
    base_price: 0,
    description: ''
  })

  useEffect(() => {
    fetchRoomTypes()
  }, [])

  const fetchRoomTypes = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/room-types')
      setRoomTypes(data)
    } catch (err) {
      setError('Failed to fetch room types')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      
      const submitData = {
        ...form,
        capacity: parseInt(form.capacity),
        base_price: parseFloat(form.base_price)
      }
      
      if (editingRoomType) {
        await apiClient.put(`/room-types/${editingRoomType.id}`, submitData)
        setSuccess('Room type updated successfully')
      } else {
        await apiClient.post('/room-types', submitData)
        setSuccess('Room type created successfully')
      }
      
      setOpenDialog(false)
      setForm({ code: '', name: '', capacity: 1, base_price: 0, description: '' })
      setEditingRoomType(null)
      fetchRoomTypes()
    } catch (err) {
      setError(err?.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (roomType) => {
    setEditingRoomType(roomType)
    setForm({
      code: roomType.code,
      name: roomType.name,
      capacity: roomType.capacity,
      base_price: roomType.base_price,
      description: roomType.description || ''
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room type?')) return
    
    try {
      setLoading(true)
      await apiClient.delete(`/room-types/${id}`)
      setSuccess('Room type deleted successfully')
      fetchRoomTypes()
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setForm({ code: '', name: '', capacity: 1, base_price: 0, description: '' })
    setEditingRoomType(null)
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Room Types Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Add Room Type
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
              <TableCell>Capacity</TableCell>
              <TableCell>Base Price</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Rooms Count</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roomTypes.map((roomType) => (
              <TableRow key={roomType.id}>
                <TableCell>
                  <Chip label={roomType.code} color="secondary" variant="outlined" />
                </TableCell>
                <TableCell>{roomType.name}</TableCell>
                <TableCell>
                  <Chip label={`${roomType.capacity} guests`} color="info" variant="outlined" />
                </TableCell>
                <TableCell>${roomType.base_price}</TableCell>
                <TableCell>{roomType.description || '-'}</TableCell>
                <TableCell>{roomType.rooms_count || 0}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleEdit(roomType)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(roomType.id)} color="error">
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingRoomType ? 'Edit Room Type' : 'Add New Room Type'}</DialogTitle>
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
                  helperText="Unique code for the room type (e.g., STD, DEL, SUITE)"
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
              <Grid item xs={12} md={6}>
                <TextField
                  margin="dense"
                  label="Capacity"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  required
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="dense"
                  label="Base Price"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : (editingRoomType ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  )
}



