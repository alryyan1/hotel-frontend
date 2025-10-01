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
    description: '',
    area: '',
    beds_count: '',
    amenities: []
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
        base_price: parseFloat(form.base_price),
        area: form.area === '' ? null : parseInt(form.area),
        beds_count: form.beds_count === '' ? null : parseInt(form.beds_count),
        amenities: form.amenities
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
      description: roomType.description || '',
      area: roomType.area ?? '',
      beds_count: roomType.beds_count ?? '',
      amenities: Array.isArray(roomType.amenities) ? roomType.amenities : []
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
    setForm({ code: '', name: '', capacity: 1, base_price: 0, description: '', area: '', beds_count: '', amenities: [] })
    setForm({ code: '', name: '', capacity: 1, base_price: 0, description: '', area: '', beds_count: '', amenities: [] })
    setEditingRoomType(null)
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>إدارة أنواع الغرف</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          إضافة نوع غرفة
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الرمز</TableCell>
              <TableCell>الاسم</TableCell>
              <TableCell>السعة</TableCell>
              <TableCell>السعر الأساسي</TableCell>
              <TableCell>المساحة (م²)</TableCell>
              <TableCell>عدد الأسرة</TableCell>
              <TableCell>المرافق</TableCell>
              <TableCell>الوصف</TableCell>
              <TableCell>عدد الغرف</TableCell>
              <TableCell>إجراءات</TableCell>
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
                <TableCell>{roomType.area ?? '-'}</TableCell>
                <TableCell>{roomType.beds_count ?? '-'}</TableCell>
                <TableCell>{Array.isArray(roomType.amenities) && roomType.amenities.length ? roomType.amenities.join(', ') : '-'}</TableCell>
                <TableCell>{roomType.description || '-'}</TableCell>
                <TableCell>{roomType.rooms_count || 0}</TableCell>
                <TableCell>
                  <Tooltip title="تعديل">
                    <IconButton onClick={() => handleEdit(roomType)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="حذف">
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
        <DialogTitle>{editingRoomType ? 'تعديل نوع غرفة' : 'إضافة نوع غرفة جديد'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="الرمز"
                  fullWidth
                  variant="outlined"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                  helperText="رمز فريد لنوع الغرفة (مثل: STD, DEL, SUITE)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="dense"
                  label="الاسم"
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
                  label="السعة"
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
                  label="السعر الأساسي"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>﷼</Typography> }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="dense"
                  label="المساحة (م²)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="dense"
                  label="عدد الأسرة"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={form.beds_count}
                  onChange={(e) => setForm({ ...form, beds_count: e.target.value })}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="المرافق (افصل بينها بفاصلة)"
                  fullWidth
                  variant="outlined"
                  value={Array.isArray(form.amenities) ? form.amenities.join(', ') : ''}
                  onChange={(e) => setForm({ ...form, amenities: e.target.value.split(',').map(a => a.trim()).filter(Boolean) })}
                  helperText="مثال: تكييف، ثلاجة، واي فاي، شرفة"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="الوصف"
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
            <Button onClick={handleCloseDialog}>إلغاء</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'جارٍ الحفظ...' : (editingRoomType ? 'تحديث' : 'إنشاء')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  )
}



