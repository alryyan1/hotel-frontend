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
  Chip
} from '@mui/material'

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
              الغرف المختارة
            </FormLabel>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedRooms.map((r: any) => (
                <Chip 
                  key={r.id} 
                  label={`غرفة ${r.number}`}
                  size="small"
                  variant="outlined"
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
