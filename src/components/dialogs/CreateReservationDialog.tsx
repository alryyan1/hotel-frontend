import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  FormLabel, 
  Autocomplete,
  Box,
  Chip,
  Alert,
  Typography
} from '@mui/material'
import { Warning as WarningIcon } from '@mui/icons-material'

interface CreateReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: any[]
  selectedRooms: any[]
  form: {
    customer_id: string
    notes: string
  }
  onFormChange: (form: { customer_id: string; notes: string }) => void
  onCreateReservation: () => void
  onOpenCustomerDialog: () => void
  loading: boolean
}

export default function CreateReservationDialog({
  open,
  onOpenChange,
  customers,
  selectedRooms,
  form,
  onFormChange,
  onCreateReservation,
  onOpenCustomerDialog,
  loading
}: CreateReservationDialogProps) {
  const occupiedRooms = selectedRooms.filter((r: any) => r.is_occupied && r.current_reservation)
  
  return (
    <Dialog 
      open={open} 
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxWidth: '500px'
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>إنشاء حجز</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Occupied Rooms Warning */}
          {occupiedRooms.length > 0 && (
            <Alert 
              severity="warning" 
              icon={<WarningIcon />}
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                تحذير: بعض الغرف المختارة محجوزة حالياً
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {occupiedRooms.map((room: any) => (
                  <li key={room.id}>
                    <Typography variant="caption" component="span">
                      <strong>غرفة {room.number}</strong>: محجوزة حتى{' '}
                      {new Date(room.current_reservation.check_out_date).toLocaleDateString('ar-SA')}
                      {' '}(العميل: {room.current_reservation.customer_name})
                    </Typography>
                  </li>
                ))}
              </Box>
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                سيتم إنشاء الحجز، ولكن يرجى التأكد من أن الضيوف الحاليين سيغادرون في التاريخ المحدد.
              </Typography>
            </Alert>
          )}
          
          <Autocomplete
            options={customers}
            getOptionLabel={(option: any) => `${option.name} — ${option.phone || option.email || ''}`}
            value={customers.find((c: any) => String(c.id) === form.customer_id) || null}
            onChange={(_, newValue: any) => {
              onFormChange({ ...form, customer_id: newValue ? String(newValue.id) : '' })
            }}
            renderInput={(params) => (
              <TextField {...params} label="العميل" />
            )}
            fullWidth
          />
          
          <Button 
            variant="outlined" 
            onClick={onOpenCustomerDialog}
            fullWidth
          >
            عميل جديد
          </Button>
          
          <TextField
            label="ملاحظات"
            value={form.notes}
            onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
          
          <Box>
            <FormLabel sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
              الغرف المختارة ({selectedRooms.length})
            </FormLabel>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedRooms.map((r: any) => (
                <Chip 
                  key={r.id} 
                  label={`غرفة ${r.number}${r.is_occupied ? ' (محجوزة)' : ''}`}
                  size="small"
                  variant={r.is_occupied ? "filled" : "outlined"}
                  color={r.is_occupied ? "warning" : "default"}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px', gap: '8px' }}>
        <Button variant="outlined" onClick={() => onOpenChange(false)}>
          إلغاء
        </Button>
        <Button 
          variant="contained" 
          onClick={onCreateReservation} 
          disabled={loading}
        >
          حفظ
        </Button>
      </DialogActions>
    </Dialog>
  )
}
