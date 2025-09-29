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
  Tooltip
} from '@mui/material'
import { Add, Edit, Delete, Visibility } from '@mui/icons-material'
import apiClient from '../api/axios'

export default function Floors() {
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingFloor, setEditingFloor] = useState(null)
  const [form, setForm] = useState({
    number: '',
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchFloors()
  }, [])

  const fetchFloors = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/floors')
      setFloors(data)
    } catch (err) {
      setError('Failed to fetch floors')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      
      if (editingFloor) {
        await apiClient.put(`/floors/${editingFloor.id}`, form)
        setSuccess('Floor updated successfully')
      } else {
        await apiClient.post('/floors', form)
        setSuccess('Floor created successfully')
      }
      
      setOpenDialog(false)
      setForm({ number: '', name: '', description: '' })
      setEditingFloor(null)
      fetchFloors()
    } catch (err) {
      setError(err?.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (floor) => {
    setEditingFloor(floor)
    setForm({
      number: floor.number,
      name: floor.name || '',
      description: floor.description || ''
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this floor?')) return
    
    try {
      setLoading(true)
      await apiClient.delete(`/floors/${id}`)
      setSuccess('Floor deleted successfully')
      fetchFloors()
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setForm({ number: '', name: '', description: '' })
    setEditingFloor(null)
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Floors Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Add Floor
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Floor Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Rooms Count</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {floors.map((floor) => (
              <TableRow key={floor.id}>
                <TableCell>
                  <Chip label={floor.number} color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{floor.name || '-'}</TableCell>
                <TableCell>{floor.description || '-'}</TableCell>
                <TableCell>{floor.rooms_count || 0}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleEdit(floor)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(floor.id)} color="error">
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
        <DialogTitle>{editingFloor ? 'Edit Floor' : 'Add New Floor'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Floor Number"
              type="number"
              fullWidth
              variant="outlined"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Floor Name"
              fullWidth
              variant="outlined"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              sx={{ mb: 2 }}
            />
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
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : (editingFloor ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  )
}



