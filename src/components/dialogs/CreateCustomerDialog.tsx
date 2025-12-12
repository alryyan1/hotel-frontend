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
  Grid,
  Divider,
  Stack,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material'
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Wc as GenderIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material'

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
  const handleClose = () => {
    if (!loading) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          maxWidth: '600px'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          fontWeight: 'bold', 
          fontSize: '1.5rem',
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0',
          px: 3,
          pt: 2.5
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <PersonIcon sx={{ fontSize: 24 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', m: 0 }}>
            إضافة عميل جديد
          </Typography>
        </Stack>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
          }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 3, px: 0.5 }}
        >
          يرجى ملء المعلومات التالية لإضافة عميل جديد إلى النظام
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Personal Information Section */}
          <Box>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                color: 'primary.main',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              المعلومات الشخصية
            </Typography>
            <TextField
              label="الاسم الكامل"
              value={customerForm.name}
              onChange={(e) => onCustomerFormChange({ ...customerForm, name: e.target.value })}
              fullWidth
              required
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Contact Information Section */}
          <Box>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                color: 'primary.main',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              معلومات الاتصال
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="رقم الهاتف"
                  value={customerForm.phone}
                  onChange={(e) => onCustomerFormChange({ ...customerForm, phone: e.target.value })}
                  fullWidth
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="الرقم الوطني"
                  value={customerForm.national_id}
                  onChange={(e) => onCustomerFormChange({ ...customerForm, national_id: e.target.value })}
                  fullWidth
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Address Section */}
          <Box>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                color: 'primary.main',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              العنوان
            </Typography>
            <TextField
              label="العنوان الكامل"
              value={customerForm.address}
              onChange={(e) => onCustomerFormChange({ ...customerForm, address: e.target.value })}
              fullWidth
              multiline
              rows={3}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                    <HomeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Additional Information Section */}
          <Box>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                color: 'primary.main',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              معلومات إضافية
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="تاريخ الميلاد"
                  type="date"
                  value={customerForm.date_of_birth}
                  onChange={(e) => onCustomerFormChange({ ...customerForm, date_of_birth: e.target.value })}
                  fullWidth
                  size="medium"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="medium">
                  <InputLabel>النوع</InputLabel>
                  <Select
                    value={customerForm.gender}
                    onChange={(e) => onCustomerFormChange({ ...customerForm, gender: e.target.value as string })}
                    label="النوع"
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderRadius: '12px',
                      },
                    }}
                  >
                    <MenuItem value="male">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GenderIcon sx={{ fontSize: 18 }} />
                        <span>ذكر</span>
                      </Box>
                    </MenuItem>
                    <MenuItem value="female">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GenderIcon sx={{ fontSize: 18 }} />
                        <span>أنثى</span>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions 
        sx={{ 
          padding: '20px 24px',
          gap: '12px',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50'
        }}
      >
        <Button 
          variant="outlined" 
          onClick={handleClose}
          disabled={loading}
          startIcon={<CloseIcon />}
          sx={{
            borderRadius: '10px',
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            }
          }}
        >
          إلغاء
        </Button>
        <Button 
          variant="contained" 
          onClick={onCreateCustomer} 
          disabled={loading || !customerForm.name.trim()}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          sx={{
            borderRadius: '10px',
            px: 4,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
            },
            '&:disabled': {
              background: 'grey.300',
            }
          }}
        >
          {loading ? 'جاري الحفظ...' : 'حفظ العميل'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
