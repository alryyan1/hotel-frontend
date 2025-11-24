import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography,
  Button, 
  TextField, 
  FormControl,
  InputLabel,
  Select, 
  MenuItem,
  Box,
  Grid
} from '@mui/material'

interface CreateCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerForm: {
    name: string
    phone: string
    national_id: string
    address: string
    date_of_birth: string
    gender: string
  }
  onCustomerFormChange: (form: {
    name: string
    phone: string
    national_id: string
    address: string
    date_of_birth: string
    gender: string
  }) => void
  onCreateCustomer: () => void
  loading: boolean
}

export default function CreateCustomerDialog({
  open,
  onOpenChange,
  customerForm,
  onCustomerFormChange,
  onCreateCustomer,
  loading
}: CreateCustomerDialogProps) {
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
      <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>عميل جديد</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          إضافة عميل إلى قاعدة البيانات
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            label="الاسم"
            value={customerForm.name}
            onChange={(e) => onCustomerFormChange({ ...customerForm, name: e.target.value })}
            fullWidth
            required
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="الهاتف"
                value={customerForm.phone}
                onChange={(e) => onCustomerFormChange({ ...customerForm, phone: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="الرقم الوطني"
                value={customerForm.national_id}
                onChange={(e) => onCustomerFormChange({ ...customerForm, national_id: e.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>
          
          <TextField
            label="العنوان"
            value={customerForm.address}
            onChange={(e) => onCustomerFormChange({ ...customerForm, address: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="تاريخ الميلاد"
                type="date"
                value={customerForm.date_of_birth}
                onChange={(e) => onCustomerFormChange({ ...customerForm, date_of_birth: e.target.value })}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>النوع</InputLabel>
                <Select
                  value={customerForm.gender}
                  onChange={(e) => onCustomerFormChange({ ...customerForm, gender: e.target.value as string })}
                  label="النوع"
                >
                  <MenuItem value="male">ذكر</MenuItem>
                  <MenuItem value="female">أنثى</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px', gap: '8px' }}>
        <Button variant="outlined" onClick={() => onOpenChange(false)}>
          إلغاء
        </Button>
        <Button 
          variant="contained" 
          onClick={onCreateCustomer} 
          disabled={loading}
        >
          حفظ
        </Button>
      </DialogActions>
    </Dialog>
  )
}
