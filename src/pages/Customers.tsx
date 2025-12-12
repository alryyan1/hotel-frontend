import { useEffect, useState, useRef } from 'react'
import apiClient from '../api/axios'
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Description as FileTextIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { toast } from 'sonner'
import CreateCustomerDialog from '@/components/dialogs/CreateCustomerDialog'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

interface Customer {
  id: number
  name: string
  phone?: string
  national_id?: string
  address?: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  document_path?: string
  created_at: string
  updated_at: string
}

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    national_id: '',
    address: '',
    date_of_birth: '',
    gender: ''
  })
  const [uploadingDocument, setUploadingDocument] = useState<number | null>(null)
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/customers')
      setCustomers(data?.data || data)
    } catch (e) {
      console.error('Failed to fetch customers', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async () => {
    try {
      setLoading(true)
      const payload = { ...customerForm }
      const { data } = await apiClient.post('/customers', payload)
      setCustomers(prev => [data, ...prev])
      setOpenCreate(false)
      setCustomerForm({ name: '', phone: '', national_id: '', address: '', date_of_birth: '', gender: '' })
      toast.success('تم إنشاء العميل بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل إنشاء العميل')
    } finally {
      setLoading(false)
    }
  }

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return
    
    try {
      setLoading(true)
      const payload = { ...customerForm }
      const { data } = await apiClient.put(`/customers/${selectedCustomer.id}`, payload)
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? data : c))
      setOpenEdit(false)
      setSelectedCustomer(null)
      setCustomerForm({ name: '', phone: '', national_id: '', address: '', date_of_birth: '', gender: '' })
      toast.success('تم تحديث العميل بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل تحديث العميل')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟`)) return
    
    try {
      setLoading(true)
      await apiClient.delete(`/customers/${customer.id}`)
      setCustomers(prev => prev.filter(c => c.id !== customer.id))
      toast.success('تم حذف العميل بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل حذف العميل')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerForm({
      name: customer.name,
      phone: customer.phone || '',
      national_id: customer.national_id || '',
      address: customer.address || '',
      date_of_birth: customer.date_of_birth || '',
      gender: customer.gender || ''
    })
    setOpenEdit(true)
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.national_id?.includes(searchTerm)
  )

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY')
  }

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case 'male': return 'ذكر'
      case 'female': return 'أنثى'
      default: return 'غير محدد'
    }
  }

  const getGenderColor = (gender?: string): 'default' | 'secondary' | 'primary' => {
    switch (gender) {
      case 'male': return 'primary'
      case 'female': return 'secondary'
      default: return 'default'
    }
  }

  const handleFileUpload = async (customer: Customer, file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('يرجى رفع ملف PDF فقط')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن يكون أقل من 10 ميجابايت')
      return
    }

    try {
      setUploadingDocument(customer.id)
      const formData = new FormData()
      formData.append('document', file)

      const { data } = await apiClient.post(`/customers/${customer.id}/document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Update customer in the list
      setCustomers(prev => prev.map(c => 
        c.id === customer.id 
          ? { ...c, document_path: data.document_path }
          : c
      ))

      toast.success('تم رفع المستند بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل رفع المستند')
    } finally {
      setUploadingDocument(null)
    }
  }

  const handleDeleteDocument = async (customer: Customer) => {
    if (!confirm(`هل أنت متأكد من حذف المستند للعميل "${customer.name}"؟`)) return

    try {
      setUploadingDocument(customer.id)
      await apiClient.delete(`/customers/${customer.id}/document`)
      
      setCustomers(prev => prev.map(c => 
        c.id === customer.id 
          ? { ...c, document_path: undefined }
          : c
      ))

      toast.success('تم حذف المستند بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل حذف المستند')
    } finally {
      setUploadingDocument(null)
    }
  }

  const handleDownloadDocument = async (customer: Customer) => {
    try {
      const response = await apiClient.get(`/customers/${customer.id}/document`, {
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `customer_${customer.id}_document.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل تحميل المستند')
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      {/* Page Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          👥 إدارة العملاء
        </Typography>
        <Typography variant="body2" color="text.secondary">
          إدارة بيانات العملاء وحجوزاتهم
        </Typography>
      </Box>

      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <PeopleIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                قائمة العملاء ({filteredCustomers.length})
              </Typography>
            </Stack>
          }
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreate(true)}
              sx={{ boxShadow: 2 }}
            >
              عميل جديد
            </Button>
          }
        />
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="البحث بالاسم، الهاتف، أو الرقم الوطني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>الاسم</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>الهاتف</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>الرقم الوطني</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>النوع</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>المستند</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>تاريخ التسجيل</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell align="center" sx={{ fontWeight: 500 }}>
                      {customer.name}
                    </TableCell>
                    <TableCell align="center">
                      {customer.phone ? (
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                          <PhoneIcon sx={{ fontSize: 14 }} color="action" />
                          {customer.phone}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          غير محدد
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {customer.national_id || (
                        <Typography variant="body2" color="text.secondary">
                          غير محدد
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getGenderLabel(customer.gender)}
                        color={getGenderColor(customer.gender)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {customer.document_path ? (
                          <>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleDownloadDocument(customer)}
                              sx={{ color: 'success.main', borderColor: 'success.main', '&:hover': { borderColor: 'success.dark', bgcolor: 'success.light' } }}
                            >
                              تحميل
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CloseIcon />}
                              onClick={() => handleDeleteDocument(customer)}
                              disabled={uploadingDocument === customer.id}
                              sx={{ color: 'error.main', borderColor: 'error.main', '&:hover': { borderColor: 'error.dark', bgcolor: 'error.light' } }}
                            >
                              حذف
                            </Button>
                          </>
                        ) : (
                          <>
                            <input
                              ref={(el) => {
                                if (el) {
                                  fileInputRefs.current[customer.id] = el
                                }
                              }}
                              type="file"
                              accept=".pdf"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleFileUpload(customer, file)
                                }
                                // Reset input to allow selecting the same file again
                                e.target.value = ''
                              }}
                              disabled={uploadingDocument === customer.id}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={uploadingDocument === customer.id ? <CircularProgress size={14} /> : <UploadIcon />}
                              disabled={uploadingDocument === customer.id}
                              onClick={() => {
                                fileInputRefs.current[customer.id]?.click()
                              }}
                              sx={{ color: 'info.main', borderColor: 'info.main', '&:hover': { borderColor: 'info.dark', bgcolor: 'info.light' } }}
                            >
                              {uploadingDocument === customer.id ? 'جاري الرفع...' : 'رفع مستند'}
                            </Button>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                        <CalendarIcon sx={{ fontSize: 14 }} color="action" />
                        {formatDate(customer.created_at)}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FileTextIcon />}
                          onClick={() => navigate(`/customers/${customer.id}/ledger`)}
                          sx={{ color: 'info.main', borderColor: 'info.main', '&:hover': { borderColor: 'info.dark', bgcolor: 'info.light' } }}
                        >
                          كشف حساب
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(customer)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCustomer(customer)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {filteredCustomers.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PersonIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} color="action" />
              <Typography variant="body1" color="text.secondary">
                لا يوجد عملاء
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                ابدأ بإضافة عميل جديد
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <CreateCustomerDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        customerForm={customerForm}
        onCustomerFormChange={setCustomerForm}
        onCreateCustomer={handleCreateCustomer}
        loading={loading}
      />

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>تعديل العميل</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            تحديث بيانات العميل
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="الاسم"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="الهاتف"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="الرقم الوطني"
                value={customerForm.national_id}
                onChange={(e) => setCustomerForm({ ...customerForm, national_id: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="العنوان"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="تاريخ الميلاد"
                value={customerForm.date_of_birth}
                onChange={(e) => setCustomerForm({ ...customerForm, date_of_birth: e.target.value })}
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="gender-select-label">النوع</InputLabel>
                <Select
                  labelId="gender-select-label"
                  value={customerForm.gender}
                  onChange={(e) => setCustomerForm({ ...customerForm, gender: e.target.value })}
                  label="النوع"
                >
                  <MenuItem value="male">ذكر</MenuItem>
                  <MenuItem value="female">أنثى</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} variant="outlined">
            إلغاء
          </Button>
          <Button onClick={handleEditCustomer} disabled={loading} variant="contained">
            {loading ? <CircularProgress size={16} /> : 'حفظ التغييرات'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
