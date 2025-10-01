import { useEffect, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  alpha
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { arSA } from 'date-fns/locale'
import apiClient from '../api/axios'

export default function Reservations() {
  const [checkIn, setCheckIn] = useState(null)
  const [checkOut, setCheckOut] = useState(null)
  const [guestCount, setGuestCount] = useState(1)
  const [roomTypeId, setRoomTypeId] = useState('')
  const [availableRooms, setAvailableRooms] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState([])
  const [customers, setCustomers] = useState([])
  const [openCustomer, setOpenCustomer] = useState(false)
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', national_id: '', address: '', date_of_birth: '', gender: '' })
  const [form, setForm] = useState({
    customer_id: '',
    code: '',
    notes: ''
  })

  useEffect(() => {
    fetchRoomTypes()
    fetchCustomers()
  }, [])

  const fetchRoomTypes = async () => {
    try {
      const { data } = await apiClient.get('/room-types')
      setRoomTypes(data)
    } catch (e) {
      console.error('Failed to fetch room types', e)
    }
  }

  const fetchCustomers = async () => {
    try {
      const { data } = await apiClient.get('/customers')
      setCustomers(data?.data || data)
    } catch (e) {
      console.error('Failed to fetch customers', e)
    }
  }

  const searchAvailability = async () => {
    try {
      setError('')
      setSuccess('')
      if (!checkIn || !checkOut) {
        setError('الرجاء اختيار تاريخي الوصول والمغادرة')
        return
      }
      setLoading(true)
      const params = {
        check_in_date: checkIn.toISOString().slice(0, 10),
        check_out_date: checkOut.toISOString().slice(0, 10),
      }
      if (roomTypeId) params.room_type_id = roomTypeId
      if (guestCount) params.guest_count = guestCount
      const { data } = await apiClient.get('/availability', { params })
      setAvailableRooms(data?.data || data)
    } catch (e) {
      console.error('Availability search failed', e)
      setError('فشل في جلب التوفر')
    } finally {
      setLoading(false)
    }
  }

  const toggleRoom = (room) => {
    setSelectedRooms((prev) => {
      const exists = prev.find((r) => r.id === room.id)
      if (exists) return prev.filter((r) => r.id !== room.id)
      return [...prev, room]
    })
  }

  const openCreateDialog = () => {
    if (!checkIn || !checkOut) {
      setError('اختر التواريخ أولاً')
      return
    }
    setOpenCreate(true)
  }

  const createReservation = async () => {
    try {
      setLoading(true)
      setError('')
      if (!form.customer_id || !form.code || selectedRooms.length === 0) {
        setError('عميل، كود الحجز، وغرفة واحدة على الأقل مطلوبة')
        return
      }
      const payload = {
        code: form.code,
        customer_id: form.customer_id,
        check_in_date: checkIn.toISOString().slice(0,10),
        check_out_date: checkOut.toISOString().slice(0,10),
        guest_count: guestCount,
        notes: form.notes || '',
        rooms: selectedRooms.map((r) => ({ id: r.id }))
      }
      await apiClient.post('/reservations', payload)
      setSuccess('تم إنشاء الحجز بنجاح')
      setOpenCreate(false)
      setSelectedRooms([])
      setForm({ customer_id: '', code: '', notes: '' })
    } catch (err) {
      setError(err?.response?.data?.message || 'فشل إنشاء الحجز')
    } finally {
      setLoading(false)
    }
  }

  const createCustomer = async () => {
    try {
      setLoading(true)
      const payload = { ...customerForm }
      const { data } = await apiClient.post('/customers', payload)
      setCustomers((prev)=>[data, ...prev])
      setForm((f)=>({ ...f, customer_id: data.id }))
      setOpenCustomer(false)
      setCustomerForm({ name: '', phone: '', national_id: '', address: '', date_of_birth: '', gender: '' })
      setSuccess('تم إنشاء العميل')
    } catch (err) {
      setError(err?.response?.data?.message || 'فشل إنشاء العميل')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={arSA}>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>البحث عن توفر الغرف</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <DatePicker label="تاريخ الوصول" value={checkIn} onChange={setCheckIn} slotProps={{ textField: { fullWidth: true } }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker label="تاريخ المغادرة" value={checkOut} onChange={setCheckOut} slotProps={{ textField: { fullWidth: true } }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField label="عدد الضيوف" type="number" fullWidth value={guestCount} onChange={(e)=>setGuestCount(parseInt(e.target.value)||1)} inputProps={{ min: 1 }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>نوع الغرفة</InputLabel>
                <Select value={roomTypeId} label="نوع الغرفة" onChange={(e)=>setRoomTypeId(e.target.value)}>
                  <MenuItem value="">الكل</MenuItem>
                  {roomTypes.map((t)=>(
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth variant="contained" onClick={searchAvailability} disabled={loading}>بحث</Button>
            </Grid>
          </Grid>
          {error && <Alert sx={{ mt: 2 }} severity="error">{error}</Alert>}
          {success && <Alert sx={{ mt: 2 }} severity="success">{success}</Alert>}
        </Paper>

        {availableRooms?.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>الغرف المتاحة</Typography>
              <Button variant="outlined" onClick={openCreateDialog} disabled={selectedRooms.length === 0}>إنشاء حجز</Button>
            </Box>
            <Grid container spacing={2}>
              {availableRooms.map((room) => (
                <Grid item xs={12} md={4} key={room.id}>
                  <Paper onClick={()=>toggleRoom(room)} sx={{ p: 2, cursor: 'pointer', border: selectedRooms.find(r=>r.id===room.id) ? `2px solid #1976d2` : `1px solid ${alpha('#000',0.12)}` }}>
                    <Typography variant="subtitle2">غرفة {room.number}</Typography>
                    <Typography variant="caption" color="text.secondary">الدور {room.floor?.number} • {room.type?.name}</Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" label={`${room.type?.capacity} ضيوف`} />
                      {room.type?.area && <Chip size="small" label={`${room.type.area} م²`} />}
                      {Array.isArray(room.type?.amenities) && room.type.amenities.slice(0,3).map((a,i)=>(<Chip key={i} size="small" label={a} />))}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        <Dialog open={openCreate} onClose={()=>setOpenCreate(false)} maxWidth="sm" fullWidth>
          <DialogTitle>إنشاء حجز</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>العميل</InputLabel>
                  <Select value={form.customer_id} label="العميل" onChange={(e)=>setForm({ ...form, customer_id: e.target.value })}>
                    {customers.map((c)=>(
                      <MenuItem key={c.id} value={c.id}>{c.name} — {c.phone || c.email}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" onClick={()=>setOpenCustomer(true)}>عميل جديد</Button>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="كود الحجز" value={form.code} onChange={(e)=>setForm({ ...form, code: e.target.value })} placeholder="مثال: RES-2025-0001" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="ملاحظات" value={form.notes} onChange={(e)=>setForm({ ...form, notes: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">الغرف المختارة</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {selectedRooms.map((r)=>(<Chip key={r.id} label={`غرفة ${r.number}`} onDelete={()=>toggleRoom(r)} />))}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setOpenCreate(false)}>إلغاء</Button>
            <Button variant="contained" onClick={createReservation} disabled={loading}>حفظ</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openCustomer} onClose={()=>setOpenCustomer(false)} maxWidth="sm" fullWidth>
          <DialogTitle>عميل جديد</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField fullWidth label="الاسم" value={customerForm.name} onChange={(e)=>setCustomerForm({ ...customerForm, name: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="الهاتف" value={customerForm.phone} onChange={(e)=>setCustomerForm({ ...customerForm, phone: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="الرقم الوطني" value={customerForm.national_id} onChange={(e)=>setCustomerForm({ ...customerForm, national_id: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="العنوان" value={customerForm.address} onChange={(e)=>setCustomerForm({ ...customerForm, address: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="date" label="تاريخ الميلاد" InputLabelProps={{ shrink: true }} value={customerForm.date_of_birth} onChange={(e)=>setCustomerForm({ ...customerForm, date_of_birth: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>النوع</InputLabel>
                  <Select label="النوع" value={customerForm.gender} onChange={(e)=>setCustomerForm({ ...customerForm, gender: e.target.value })}>
                    <MenuItem value="">غير محدد</MenuItem>
                    <MenuItem value="male">ذكر</MenuItem>
                    <MenuItem value="female">أنثى</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setOpenCustomer(false)}>إلغاء</Button>
            <Button variant="contained" onClick={createCustomer} disabled={loading}>حفظ</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}



