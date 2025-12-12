import { useEffect, useState } from 'react'
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
    }
  }>
}

const statusConfig = {
  pending: { label: 'في الانتظار', color: 'warning', icon: AccessTimeIcon },
  confirmed: { label: 'مؤكد', color: 'info', icon: CheckCircleIcon },
  checked_in: { label: 'تم تسجيل الوصول', color: 'success', icon: PersonCheckIcon },
  checked_out: { label: 'تم تسجيل المغادرة', color: 'default', icon: PersonOffIcon },
  cancelled: { label: 'ملغي', color: 'error', icon: CancelIcon },
}

export default function ReservationsList() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<number, string>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [openDetails, setOpenDetails] = useState(false)
  const [openConfirm, setOpenConfirm] = useState(false)
  const [actionType, setActionType] = useState<'confirm' | 'checkin' | 'checkout' | 'cancel' | 'delete'>('confirm')
  const [customerBalance, setCustomerBalance] = useState<number | null>(null)

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/reservations')
      setReservations(data.data || data)
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
          const checkinData = await apiClient.post(`/reservations/${reservation.id}/check-in`)
          updatedReservation = checkinData.data
          toast.success('تم تسجيل الوصول بنجاح')
          break
        case 'checkout':
          // Check customer balance before checkout
          const customerBalance = await getCustomerBalance(reservation.customer_id)
          if (customerBalance !== 0) {
            toast.error(
              `لا يمكن تسجيل المغادرة: يجب تسويه الحسابات    (${customerBalance.toLocaleString()} ريال)`,
              { 
                position: 'top-right',
                duration: 7000 
              }
            )
            setActionLoading(prev => {
              const newState = { ...prev }
              delete newState[reservation.id]
              return newState
            })
            return
          }
          
          // Show warning toast if payment is not complete for this reservation
          if (!isPaymentComplete(reservation)) {
            const totalAmount = reservation.total_amount || 0
            const paidAmount = reservation.paid_amount || 0
            const remaining = totalAmount - paidAmount
            toast.warning(
              `تم تسجيل المغادرة مع تحذير: المبلغ المتبقي ${remaining.toLocaleString()} ريال`,
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
    if (actionType === 'checkout') {
      const customerBalance = await getCustomerBalance(selectedReservation.customer_id)
      if (customerBalance !== 0) {
        toast.error(
          `لا يمكن تسجيل المغادرة: يجب تسويه الحسابات    (${customerBalance.toLocaleString()} ريال)`,
          { 
            position: 'top-right',
            duration: 7000 
          }
        )
        setOpenConfirm(false)
        return
      }
    }
    
    await handleAction(selectedReservation, actionType, true)
  }

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      (reservation.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (reservation.customer?.phone?.includes(searchTerm) || false) ||
      (reservation.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (reservation.rooms?.some(room => room.number.includes(searchTerm)) || false)
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

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
    const buttons = []
    const isLoading = actionLoading[reservation.id] !== undefined
    const currentAction = actionLoading[reservation.id]
    
    if (reservation.status === 'pending') {
      buttons.push(
        <Button
          key="confirm"
          size="small"
          variant="outlined"
          onClick={() => handleAction(reservation, 'confirm', true)}
          disabled={isLoading}
          color="info"
          startIcon={isLoading && currentAction === 'confirm' ? <CircularProgress size={16} /> : undefined}
        >
          تأكيد
        </Button>
      )
    }
    
    if (reservation.status === 'confirmed') {
      buttons.push(
        <Button
          key="checkin"
          size="small"
          variant="outlined"
          onClick={() => handleAction(reservation, 'checkin', true)}
          disabled={isLoading}
          color="success"
          startIcon={isLoading && currentAction === 'checkin' ? <CircularProgress size={16} /> : undefined}
        >
          تسجيل الوصول
        </Button>
      )
    }
    
    if (reservation.status === 'checked_in') {
      buttons.push(
        <Button
          key="checkout"
          size="small"
          variant="outlined"
          onClick={() => handleAction(reservation, 'checkout', false)}
          disabled={isLoading}
          color="default"
          startIcon={isLoading && currentAction === 'checkout' ? <CircularProgress size={16} /> : undefined}
        >
          تسجيل المغادرة
        </Button>
      )
    }
    
    if (!['checked_in', 'checked_out'].includes(reservation.status)) {
      buttons.push(
        <Button
          key="cancel"
          size="small"
          variant="outlined"
          onClick={() => handleAction(reservation, 'cancel', false)}
          disabled={isLoading}
          color="error"
          startIcon={isLoading && currentAction === 'cancel' ? <CircularProgress size={16} /> : undefined}
        >
          إلغاء
        </Button>
      )
    }
    
    return buttons
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Search and Filter Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="البحث بالعميل، الهاتف، أو رقم الغرفة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
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
            </Grid>
          </Grid>
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
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedReservation(reservation)
                                setOpenDetails(true)
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
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
              {customerBalance !== null && customerBalance !== 0 && (
                <Alert severity="error">
                  <Typography variant="subtitle2" gutterBottom>
                    ❌ خطأ: لا يمكن تسجيل المغادرة!
                  </Typography>
                  <Typography variant="body2">
                يجب تسويه الحسابات اولا <strong>{customerBalance.toLocaleString()} </strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    يرجى تسوية رصيد العميل أولاً قبل تسجيل المغادرة.
                  </Typography>
                </Alert>
              )}
              {customerBalance === 0 && !isPaymentComplete(selectedReservation) && (
                <Alert severity="warning">
                  <Typography variant="subtitle2" gutterBottom>
                    ⚠️ تحذير: الحساب غير مدفوع بالكامل!
                  </Typography>
                  <Typography variant="body2">
                    المبلغ الإجمالي: <strong>{selectedReservation.total_amount?.toLocaleString() || 0} ريال</strong>
                  </Typography>
                  <Typography variant="body2">
                    المبلغ المدفوع: <strong>{selectedReservation.paid_amount?.toLocaleString() || 0} ريال</strong>
                  </Typography>
                  <Typography variant="body2" color="error">
                    المبلغ المتبقي: <strong>{(selectedReservation.total_amount || 0) - (selectedReservation.paid_amount || 0)} ريال</strong>
                  </Typography>
                </Alert>
              )}
              {customerBalance === 0 && isPaymentComplete(selectedReservation) && (
                <Typography>هل أنت متأكد من تسجيل المغادرة؟</Typography>
              )}
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
                actionLoading[selectedReservation.id] !== undefined || 
                (actionType === 'checkout' && customerBalance !== null && customerBalance !== 0)
              ) : false
            }
            startIcon={selectedReservation && actionLoading[selectedReservation.id] ? <CircularProgress size={16} /> : undefined}
          >
            {selectedReservation && actionLoading[selectedReservation.id] ? 'جارٍ التنفيذ...' : 'تأكيد'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
