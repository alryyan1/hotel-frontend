import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../api/axios'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  ArrowBack as ArrowLeftIcon,
  Description as FileTextIcon,
  CalendarToday as CalendarIcon,
  CreditCard as CreditCardIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  AttachMoney as DollarSignIcon,
} from '@mui/icons-material'
import { toast } from 'sonner'
import dayjs from 'dayjs'

interface Reservation {
  id: number
  customer_id: number
  check_in_date: string
  check_out_date: string
  guest_count: number
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  rooms: Array<{
    id: number
    number: string
    room_type_id: number
    type?: {
      id: number
      name: string
      base_price: number
    }
  }>
}

interface Customer {
  id: number
  name: string
  phone?: string
  national_id?: string
  address?: string
}

interface Payment {
  id: number
  customer_id: number
  reservation_id?: number
  reference: string
  method: 'cash' | 'bankak' | 'Ocash' | 'fawri'
  amount: number
  currency: string
  status: string
  notes?: string
  created_at: string
}

interface LedgerEntry {
  id: number
  type: 'reservation' | 'payment'
  date: string
  description: string
  rooms?: string
  days?: number
  paymentMethod?: string
  debit: number
  credit: number
  balance: number
}

export default function CustomerLedger() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [roomTypes, setRoomTypes] = useState<Record<number, { base_price: number; name: string }>>({})
  const [loading, setLoading] = useState(false)
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    method: '',
    amount: '',
    notes: '',
    reference: ''
  })

  useEffect(() => {
    if (id) {
      fetchCustomer()
      fetchRoomTypes()
      fetchReservations()
      fetchPayments()
    }
  }, [id])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get(`/customers/${id}`)
      setCustomer(data?.data || data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في جلب بيانات العميل')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomTypes = async () => {
    try {
      const { data } = await apiClient.get('/room-types')
      const typesMap: Record<number, { base_price: number; name: string }> = {}
      const types = Array.isArray(data) ? data : (data?.data || [])
      types.forEach((type: any) => {
        typesMap[type.id] = {
          base_price: type.base_price || 0,
          name: type.name || ''
        }
      })
      setRoomTypes(typesMap)
    } catch (err) {
      console.error('Failed to fetch room types', err)
    }
  }

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/reservations')
      const allReservations = data?.data || data
      // Filter reservations for this customer
      const customerReservations = allReservations.filter(
        (r: Reservation) => r.customer_id === Number(id)
      )
      setReservations(customerReservations)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في جلب الحجوزات')
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const { data } = await apiClient.get(`/customers/${id}/payments`)
      setPayments(Array.isArray(data) ? data : (data?.data || []))
    } catch (err: any) {
      console.error('Failed to fetch payments', err)
    }
  }

  const calculateLedger = useCallback((reservationsData: Reservation[], paymentsData: Payment[]) => {
    const entries: LedgerEntry[] = []
    let runningBalance = 0

    // Combine reservations and payments, then sort by date
    const allEntries: Array<{ type: 'reservation' | 'payment', data: Reservation | Payment, date: string }> = []

    // Add reservations
    reservationsData.forEach((reservation) => {
      allEntries.push({
        type: 'reservation',
        data: reservation,
        date: reservation.check_in_date
      })
    })

    // Add payments
    paymentsData.forEach((payment) => {
      allEntries.push({
        type: 'payment',
        data: payment,
        date: payment.created_at
      })
    })

    // Sort by date
    allEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    allEntries.forEach((entry) => {
      if (entry.type === 'reservation') {
        const reservation = entry.data as Reservation
        const checkIn = dayjs(reservation.check_in_date)
        const checkOut = dayjs(reservation.check_out_date)
        const days = checkOut.diff(checkIn, 'day') || 1

        let totalDebit = 0
        const roomNames: string[] = []

        reservation.rooms.forEach((room) => {
          const basePrice = room.type?.base_price || roomTypes[room.room_type_id]?.base_price || 0
          const roomDebit = days * basePrice
          totalDebit += roomDebit
          roomNames.push(`غرفة ${room.number}`)
        })

        runningBalance += totalDebit

        entries.push({
          id: reservation.id,
          type: 'reservation',
          date: dayjs(reservation.check_in_date).format('DD/MM/YYYY'),
          description: `حجز #${reservation.id} - ${roomNames.join(', ')}`,
          rooms: roomNames.join(', '),
          days,
          debit: totalDebit,
          credit: 0,
          balance: runningBalance
        })
      } else {
        const payment = entry.data as Payment
        runningBalance -= payment.amount

        const methodLabels: Record<string, string> = {
          cash: 'نقدي',
          bankak: 'بنكاك',
          Ocash: 'أوكاش',
          fawri: 'فوري'
        }

        entries.push({
          id: payment.id,
          type: 'payment',
          date: dayjs(payment.created_at).format('DD/MM/YYYY'),
          description: `دفعة - ${payment.reference}`,
          paymentMethod: methodLabels[payment.method] || payment.method,
          debit: 0,
          credit: payment.amount,
          balance: runningBalance
        })
      }
    })

    setLedgerEntries(entries)
  }, [roomTypes])

  useEffect(() => {
    if (Object.keys(roomTypes).length > 0) {
      calculateLedger(reservations, payments)
    }
  }, [reservations, payments, roomTypes, calculateLedger])

  const handleCreatePayment = async () => {
    if (!id || !paymentForm.method || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      setLoading(true)
      
      const payload: any = {
        customer_id: Number(id),
        method: paymentForm.method,
        amount: parseFloat(paymentForm.amount),
      }

      if (paymentForm.reference) {
        payload.reference = paymentForm.reference
      }

      if (paymentForm.notes) {
        payload.notes = paymentForm.notes
      }

      await apiClient.post('/payments', payload)
      toast.success('تم إضافة الدفعة بنجاح')
      setOpenPaymentDialog(false)
      setPaymentForm({ method: '', amount: '', notes: '', reference: '' })
      await fetchPayments()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في إضافة الدفعة')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPdf = async () => {
    if (!id) return

    try {
      setLoading(true)
      
      const response = await apiClient.get(`/customers/${id}/ledger/pdf`, {
        responseType: 'blob'
      })

      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'application/pdf' })
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob)
      
      // Open PDF in a new tab
      const newWindow = window.open(url, '_blank')
      
      if (!newWindow) {
        toast.error('يرجى السماح بالنوافذ المنبثقة لعرض PDF')
        window.URL.revokeObjectURL(url)
        return
      }
      
      // Clean up the URL after the window is closed or after a delay
      newWindow.addEventListener('load', () => {
        // Revoke URL after a delay to ensure the PDF loads
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 1000)
      })
      
      toast.success('تم فتح الكشف في نافذة جديدة')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في فتح الكشف')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount)
  }

  const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0)
  const finalBalance = totalDebit - totalCredit

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button
          variant="outlined"
          startIcon={<ArrowLeftIcon />}
          onClick={() => navigate('/customers')}
          sx={{ boxShadow: 2 }}
        >
          العودة إلى العملاء
        </Button>
        {customer && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportPdf}
              disabled={loading || ledgerEntries.length === 0}
              sx={{ boxShadow: 2 }}
            >
              عرض PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenPaymentDialog(true)}
              sx={{ boxShadow: 2 }}
            >
              إضافة دفعة
            </Button>
          </Stack>
        )}
      </Stack>

      {customer && (
        <Card sx={{ boxShadow: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  الاسم
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {customer.name}
                </Typography>
              </Grid>
              {customer.phone && (
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    الهاتف
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {customer.phone}
                  </Typography>
                </Grid>
              )}
              {customer.national_id && (
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    الرقم الوطني
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {customer.national_id}
                  </Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  الرصيد النهائي
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {formatCurrency(finalBalance)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <FileTextIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                كشف الحساب
              </Typography>
            </Stack>
          }
        />
        <CardContent>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                جارٍ التحميل...
              </Typography>
            </Box>
          ) : ledgerEntries.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FileTextIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} color="action" />
              <Typography variant="body1" color="text.secondary">
                لا توجد حركات حسابية
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>التاريخ</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>الوصف</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>الغرف / طريقة الدفع</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>عدد الأيام</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>مدين</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>دائن</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>الرصيد</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledgerEntries.map((entry, index) => (
                    <TableRow key={`${entry.type}-${entry.id}`}>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                          <CalendarIcon sx={{ fontSize: 14 }} color="action" />
                          {entry.date}
                        </Stack>
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 500 }}>
                        {entry.description}
                      </TableCell>
                      <TableCell align="center">
                        {entry.type === 'reservation' ? (
                          <Chip label={entry.rooms} variant="outlined" size="small" />
                        ) : (
                          <Chip
                            icon={<CreditCardIcon sx={{ fontSize: 14 }} />}
                            label={entry.paymentMethod}
                            color="secondary"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {entry.days || '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: 'error.main' }}>
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(entry.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>
                    <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold' }}>
                      الإجمالي
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {formatCurrency(totalDebit)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      {formatCurrency(totalCredit)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(finalBalance)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>


      <Dialog 
        open={openPaymentDialog} 
        onClose={() => setOpenPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>إضافة دفعة</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            تسجيل دفعة جديدة للعميل
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>طريقة الدفع</InputLabel>
                <Select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  label="طريقة الدفع"
                >
                  <MenuItem value="cash">نقدي</MenuItem>
                  <MenuItem value="bankak">بنكاك</MenuItem>
                  <MenuItem value="Ocash">أوكاش</MenuItem>
                  <MenuItem value="fawri">فوري</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="المبلغ"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                inputProps={{ step: '0.01', min: '0.01' }}
                placeholder="0.00"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="الرقم المرجعي (اختياري)"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                placeholder="سيتم إنشاؤه تلقائياً"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="ملاحظات (اختياري)"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)} variant="outlined">
            إلغاء
          </Button>
          <Button 
            onClick={handleCreatePayment} 
            disabled={loading || !paymentForm.method || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
            variant="contained"
          >
            {loading ? <CircularProgress size={16} /> : 'حفظ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
