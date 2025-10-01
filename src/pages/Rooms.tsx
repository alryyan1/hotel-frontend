import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
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
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Stack,
  Divider,
  Badge,
  Fab,
  Slide,
  useTheme,
  alpha,
  InputAdornment,
  Skeleton
} from '@mui/material'
import { 
  Add, 
  Edit, 
  Delete, 
  Visibility, 
  Hotel, 
  Bed, 
  Business, 
  Search,
  FilterList,
  ViewModule,
  ViewList,
  Info
} from '@mui/icons-material'
import apiClient from '../api/axios'

export default function Rooms() {
  const theme = useTheme()
  const [rooms, setRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [displayedRooms, setDisplayedRooms] = useState([])
  const [floors, setFloors] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [roomStatuses, setRoomStatuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFloor, setFilterFloor] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(9)
  const [savingStatus, setSavingStatus] = useState(false)
  const [form, setForm] = useState({
    number: '',
    floor_id: '',
    room_type_id: '',
    room_status_id: '',
    beds: 1,
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterRooms()
  }, [rooms, searchTerm, filterFloor, filterType, filterStatus])

  useEffect(() => {
    const start = page * rowsPerPage
    const end = start + rowsPerPage
    setDisplayedRooms(filteredRooms.slice(start, end))
  }, [filteredRooms, page, rowsPerPage])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [roomsRes, floorsRes, roomTypesRes, roomStatusesRes] = await Promise.all([
        apiClient.get('/rooms'),
        apiClient.get('/floors'),
        apiClient.get('/room-types'),
        apiClient.get('/room-statuses')
      ])
      
      setRooms(roomsRes.data)
      setFloors(floorsRes.data)
      setRoomTypes(roomTypesRes.data)
      setRoomStatuses(roomStatusesRes.data)
    } catch (err) {
      setError('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const filterRooms = () => {
    let filtered = rooms.filter(room => {
      const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           room.type?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           room.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFloor = !filterFloor || room.floor_id.toString() === filterFloor
      const matchesType = !filterType || room.room_type_id.toString() === filterType
      const matchesStatus = !filterStatus || room.room_status_id.toString() === filterStatus
      
      return matchesSearch && matchesFloor && matchesType && matchesStatus
    })
    setFilteredRooms(filtered)
    setPage(0)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterFloor('')
    setFilterType('')
    setFilterStatus('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      if (!form.number?.trim()) {
        setError('رقم الغرفة مطلوب')
        return
      }
      if (!form.floor_id || !form.room_type_id || !form.room_status_id) {
        setError('الرجاء اختيار الدور، نوع الغرفة، وحالة الغرفة')
        return
      }
      if (parseInt(form.beds) < 1 || parseInt(form.beds) > 10) {
        setError('عدد الأسرة يجب أن يكون بين 1 و 10')
        return
      }
      
      const submitData = {
        ...form,
        beds: parseInt(form.beds)
      }
      
      if (editingRoom) {
        await apiClient.put(`/rooms/${editingRoom.id}`, submitData)
        setSuccess('تم تحديث الغرفة بنجاح')
      } else {
        await apiClient.post('/rooms', submitData)
        setSuccess('تم إنشاء الغرفة بنجاح')
      }
      
      setOpenDialog(false)
      setForm({ number: '', floor_id: '', room_type_id: '', room_status_id: '', beds: 1, notes: '' })
      setEditingRoom(null)
      fetchData()
    } catch (err) {
      setError(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (room) => {
    setEditingRoom(room)
    setForm({
      number: room.number,
      floor_id: room.floor_id,
      room_type_id: room.room_type_id,
      room_status_id: room.room_status_id,
      beds: room.beds,
      notes: room.notes || ''
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الغرفة؟')) return
    
    try {
      setLoading(true)
      await apiClient.delete(`/rooms/${id}`)
      setSuccess('تم حذف الغرفة بنجاح')
      fetchData()
    } catch (err) {
      setError(err?.response?.data?.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setForm({ number: '', floor_id: '', room_type_id: '', room_status_id: '', beds: 1, notes: '' })
    setEditingRoom(null)
  }

  const getStatusColor = (status) => {
    return status?.color || '#2196f3'
  }

  const getStatusName = (status) => {
    return status?.name || 'غير محدد'
  }

  const RoomCard = ({ room }) => (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        border: `2px solid ${alpha(getStatusColor(room.status), 0.2)}`,
        position: 'relative',
        overflow: 'visible'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -8,
          right: 16,
          width: 16,
          height: 16,
          backgroundColor: getStatusColor(room.status),
          borderRadius: '50%',
          border: `2px solid ${theme.palette.background.paper}`,
          zIndex: 1
        }}
      />
      
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            {room.number}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              غرفة {room.number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              الدور {room.floor?.number} - {room.floor?.name || 'بدون اسم'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business fontSize="small" color="action" />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {room.type?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {room.type?.code} • {room.type?.capacity} ضيوف • ${room.type?.base_price}
              </Typography>
              {(room.type?.area || room.type?.beds_count || (room.type?.amenities?.length)) && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {room.type?.area ? `${room.type.area} م²` : ''}
                  {room.type?.area && room.type?.beds_count ? ' • ' : ''}
                  {room.type?.beds_count ? `${room.type.beds_count} سرير` : ''}
                  {(room.type?.area || room.type?.beds_count) && room.type?.amenities?.length ? ' • ' : ''}
                  {room.type?.amenities?.length ? room.type.amenities.join(', ') : ''}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bed fontSize="small" color="action" />
            <Typography variant="body2">
              {room.beds} سرير
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info fontSize="small" color="action" />
            <Chip 
              label={getStatusName(room.status)} 
              size="small"
              sx={{ 
                backgroundColor: getStatusColor(room.status),
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }} 
            />
          </Box>

          {room.notes && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                "{room.notes}"
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
        <Button 
          size="small" 
          startIcon={<Visibility />}
          color="info"
          sx={{ minWidth: 'auto' }}
          onClick={() => handleView(room)}
        >
          عرض
        </Button>
        <Box>
          <Tooltip title="تعديل">
            <IconButton 
              size="small" 
              onClick={() => handleEdit(room)}
              sx={{ 
                color: theme.palette.warning.main,
                '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.1) }
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="حذف">
            <IconButton 
              size="small" 
              onClick={() => handleDelete(room.id)}
              sx={{ 
                color: theme.palette.error.main,
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  )

  const handleView = (room) => {
    setSelectedRoom(room)
    setOpenDetailsDialog(true)
  }

  const handleChangeStatus = async () => {
    if (!selectedRoom) return
    try {
      setSavingStatus(true)
      const payload = {
        number: selectedRoom.number,
        floor_id: selectedRoom.floor_id,
        room_type_id: selectedRoom.room_type_id,
        room_status_id: selectedRoom.room_status_id,
        beds: selectedRoom.beds,
        notes: selectedRoom.notes || ''
      }
      await apiClient.put(`/rooms/${selectedRoom.id}`, payload)
      setSuccess('تم تحديث حالة الغرفة')
      setOpenDetailsDialog(false)
      setSelectedRoom(null)
      fetchData()
    } catch (err) {
      setError(err?.response?.data?.message || 'فشل تحديث الحالة')
    } finally {
      setSavingStatus(false)
    }
  }

  const LoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="80%" height={20} />
                </Box>
              </Box>
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="50%" height={20} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1, 
          mb: 3, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
              إدارة الغرف
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              إدارة وتنظيم غرف الفندق بسهولة
            </Typography>
          </Box>
          <Hotel sx={{ fontSize: 60, opacity: 0.7 }} />
        </Box>
      </Paper>

      {/* Alerts */}
      {error && (
        <Slide direction="down" in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        </Slide>
      )}
      {success && (
        <Slide direction="down" in={!!success}>
          <Alert 
            severity="success" 
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        </Slide>
      )}

      {/* Filters and Controls */}
      <Paper sx={{ p: 1, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="البحث عن غرفة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>الدور</InputLabel>
              <Select
                value={filterFloor}
                label="الدور"
                onChange={(e) => setFilterFloor(e.target.value)}
                sx={{ borderRadius: 2, minWidth: '200px' }}
              >
                <MenuItem value="">جميع الأدوار</MenuItem>
                {floors.map((floor) => (
                  <MenuItem key={floor.id} value={floor.id.toString()}>
                    الدور {floor.number}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>النوع</InputLabel>
              <Select
                value={filterType}
                label="النوع"
                onChange={(e) => setFilterType(e.target.value)}
                sx={{ borderRadius: 2, minWidth: '200px' }}
              >
                <MenuItem value="">جميع الأنواع</MenuItem>
                {roomTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>الحالة</InputLabel>
              <Select
                value={filterStatus}
                label="الحالة"
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ borderRadius: 2, minWidth: '200px' }}
              >
                <MenuItem value="">جميع الحالات</MenuItem>
                {roomStatuses.map((status) => (
                  <MenuItem key={status.id} value={status.id.toString()}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={viewMode === 'grid' ? 'عرض قائمة' : 'عرض شبكة'}>
                <IconButton 
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                  }}
                >
                  {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="مسح الفلاتر">
                <IconButton 
                  onClick={clearFilters}
                  sx={{ 
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.2) }
                  }}
                >
                  <FilterList />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            إجمالي الغرف: {rooms.length} | المعروضة: {filteredRooms.length}
          </Typography>
        </Box>
      </Paper>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {displayedRooms.map((room) => (
                <Grid item xs={12} sm={6} md={4} key={room.id}>
                  <RoomCard room={room} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 0, borderRadius: 3, overflow: 'hidden', mb: 2 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <th style={{ textAlign: 'right', padding: 12 }}>الغرفة</th>
                      <th style={{ textAlign: 'right', padding: 12 }}>الدور</th>
                      <th style={{ textAlign: 'right', padding: 12 }}>النوع</th>
                      <th style={{ textAlign: 'right', padding: 12 }}>الأسرة</th>
                      <th style={{ textAlign: 'right', padding: 12 }}>الحالة</th>
                      <th style={{ textAlign: 'right', padding: 12 }}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRooms.map((room) => (
                      <tr key={room.id} style={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}>
                        <td style={{ padding: 12, fontWeight: 600 }}>غرفة {room.number}</td>
                        <td style={{ padding: 12 }}>الدور {room.floor?.number}</td>
                        <td style={{ padding: 12 }}>{room.type?.name}</td>
                        <td style={{ padding: 12 }}>{room.beds}</td>
                        <td style={{ padding: 12 }}>
                          <Chip 
                            label={getStatusName(room.status)} 
                            size="small"
                            sx={{ backgroundColor: getStatusColor(room.status), color: 'white', fontWeight: 'bold' }}
                          />
                        </td>
                        <td style={{ padding: 12 }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" onClick={() => handleView(room)}>عرض</Button>
                            <Button size="small" onClick={() => handleEdit(room)}>تعديل</Button>
                            <Button size="small" color="error" onClick={() => handleDelete(room.id)}>حذف</Button>
                          </Box>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Paper>
          )}

          {filteredRooms.length === 0 && !loading && (
            <Paper 
              sx={{ 
                p: 6, 
                textAlign: 'center',
                bgcolor: alpha(theme.palette.grey[50], 0.5),
                borderRadius: 3
              }}
            >
              <Hotel sx={{ fontSize: 80, color: theme.palette.grey[300], mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                لا توجد غرف متاحة
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || filterFloor || filterType || filterStatus 
                  ? 'لم يتم العثور على غرف تطابق معايير البحث'
                  : 'ابدأ بإضافة غرف جديدة للفندق'
                }
              </Typography>
              {!(searchTerm || filterFloor || filterType || filterStatus) && (
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => setOpenDialog(true)}
                  sx={{ borderRadius: 2 }}
                >
                  إضافة غرفة جديدة
                </Button>
              )}
            </Paper>
          )}

          {filteredRooms.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">الصفحة: {page + 1}</Typography>
                <FormControl size="small">
                  <InputLabel>العناصر</InputLabel>
                  <Select
                    label="العناصر"
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                    sx={{ minWidth: 100 }}
                  >
                    {[6, 9, 12, 24].map((n) => (
                      <MenuItem key={n} value={n}>{n}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" disabled={page === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))}>السابق</Button>
                  <Button variant="outlined" disabled={(page + 1) * rowsPerPage >= filteredRooms.length} onClick={() => setPage((p) => p + 1)}>التالي</Button>
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="إضافة غرفة"
        onClick={() => setOpenDialog(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 1000,
          boxShadow: theme.shadows[8],
        }}
      >
        <Add />
      </Fab>

      {/* Enhanced Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          pb: 1,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderRadius: '12px 12px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.primary.main,
                width: 48,
                height: 48
              }}
            >
              {editingRoom ? <Edit /> : <Add />}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {editingRoom ? 'تعديل غرفة' : 'إضافة غرفة جديدة'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {editingRoom ? 'تحديث بيانات الغرفة' : 'إنشاء غرفة جديدة في الفندق'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 1, 
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    borderRadius: 2
                  }}
                >
                  <Typography variant="subtitle2" color="info.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info fontSize="small" />
                    معلومات أساسية
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        autoFocus
                        label="رقم الغرفة"
                        fullWidth
                        variant="outlined"
                        value={form.number}
                        onChange={(e) => setForm({ ...form, number: e.target.value })}
                        required
                        helperText="رقم فريد للغرفة (مثل: 101, 201, 301)"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Hotel color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="عدد الأسرة"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={form.beds}
                        onChange={(e) => setForm({ ...form, beds: e.target.value })}
                        required
                        inputProps={{ min: 1, max: 10 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Bed color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 1, 
                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    borderRadius: 2
                  }}
                >
                  <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business fontSize="small" />
                    تصنيف وموقع
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>الدور</InputLabel>
                        <Select
                          value={form.floor_id}
                          label="الدور"
                          onChange={(e) => setForm({ ...form, floor_id: e.target.value })}
                          required
                          sx={{ borderRadius: 2, minWidth: '200px' }}
                        >
                          {floors.map((floor) => (
                            <MenuItem key={floor.id} value={floor.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={floor.number} 
                                  size="small" 
                                  color="secondary" 
                                  variant="outlined" 
                                />
                                {floor.name || 'بدون اسم'}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>نوع الغرفة</InputLabel>
                        <Select
                          value={form.room_type_id}
                          label="نوع الغرفة"
                          onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}
                          required
                          sx={{ borderRadius: 2, minWidth: '200px' }}
                        >
                          {roomTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {type.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {type.code} • {type.capacity} ضيوف • ${type.base_price}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 1, 
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    borderRadius: 2
                  }}
                >
                  <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterList fontSize="small" />
                    حالة ومعلومات إضافية
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>حالة الغرفة</InputLabel>
                        <Select
                          value={form.room_status_id}
                          label="حالة الغرفة"
                          onChange={(e) => setForm({ ...form, room_status_id: e.target.value })}
                          required
                          sx={{ borderRadius: 2, minWidth: '200px' }}
                        >
                          {roomStatuses.map((status) => (
                            <MenuItem key={status.id} value={status.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 16,
                                    height: 16,
                                    backgroundColor: status.color || '#2196f3',
                                    borderRadius: 1,
                                    border: '1px solid #ccc'
                                  }}
                                />
                                <Box>
                                  <Typography variant="body2">
                                    {status.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {status.code}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="ملاحظات"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="أضف أي ملاحظات خاصة بالغرفة..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
    </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button 
              onClick={handleCloseDialog}
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                minWidth: 100
              }}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{ 
                borderRadius: 2,
                minWidth: 120,
                boxShadow: theme.shadows[4]
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant="circular" width={20} height={20} />
                  جارٍ الحفظ...
                </Box>
              ) : (
                editingRoom ? 'تحديث الغرفة' : 'إنشاء غرفة'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Details Dialog */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={() => { setOpenDetailsDialog(false); setSelectedRoom(null); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>تفاصيل الغرفة</DialogTitle>
        <DialogContent dividers>
          {selectedRoom && (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar>{selectedRoom.number}</Avatar>
                <Box>
                  <Typography variant="h6">غرفة {selectedRoom.number}</Typography>
                  <Typography variant="body2" color="text.secondary">الدور {selectedRoom.floor?.number} • {selectedRoom.type?.name}</Typography>
                </Box>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>حالة الغرفة</InputLabel>
                    <Select
                      label="حالة الغرفة"
                      value={selectedRoom.room_status_id}
                      onChange={(e) => setSelectedRoom({ ...selectedRoom, room_status_id: e.target.value })}
                    >
                      {roomStatuses.map((status) => (
                        <MenuItem key={status.id} value={status.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 14, height: 14, bgcolor: status.color, borderRadius: '50%' }} />
                            {status.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="ملاحظات"
                    fullWidth
                    size="small"
                    value={selectedRoom.notes || ''}
                    onChange={(e) => setSelectedRoom({ ...selectedRoom, notes: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" gutterBottom>معلومات</Typography>
                <Stack direction="row" spacing={2}>
                  <Chip label={`الأسرة: ${selectedRoom.beds}`} />
                  <Chip label={`النوع: ${selectedRoom.type?.code}`} />
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenDetailsDialog(false); setSelectedRoom(null); }}>إغلاق</Button>
          <Button onClick={handleChangeStatus} variant="contained" disabled={savingStatus}>
            {savingStatus ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}


