import { useState, useEffect } from 'react'
import apiClient from '@/api/axios'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Box,
  Typography,
  Stack,
  CircularProgress,
} from '@mui/material'

interface RoomDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedRoom: any | null
  roomStatuses: any[]
  onSuccess: (roomId?: number) => void
  onError: (message: string) => void
}

export default function RoomDetailsDialog({
  open,
  onOpenChange,
  selectedRoom,
  roomStatuses,
  onSuccess,
  onError
}: RoomDetailsDialogProps) {
  const [room, setRoom] = useState<any>(null)
  const [savingStatus, setSavingStatus] = useState(false)

  // Update room state when selectedRoom changes
  useEffect(() => {
    if (selectedRoom) {
      setRoom({ ...selectedRoom })
    }
  }, [selectedRoom, open])

  const handleChangeStatus = async () => {
    if (!room) return
    
    try {
      setSavingStatus(true)
      const payload = {
        number: room.number,
        floor_id: room.floor_id,
        room_type_id: room.room_type_id,
        room_status_id: room.room_status_id,
        beds: room.beds,
        notes: room.notes || ''
      }
      await apiClient.put(`/rooms/${room.id}`, payload)
      onOpenChange(false)
      onSuccess(room.id)
    } catch (err: any) {
      onError(err?.response?.data?.message || 'فشل تحديث الحالة')
    } finally {
      setSavingStatus(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!room) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>تفاصيل الغرفة</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: 'primary.50',
                color: 'primary.main',
                fontWeight: 'bold',
                fontSize: '1.125rem',
              }}
            >
              {room.number}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                غرفة {room.number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                الدور {room.floor?.number} • {room.type?.name}
              </Typography>
            </Box>
          </Box>
          <FormControl fullWidth size="small">
            <InputLabel>حالة الغرفة</InputLabel>
            <Select
              value={String(room.room_status_id)}
              onChange={(e) => setRoom({ ...room, room_status_id: e.target.value })}
              label="حالة الغرفة"
            >
              {roomStatuses.map((status: any) => (
                <MenuItem key={status.id} value={String(status.id)}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="ملاحظات"
            value={room.notes || ''}
            onChange={(e) => setRoom({ ...room, notes: e.target.value })}
            placeholder="أضف ملاحظات..."
            multiline
            rows={3}
            size="small"
          />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              معلومات إضافية
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`الأسرة: ${room.beds}`} size="small" variant="outlined" />
              <Chip label={`النوع: ${room.type?.code}`} size="small" variant="outlined" />
              <Chip label={`السعر: $${room.type?.base_price}`} size="small" variant="outlined" />
            </Stack>
          </Box>
        </Stack>
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1, pt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            fullWidth={false}
            sx={{ width: { xs: '100%', sm: 'auto' }, height: 44 }}
          >
            إغلاق
          </Button>
          <Button
            variant="contained"
            onClick={handleChangeStatus}
            disabled={savingStatus}
            fullWidth={false}
            sx={{ width: { xs: '100%', sm: 'auto' }, height: 44 }}
          >
            {savingStatus ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                جارٍ الحفظ...
              </>
            ) : (
              'حفظ التغييرات'
            )}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
}

