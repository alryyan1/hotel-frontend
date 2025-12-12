import { useState, useEffect } from 'react'
import apiClient from '@/api/axios'
import {
  Button,
  TextField,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  CircularProgress,
  Grid,
  Divider,
  Box,
} from '@mui/material'

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRoom: any | null
  floors: any[]
  roomTypes: any[]
  roomStatuses: any[]
  onSuccess: (roomId?: number) => void
  onError: (message: string) => void
}

export default function CreateRoomDialog({
  open,
  onOpenChange,
  editingRoom,
  floors,
  roomTypes,
  roomStatuses,
  onSuccess,
  onError
}: CreateRoomDialogProps) {
  const [form, setForm] = useState({
    number: '',
    floor_id: '',
    room_type_id: '',
    room_status_id: '',
    beds: 1,
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  // Update form when editingRoom changes
  useEffect(() => {
    if (editingRoom) {
      setForm({
        number: editingRoom.number,
        floor_id: String(editingRoom.floor_id),
        room_type_id: String(editingRoom.room_type_id),
        room_status_id: String(editingRoom.room_status_id),
        beds: editingRoom.beds,
        notes: editingRoom.notes || ''
      })
    } else {
      setForm({
        number: '',
        floor_id: '',
        room_type_id: '',
        room_status_id: '',
        beds: 1,
        notes: ''
      })
    }
  }, [editingRoom, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      onError('')
      
      if (!form.number?.trim()) {
        onError('رقم الغرفة مطلوب')
        return
      }
      if (!form.floor_id || !form.room_type_id || !form.room_status_id) {
        onError('الرجاء اختيار الدور، نوع الغرفة، وحالة الغرفة')
        return
      }
      if (parseInt(form.beds) < 1 || parseInt(form.beds) > 10) {
        onError('عدد الأسرة يجب أن يكون بين 1 و 10')
        return
      }
      
      const submitData = { ...form, beds: parseInt(form.beds) }
      
      let roomId: number | undefined
      if (editingRoom) {
        await apiClient.put(`/rooms/${editingRoom.id}`, submitData)
        roomId = editingRoom.id
      } else {
        const response = await apiClient.post('/rooms', submitData)
        roomId = response.data.id
      }
      
      onOpenChange(false)
      onSuccess(roomId)
    } catch (err: any) {
      onError(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm({
      number: '',
      floor_id: '',
      room_type_id: '',
      room_status_id: '',
      beds: 1,
      notes: ''
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
        {editingRoom ? 'تعديل غرفة' : 'إضافة غرفة جديدة'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {editingRoom ? 'تحديث بيانات الغرفة' : 'إنشاء غرفة جديدة في الفندق'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Basic Information Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                المعلومات الأساسية
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="رقم الغرفة"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="مثل: 101, 201"
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="عدد الأسرة"
                    value={form.beds}
                    onChange={(e) => setForm({ ...form, beds: e.target.value })}
                    inputProps={{ min: 1, max: 10 }}
                    required
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Location & Classification Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                الموقع والتصنيف
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small" required sx={{ minWidth: 120 }}>
                    <InputLabel id="floor-select-label">الدور</InputLabel>
                    <Select
                      labelId="floor-select-label"
                      value={form.floor_id}
                      onChange={(e) => setForm({ ...form, floor_id: e.target.value })}
                      label="الدور"
                    >
                      {floors.map((floor: any) => (
                        <MenuItem key={floor.id} value={String(floor.id)}>
                          الدور {floor.number} {floor.name ? `- ${floor.name}` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small" required sx={{ minWidth: 120 }}>
                    <InputLabel id="room-type-select-label">نوع الغرفة</InputLabel>
                    <Select
                      labelId="room-type-select-label"
                      value={form.room_type_id}
                      onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}
                      label="نوع الغرفة"
                    >
                      {roomTypes.map((type: any) => (
                        <MenuItem key={type.id} value={String(type.id)}>
                          {type.name} ({type.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small" required sx={{ minWidth: 120 }}>
                    <InputLabel id="room-status-select-label">حالة الغرفة</InputLabel>
                    <Select
                      labelId="room-status-select-label"
                      value={form.room_status_id}
                      onChange={(e) => setForm({ ...form, room_status_id: e.target.value })}
                      label="حالة الغرفة"
                    >
                      {roomStatuses.map((status: any) => (
                        <MenuItem key={status.id} value={String(status.id)}>
                          {status.name} ({status.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Additional Notes Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                ملاحظات إضافية
              </Typography>
              <TextField
                fullWidth
                label="ملاحظات"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="أضف ملاحظات إضافية حول الغرفة..."
                multiline
                rows={3}
                size="small"
              />
            </Box>
          </Stack>
          <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1, pt: 3 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={handleClose}
              fullWidth={false}
              sx={{ width: { xs: '100%', sm: 'auto' }, height: 44 }}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth={false}
              sx={{ width: { xs: '100%', sm: 'auto' }, height: 44 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  جارٍ الحفظ...
                </>
              ) : (
                editingRoom ? 'تحديث' : 'إنشاء'
              )}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  )
}

