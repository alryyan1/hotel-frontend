import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/axios'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Stack,
  Autocomplete,
} from '@mui/material'
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  HowToReg as PersonCheckIcon,
  PersonRemove as PersonOffIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  Clear as ClearIcon,
  FileDownload as FileDownloadIcon,
  RoomService as RoomServiceIcon,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import { toast } from 'sonner'

interface Reservation {
  id: number
  customer_id: number
  check_in_date: string
  check_out_date: string
  guest_count: number
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  total_amount?: number
  paid_amount?: number
  notes?: string
  created_at: string
  updated_at: string
  customer: {
    id: number
    name: string
    phone?: string
    email?: string
  }
  rooms: Array<{
    id: number
    number: string
    floor?: {
      number: number
    }
    type?: {
      name: string
      capacity: number
      base_price: number
    }
    pivot?: {
      rate: number
      currency: string
    }
  }>
}

interface Customer {
  id: number
  name: string
  phone?: string
  national_id?: string
}

const statusConfig = {
  pending: { label: 'في الانتظار', color: 'warning', icon: AccessTimeIcon },
  confirmed: { label: 'مؤكد', color: 'info', icon: CheckCircleIcon },
  checked_in: { label: 'تم تسجيل الوصول', color: 'success', icon: PersonCheckIcon },
  checked_out: { label: 'تم تسجيل المغادرة', color: 'default', icon: PersonOffIcon },
  cancelled: { label: 'ملغي', color: 'error', icon: CancelIcon },
}

export default function ReservationsList() {
  const navigate = useNavigate()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<number, string>>({})
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // Single date filter based on reservation creation date (created_at)
  const [createdAtFilter, setCreatedAtFilter] = useState<string>('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [openDetails, setOpenDetails] = useState(false)
  const [openConfirm, setOpenConfirm] = useState(false)
  const [actionType, setActionType] = useState<'confirm' | 'checkin' | 'checkout' | 'cancel' | 'delete'>('confirm')
  const [customerBalance, setCustomerBalance] = useState<number | null>(null)
  const [occupiedRoomsError, setOccupiedRoomsError] = useState<any>(null)
  const [openOccupiedRoomsDialog, setOpenOccupiedRoomsDialog] = useState(false)
  const [openExtend, setOpenExtend] = useState(false)
  const [newCheckOutDate, setNewCheckOutDate] = useState<string>('')
  const [extensionLoading, setExtensionLoading] = useState(false)
  const [openService, setOpenService] = useState(false)
  const [availableServices, setAvailableServices] = useState<any[]>([])
  const [serviceForm, setServiceForm] = useState({ room_id: '', service_id: '', amount: '', notes: '' })
  const [serviceLoading, setServiceLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Fetch customers and services list
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true)
        const { data } = await apiClient.get('/customers', {
          params: {
            per_page: 100 // Get more customers for autocomplete
          }
        })
        const customersData = data.data || data
        setCustomers(Array.isArray(customersData) ? customersData : [])
      } catch (e) {
        console.error('Failed to fetch customers', e)
      } finally {
        setLoadingCustomers(false)
      }
    }
    const fetchServicesList = async () => {
      try {
        const { data } = await apiClient.get('/services')
        setAvailableServices(data)
      } catch (e) {
        console.error('Failed to fetch services', e)
      }
    }
    fetchCustomers()
    fetchServicesList()
  }, [])

  // Fetch immediately for status, date, customer filters, and pagination
  useEffect(() => {
    fetchReservations()
  }, [statusFilter, createdAtFilter, selectedCustomer, currentPage, perPage])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const params: any = {}

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }

      // Filter by reservation creation date (created_at)
      if (createdAtFilter) {
        params.created_at_date = createdAtFilter
      }

      if (selectedCustomer) {
        params.customer_id = selectedCustomer.id
      }
      
      params.page = currentPage
      params.per_page = perPage
      
      const { data } = await apiClient.get('/reservations', { params })
      const reservationsData = data.data || []
      setReservations(reservationsData)
      setTotalPages(data.last_page || 1)
      setTotalItems(data.total || 0)
    } catch (e) {
      console.error('Failed to fetch reservations', e)
      toast.error('فشل في جلب الحجوزات')
    } finally {
      setLoading(false)
    }
  }

  // Check if payment is complete
  const isPaymentComplete = (reservation: Reservation): boolean => {
    if (!reservation.total_amount || reservation.total_amount === 0) {
      return true
    }
    const paid = reservation.paid_amount || 0
    return paid >= reservation.total_amount
  }

  // Get customer balance
  const getCustomerBalance = async (customerId: number): Promise<number> => {
    try {
      const { data } = await apiClient.get(`/customers/${customerId}/balance`)
      return data.balance || 0
    } catch (err) {
      console.error('Failed to fetch customer balance', err)
      return 0
    }
  }

  const handleAction = async (reservation: Reservation, action: 'confirm' | 'checkin' | 'checkout' | 'cancel' | 'delete', skipDialog: boolean = false) => {
    // Show dialog for checkout and cancel actions
    if (!skipDialog && (action === 'checkout' || action === 'cancel' || action === 'delete')) {
      setSelectedReservation(reservation)
      setActionType(action)
      // Fetch customer balance for checkout
      if (action === 'checkout') {
        getCustomerBalance(reservation.customer_id).then(balance => {
          setCustomerBalance(balance)
        })
      } else {
        setCustomerBalance(null)
      }
      setOpenConfirm(true)
      return
    }

    try {
      setActionLoading(prev => ({ ...prev, [reservation.id]: action }))
      
      let updatedReservation: Reservation | null = null
      
      switch (action) {
        case 'confirm':
          const { data } = await apiClient.post(`/reservations/${reservation.id}/confirm`)
          updatedReservation = data
          toast.success('تم تأكيد الحجز بنجاح')
          
          if (data.sms_result) {
            if (data.sms_result.success) {
              toast.success('تم إرسال رسالة تأكيد الحجز بنجاح', { 
                position: 'top-right',
                duration: 4000 
              })
            } else {
              toast.error(`فشل إرسال الرسالة: ${data.sms_result.error || 'خطأ غير معروف'}`, { 
                position: 'top-right',
                duration: 5000 
              })
            }
          }
          break
        case 'checkin':
          try {
            const checkinData = await apiClient.post(`/reservations/${reservation.id}/check-in`)
            updatedReservation = checkinData.data
            toast.success('تم تسجيل الوصول بنجاح')
          } catch (checkinErr: any) {
            // Check if error contains occupied rooms information
            if (checkinErr?.response?.data?.occupied_rooms && Array.isArray(checkinErr.response.data.occupied_rooms)) {
              setOccupiedRoomsError({
                reservationId: reservation.id,
                occupiedRooms: checkinErr.response.data.occupied_rooms,
              })
              setOpenOccupiedRoomsDialog(true)
              // Don't throw, just return early
              setActionLoading(prev => {
                const newState = { ...prev }
                delete newState[reservation.id]
                return newState
              })
              return
            }
            // Re-throw if it's a different error
            throw checkinErr
          }
          break
        case 'checkout':
          // Check customer balance before checkout
       
          
          // Show warning toast if payment is not complete for this reservation
          if (!isPaymentComplete(reservation)) {
            const totalAmount = reservation.total_amount || 0
            const paidAmount = reservation.paid_amount || 0
            const remaining = totalAmount - paidAmount
            toast.warning(
              `تم تسجيل المغادرة مع تحذير: المبلغ المتبقي ${remaining.toLocaleString()} `,
              { 
                position: 'top-right',
                duration: 6000 
              }
            )
          }
          const checkoutData = await apiClient.post(`/reservations/${reservation.id}/check-out`)
          updatedReservation = checkoutData.data
          toast.success('تم تسجيل المغادرة بنجاح')
          break
        case 'cancel':
          const cancelData = await apiClient.post(`/reservations/${reservation.id}/cancel`)
          updatedReservation = cancelData.data
          toast.success('تم إلغاء الحجز بنجاح')
          break
        case 'delete':
          await apiClient.delete(`/reservations/${reservation.id}`)
          setReservations(prev => prev.filter(r => r.id !== reservation.id))
          setOpenConfirm(false)
          setSelectedReservation(null)
          return
      }
      
      // Update reservation in list
      if (updatedReservation) {
        setReservations(prev => prev.map(r => {
          if (r.id === reservation.id) {
            return {
              ...updatedReservation,
              rooms: updatedReservation.rooms || r.rooms || []
            }
          }
          return r
        }))
      }
      
      setOpenConfirm(false)
      setSelectedReservation(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في تنفيذ العملية')
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev }
        delete newState[reservation.id]
        return newState
      })
    }
  }

  const handleDialogAction = async () => {
    if (!selectedReservation) return
    
    // For checkout, check customer balance before proceeding
   
    
    await handleAction(selectedReservation, actionType, true)
  }

  // Filtering is now done on the backend, so we just use the reservations directly
  const filteredReservations = reservations

  const clearDateFilter = () => {
    setCreatedAtFilter('')
  }

  const clearCustomerFilter = () => {
    setSelectedCustomer(null)
  }

  const handleExportExcel = async () => {
    try {
      setExportLoading(true)
      
      // Build query parameters from current filters
      const params: any = {}

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      if (selectedCustomer) {
        params.customer_id = selectedCustomer.id
      }

      if (createdAtFilter) {
        params.created_at_date = createdAtFilter
      }

      // Use axios to get the file with proper authentication
      const response = await apiClient.get('/reservations/export/excel', {
        params: params,
        responseType: 'blob',
      })

      // Check if response is actually an error (blob might contain error JSON)
      if (response.data instanceof Blob) {
        // Check content type from response headers
        const contentType = response.headers['content-type'] || ''
        
        if (contentType.includes('application/json') || response.data.type === 'application/json') {
          // Response is an error, read it as text
          const errorText = await response.data.text()
          try {
            const errorData = JSON.parse(errorText)
            toast.error(errorData?.message || 'فشل في تصدير الملف')
            return
          } catch {
            toast.error('فشل في تصدير الملف')
            return
          }
        }
      }

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      
      if (blob.size === 0) {
        toast.error('الملف فارغ')
        return
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const filename = `reservations_export_${new Date().toISOString().split('T')[0]}.xlsx`
      link.setAttribute('download', filename)
      link.style.display = 'none'
      document.body.appendChild(link)
      
      // Trigger download
      try {
        link.click()
        // Clean up after a short delay
        setTimeout(() => {
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }, 100)
      } catch (downloadError) {
        console.error('Download error:', downloadError)
        // Fallback: open in new window
        window.open(url, '_blank')
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
      
      toast.success('تم تصدير الملف بنجاح')
    } catch (err: any) {
      console.error('Failed to export Excel', err)
      
      // If error response is a blob, try to parse it
      if (err?.response?.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text()
          const errorData = JSON.parse(errorText)
          toast.error(errorData?.message || 'فشل في تصدير الملف')
        } catch {
          toast.error(err?.response?.data?.message || err?.message || 'فشل في تصدير الملف')
        }
      } else {
        toast.error(err?.response?.data?.message || err?.message || 'فشل في تصدير الملف')
      }
    } finally {
      setExportLoading(false)
    }
  }

  const getStatusChip = (status: Reservation['status']) => {
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Chip
        icon={<Icon />}
        label={config.label}
        color={config.color as any}
        size="small"
      />
    )
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY')
  }

  const getRelativeDate = (dateString: string) => {
    const date = dayjs(dateString)
    const now = dayjs()
    
    if (date.isSame(now, 'day')) {
      return 'اليوم'
    } else if (date.isSame(now.add(1, 'day'), 'day')) {
      return 'غداً'
    } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
      return 'أمس'
    } else if (date.isAfter(now)) {
      return `خلال ${date.diff(now, 'day')} أيام`
    } else {
      return `منذ ${now.diff(date, 'day')} أيام`
    }
  }

  const getActionButtons = (reservation: Reservation) => {
    const buttons = [];
    const isLoading = actionLoading[reservation.id] !== undefined;
    const currentAction = actionLoading[reservation.id];

    const commonSx = {
      py: 0.5,
      px: 1,
      minWidth: "auto",
      fontSize: "0.75rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
    };

    if (reservation.status === "pending") {
      buttons.push(
        <Button
          key="confirm"
          size="small"
          variant="outlined"
          onClick={() => handleAction(reservation, "confirm", true)}
          disabled={isLoading}
          color="info"
          startIcon={
            isLoading && currentAction === "confirm" ? (
              <CircularProgress size={14} />
            ) : undefined
          }
          sx={commonSx}
        >
          تأكيد
        </Button>,
      );
    }

    if (reservation.status === "confirmed") {
      buttons.push(
        <Button
          key="checkin"
          size="small"
          variant="outlined"
          onClick={() => handleAction(reservation, "checkin", true)}
          disabled={isLoading}
          color="success"
          startIcon={
            isLoading && currentAction === "checkin" ? (
              <CircularProgress size={14} />
            ) : undefined
          }
          sx={commonSx}
        >
          تسجيل الوصول
        </Button>,
      );
    }

    if (reservation.status === "checked_in") {
      buttons.push(
        <Button
          key="checkout"
          size="small"
          variant="outlined"
          onClick={() => handleAction(reservation, "checkout", false)}
          disabled={isLoading}
          color="inherit"
          startIcon={
            isLoading && currentAction === "checkout" ? (
              <CircularProgress size={14} />
            ) : undefined
          }
          sx={commonSx}
        >
          تسجيل المغادرة
        </Button>,
      );
    }
    if (["confirmed", "checked_in"].includes(reservation.status)) {
      buttons.push(
        <Button
          key="extend"
          size="small"
          variant="outlined"
          onClick={() => {
            setSelectedReservation(reservation);
            setNewCheckOutDate(
              dayjs(reservation.check_out_date).add(1, "day").format("YYYY-MM-DD"),
            );
            setOpenExtend(true);
          }}
          disabled={isLoading}
          color="secondary"
          startIcon={<CalendarIcon sx={{ fontSize: "1rem !important" }} />}
          sx={commonSx}
        >
          تمديد
        </Button>,
      );

      buttons.push(
        <Button
          key="service"
          size="small"
          variant="outlined"
          onClick={() => {
            setSelectedReservation(reservation);
            setServiceForm({
              room_id: reservation.rooms?.[0]?.id?.toString() || "",
              service_id: "",
              amount: "",
              notes: "",
            });
            setOpenService(true);
          }}
          disabled={isLoading}
          color="primary"
          startIcon={<RoomServiceIcon sx={{ fontSize: "1rem !important" }} />}
          sx={commonSx}
        >
          إضافة خدمة
        </Button>,
      );
    }

    if (!["checked_in", "checked_out"].includes(reservation.status)) {
      buttons.push(
        <Button
          key="cancel"
          size="small"
          variant="outlined"
          onClick={() => handleAction(reservation, "cancel", false)}
          disabled={isLoading}
          color="error"
          startIcon={
            isLoading && currentAction === "cancel" ? (
              <CircularProgress size={14} />
            ) : undefined
          }
          sx={commonSx}
        >
          إلغاء
        </Button>,
      );
    }

    return buttons;
  }

  const handleExtend = async () => {
    if (!selectedReservation || !newCheckOutDate) return

    try {
      setExtensionLoading(true)
      const { data } = await apiClient.post(`/reservations/${selectedReservation.id}/extend`, {
        check_out_date: newCheckOutDate
      })
      
      setReservations(prev => prev.map(r => r.id === data.id ? data : r))
      setOpenExtend(false)
      setSelectedReservation(null)
      toast.success('تم تمديد الحجز بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في تمديد الحجز')
    } finally {
      setExtensionLoading(false)
    }
  }

  const calculateExtensionPrice = () => {
    if (!selectedReservation || !newCheckOutDate) return 0
    
    const oldOut = dayjs(selectedReservation.check_out_date)
    const newOut = dayjs(newCheckOutDate)
    const days = newOut.diff(oldOut, 'day')
    
    if (days <= 0) return 0
    
    let total = 0
    selectedReservation.rooms.forEach((room: any) => {
      const pivotRate = room.pivot?.rate !== undefined && room.pivot?.rate !== null ? Number(room.pivot.rate) : 0
      const typeRate = room.type?.base_price !== undefined && room.type?.base_price !== null ? Number(room.type.base_price) : 0
      
      const rate = pivotRate || typeRate || 0
      total += days * rate
    })
    
    return total
  }

  const handleServiceSubmit = async () => {
    if (!selectedReservation || !serviceForm.room_id || !serviceForm.service_id || !serviceForm.amount) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة')
      return
    }

    try {
      setServiceLoading(true)
      await apiClient.post('/reservation-services', {
        reservation_id: selectedReservation.id,
        room_id: serviceForm.room_id,
        service_id: serviceForm.service_id,
        amount: parseFloat(serviceForm.amount),
        notes: serviceForm.notes
      })
      
      toast.success('تمت إضافة الخدمة بنجاح')
      setOpenService(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في إضافة الخدمة')
    } finally {
      setServiceLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Search and Filter Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, flexWrap: 'wrap' }}>
            {/* Customer autocomplete filter */}
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 auto' }, minWidth: { xs: '100%', md: '300px' } }}>
              <Autocomplete
                fullWidth
                options={customers}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option
                  return `${option.name}${option.phone ? ` - ${option.phone}` : ''}`
                }}
                value={selectedCustomer}
                onChange={(_, newValue) => {
                  setSelectedCustomer(newValue)
                }}
                loading={loadingCustomers}
                sx={{ width: '100%' }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="فلترة بالعميل"
                    placeholder="اختر عميل..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.name}
                      </Typography>
                      {option.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {option.phone}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText="لا يوجد عملاء"
                clearOnEscape
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 180px' }, minWidth: { xs: '100%', md: '180px' } }}>
              <FormControl fullWidth>
                <InputLabel>فلترة بالحالة</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="فلترة بالحالة"
                >
                  <MenuItem value="all">جميع الحالات</MenuItem>
                  <MenuItem value="pending">في الانتظار</MenuItem>
                  <MenuItem value="confirmed">مؤكد</MenuItem>
                  <MenuItem value="checked_in">تم تسجيل الوصول</MenuItem>
                  <MenuItem value="checked_out">تم تسجيل المغادرة</MenuItem>
                  <MenuItem value="cancelled">ملغي</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {/* Single date filter based on reservation creation date */}
            <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 220px' }, minWidth: { xs: '100%', md: '220px' } }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  type="date"
                  label="تاريخ إنشاء الحجز"
                  value={createdAtFilter}
                  onChange={(e) => setCreatedAtFilter(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                 
                />
                {createdAtFilter && (
                  <IconButton
                    size="small"
                    onClick={clearDateFilter}
                    color="error"
                    title="مسح فلترة تاريخ الإنشاء"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Box>
          </Box>
          {(createdAtFilter || selectedCustomer) && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {createdAtFilter && (
                <Box sx={{ p: 1.5, bgcolor: 'info.light', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="info.dark">
                    {`عرض الحجوزات بتاريخ الإنشاء ${dayjs(createdAtFilter).format('DD/MM/YYYY')}`}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={clearDateFilter}
                    sx={{ ml: 1 }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
              {selectedCustomer && (
                <Box sx={{ p: 1.5, bgcolor: 'primary.light', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="primary.dark">
                    العميل: {selectedCustomer.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={clearCustomerFilter}
                    sx={{ ml: 1 }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Reservations Table Card */}
      <Card>
        <CardHeader 
          title={
            <Typography variant="h6" component="div">
              الحجوزات ({filteredReservations.length})
            </Typography>
          }
          action={
            <Button
              variant="outlined"
              startIcon={exportLoading ? <CircularProgress size={16} /> : <FileDownloadIcon />}
              onClick={handleExportExcel}
              disabled={loading || exportLoading || filteredReservations.length === 0}
              sx={{ boxShadow: 1 }}
            >
              {exportLoading ? 'جارٍ التصدير...' : 'تصدير Excel'}
            </Button>
          }
        />
        <CardContent>
          {loading && reservations.length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">رقم الحجز</TableCell>
                    <TableCell align="center">العميل</TableCell>
                    <TableCell align="center">الغرف</TableCell>
                    <TableCell align="center">تاريخ الوصول</TableCell>
                    <TableCell align="center">تاريخ المغادرة</TableCell>
                    <TableCell align="center">عدد الضيوف</TableCell>
                    <TableCell align="center">الحالة</TableCell>
                    <TableCell align="center">الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">لا توجد حجوزات</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReservations.map((reservation) => (
                      <TableRow key={reservation.id} hover>
                        <TableCell align="center">
                          <Typography fontWeight="medium">#{reservation.id}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="medium">
                            {reservation.customer?.name || 'غير محدد'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reservation.customer?.phone || reservation.customer?.email || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
                            {reservation.rooms?.map((room) => (
                              <Chip
                                key={room.id}
                                label={`غرفة ${room.number}`}
                                size="small"
                                variant="outlined"
                              />
                            )) || <Typography variant="caption" color="text.secondary">-</Typography>}
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="medium">
                            {formatDate(reservation.check_in_date)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getRelativeDate(reservation.check_in_date)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="medium">
                            {formatDate(reservation.check_out_date)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getRelativeDate(reservation.check_out_date)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{reservation.guest_count}</TableCell>
                        <TableCell align="center">
                          {getStatusChip(reservation.status)}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            {getActionButtons(reservation)}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loading && reservations.length > 0 && (
            <Box
              sx={{
                mt: 3,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  عرض:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                  من {totalItems} حجز
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  السابق
                </Button>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    borderRadius: 1,
                    bgcolor: "action.hover",
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    صفحة {currentPage} من {totalPages}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={currentPage === totalPages || loading}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  التالي
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>تفاصيل الحجز #{selectedReservation?.id}</DialogTitle>
        <DialogContent>
          {selectedReservation && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">العميل</Typography>
                <Typography fontWeight="medium">
                  {selectedReservation.customer?.name || 'غير محدد'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedReservation.customer?.phone || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">الحالة</Typography>
                <Box sx={{ mt: 1 }}>
                  {getStatusChip(selectedReservation.status)}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">تاريخ الوصول</Typography>
                <Typography fontWeight="medium">
                  {formatDate(selectedReservation.check_in_date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getRelativeDate(selectedReservation.check_in_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">تاريخ المغادرة</Typography>
                <Typography fontWeight="medium">
                  {formatDate(selectedReservation.check_out_date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getRelativeDate(selectedReservation.check_out_date)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">الغرف</Typography>
                <Box sx={{ mt: 1 }}>
                  {selectedReservation.rooms?.map((room) => (
                    <Paper key={room.id} sx={{ p: 2, mb: 1 }}>
                      <Typography fontWeight="medium">غرفة {room.number}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {room.floor ? `الدور ${room.floor.number}` : 'الدور غير محدد'} • {room.type?.name || 'نوع غير محدد'} • {room.type?.capacity || 0} ضيوف
                      </Typography>
                    </Paper>
                  )) || <Typography variant="body2" color="text.secondary">لا توجد غرف</Typography>}
                </Box>
              </Grid>
              {selectedReservation.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">ملاحظات</Typography>
                  <Paper sx={{ p: 2, mt: 1, bgcolor: 'grey.100' }}>
                    <Typography variant="body2">{selectedReservation.notes}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>تأكيد العملية</DialogTitle>
        <DialogContent>
          {actionType === 'checkout' && selectedReservation ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {/* Early checkout refund notice */}
              {(() => {
                const today = dayjs().startOf('day')
                const scheduledOut = dayjs(selectedReservation.check_out_date).startOf('day')
                const remainingDays = scheduledOut.diff(today, 'day')
                if (remainingDays > 0) {
                  let refundAmount = 0
                  selectedReservation.rooms.forEach((room: any) => {
                    const rate = room.pivot?.rate ?? room.type?.base_price ?? 0
                    refundAmount += remainingDays * Number(rate)
                  })
                  return (
                    <Alert severity="info" sx={{ bgcolor: 'info.light' }}>
                      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                        مغادرة مبكرة - سيتم استرجاع مبلغ
                      </Typography>
                      <Typography variant="body2">
                        تاريخ المغادرة المجدولة: <strong>{formatDate(selectedReservation.check_out_date)}</strong>
                      </Typography>
                      <Typography variant="body2">
                        عدد الأيام المتبقية: <strong>{remainingDays} يوم</strong>
                      </Typography>
                      {refundAmount > 0 && (
                        <Typography variant="body1" color="info.dark" fontWeight="bold" sx={{ mt: 1 }}>
                          المبلغ المسترجع: {refundAmount.toLocaleString()} SDG
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        سيظهر المبلغ المسترجع في قسم المالية تحت بند "المبالغ المسترجعة"
                      </Typography>
                    </Alert>
                  )
                }
                return null
              })()}

              {customerBalance !== null && customerBalance !== 0 && (
                <Alert severity="error">
                  <Typography variant="subtitle2" gutterBottom>
                     تسجيل المغادرة!
                  </Typography>
                  <Typography variant="body2">
                تحذير تسويه يرجي الحساب  اولا <strong>{customerBalance.toLocaleString()} </strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    يرجى تسوية رصيد العميل أولاً قبل تسجيل المغادرة.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                      setOpenConfirm(false)
                      navigate(`/customers/${selectedReservation.customer_id}/ledger`)
                    }}
                    sx={{ mt: 2 }}
                  >
                    الانتقال إلى دفتر الحسابات
                  </Button>
                </Alert>
              )}
              {customerBalance === 0 && !isPaymentComplete(selectedReservation) && (
                <Alert severity="warning">
                  <Typography variant="subtitle2" gutterBottom>
                    ⚠️ تحذير: الحساب غير مدفوع بالكامل!
                  </Typography>
                  <Typography variant="body2">
                    المبلغ الإجمالي: <strong>{selectedReservation.total_amount?.toLocaleString() || 0} </strong>
                  </Typography>
                  <Typography variant="body2">
                    المبلغ المدفوع: <strong>{selectedReservation.paid_amount?.toLocaleString() || 0} </strong>
                  </Typography>
                  <Typography variant="body2" color="error">
                    المبلغ المتبقي: <strong>{(selectedReservation.total_amount || 0) - (selectedReservation.paid_amount || 0)} </strong>
                  </Typography>
                </Alert>
              )}
              {customerBalance === 0 && isPaymentComplete(selectedReservation) && (() => {
                const today = dayjs().startOf('day')
                const scheduledOut = dayjs(selectedReservation.check_out_date).startOf('day')
                const remainingDays = scheduledOut.diff(today, 'day')
                return remainingDays <= 0 ? (
                  <Typography>هل أنت متأكد من تسجيل المغادرة؟</Typography>
                ) : null
              })()}
            </Stack>
          ) : (
            <Typography>هل أنت متأكد من تنفيذ هذا الإجراء؟ لا يمكن التراجع عن بعض العمليات.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>إلغاء</Button>
          <Button
            onClick={handleDialogAction}
            variant="contained"
            disabled={
              selectedReservation ? (
                actionLoading[selectedReservation.id] !== undefined
              ) : false
            }
            startIcon={selectedReservation && actionLoading[selectedReservation.id] ? <CircularProgress size={16} /> : undefined}
          >
            {selectedReservation && actionLoading[selectedReservation.id] ? 'جارٍ التنفيذ...' : 'تأكيد'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Occupied Rooms Error Dialog */}
      <Dialog
        open={openOccupiedRoomsDialog}
        onClose={() => {
          setOpenOccupiedRoomsDialog(false)
          setOccupiedRoomsError(null)
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          ⚠️ لا يمكن تسجيل الوصول
        </DialogTitle>
        <DialogContent>
          {occupiedRoomsError && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  بعض الغرف محجوزة حالياً من قبل حجوزات أخرى
                </Typography>
                <Typography variant="body2">
                  لا يمكن تسجيل الوصول للحجز #{occupiedRoomsError.reservationId} لأن بعض الغرف المخصصة له محجوزة من قبل حجوزات أخرى.
                </Typography>
              </Alert>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
                الغرف المحجوزة:
              </Typography>
              
              <Stack spacing={2}>
                {occupiedRoomsError.occupiedRooms.map((item: any, index: number) => (
                  <Paper key={index} sx={{ p: 2, bgcolor: 'error.light', border: '1px solid', borderColor: 'error.main' }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'error.dark' }}>
                        🏨 غرفة {item.room_number}
                      </Typography>
                      
                      <Box sx={{ pl: 2, borderRight: '2px solid', borderColor: 'error.main' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                          محجوزة من قبل:
                        </Typography>
                        <Typography variant="body2">
                          <strong>رقم الحجز:</strong> #{item.conflicting_reservation.id}
                        </Typography>
                        <Typography variant="body2">
                          <strong>العميل:</strong> {item.conflicting_reservation.customer_name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>تاريخ الوصول:</strong> {dayjs(item.conflicting_reservation.check_in_date).format('DD/MM/YYYY')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>تاريخ المغادرة:</strong> {dayjs(item.conflicting_reservation.check_out_date).format('DD/MM/YYYY')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>الحالة:</strong>{' '}
                          <Chip
                            label={statusConfig[item.conflicting_reservation.status as keyof typeof statusConfig]?.label || item.conflicting_reservation.status}
                            size="small"
                            color={statusConfig[item.conflicting_reservation.status as keyof typeof statusConfig]?.color as any || 'default'}
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
              
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  يرجى الانتظار حتى يتم تسجيل مغادرة الحجوزات السابقة أو اختيار غرف أخرى.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenOccupiedRoomsDialog(false)
              setOccupiedRoomsError(null)
            }}
            variant="contained"
            color="error"
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={openExtend} onClose={() => !extensionLoading && setOpenExtend(false)} maxWidth="xs" fullWidth>
        <DialogTitle>تمديد الحجز #{selectedReservation?.id}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              تاريخ المغادرة الحالي: <strong>{selectedReservation && formatDate(selectedReservation.check_out_date)}</strong>
            </Typography>
            
            <TextField
              label="تاريخ المغادرة الجديد"
              type="date"
              fullWidth
              value={newCheckOutDate}
              onChange={(e) => setNewCheckOutDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 
                min: selectedReservation ? dayjs(selectedReservation.check_out_date).add(1, 'day').format('YYYY-MM-DD') : '' 
              }}
            />

            {selectedReservation && newCheckOutDate && (
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">عدد الأيام الإضافية:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {dayjs(newCheckOutDate).diff(dayjs(selectedReservation.check_out_date), 'day')} يوم
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">التكلفة الإضافية:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {calculateExtensionPrice().toLocaleString()} SDG
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExtend(false)} disabled={extensionLoading}>إلغاء</Button>
          <Button 
            onClick={handleExtend} 
            variant="contained" 
            disabled={extensionLoading || !newCheckOutDate || dayjs(newCheckOutDate).isBefore(dayjs(selectedReservation?.check_out_date).add(1, 'day'))}
            startIcon={extensionLoading ? <CircularProgress size={16} /> : null}
          >
            تأكيد التمديد
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={openService} onClose={() => !serviceLoading && setOpenService(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة خدمة للحجز #{selectedReservation?.id}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth required>
              <InputLabel>الغرفة</InputLabel>
              <Select
                value={serviceForm.room_id}
                label="الغرفة"
                onChange={(e) => setServiceForm({ ...serviceForm, room_id: e.target.value })}
              >
                {selectedReservation?.rooms?.map(room => (
                  <MenuItem key={room.id} value={room.id.toString()}>
                    غرفة {room.number}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>نوع الخدمة</InputLabel>
              <Select
                value={serviceForm.service_id}
                label="نوع الخدمة"
                onChange={(e) => setServiceForm({ ...serviceForm, service_id: e.target.value })}
              >
                <MenuItem value="" disabled>اختر خدمة</MenuItem>
                {availableServices.map(svc => (
                  <MenuItem key={svc.id} value={svc.id.toString()}>
                    {svc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="المبلغ (SDG)"
              type="number"
              fullWidth
              required
              inputProps={{ min: 0, step: 'any' }}
              value={serviceForm.amount}
              onChange={(e) => setServiceForm({ ...serviceForm, amount: e.target.value })}
            />

            <TextField
              label="ملاحظات"
              multiline
              rows={3}
              fullWidth
              value={serviceForm.notes}
              onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenService(false)} disabled={serviceLoading}>إلغاء</Button>
          <Button 
            onClick={handleServiceSubmit} 
            variant="contained" 
            disabled={serviceLoading || !serviceForm.room_id || !serviceForm.service_id || !serviceForm.amount}
            startIcon={serviceLoading ? <CircularProgress size={16} /> : null}
          >
            إضافة الخدمة
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
