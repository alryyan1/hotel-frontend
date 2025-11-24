import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft, FileText, Calendar, Users, DollarSign, Plus, CreditCard, Download } from 'lucide-react'
import dayjs from 'dayjs'
import CreatePaymentDialog from '@/components/dialogs/CreatePaymentDialog'

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
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `customer_ledger_${id}_${dayjs().format('YYYY-MM-DD')}.pdf`
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('تم تصدير الكشف بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في تصدير الكشف')
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/customers')}
          className="shadow-md"
        >
          <ArrowLeft className="size-4 mr-2" />
          العودة إلى العملاء
        </Button>
        {customer && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportPdf}
              className="shadow-md"
              disabled={loading || ledgerEntries.length === 0}
            >
              <Download className="size-4 mr-2" />
              تصدير PDF
            </Button>
            <Button
              onClick={() => setOpenPaymentDialog(true)}
              className="shadow-md"
            >
              <Plus className="size-4 mr-2" />
              إضافة دفعة
            </Button>
          </div>
        )}
      </div>

      {customer && (
        <Card className="border-border/40 shadow-lg">
         
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">الاسم</p>
                <p className="font-semibold text-lg">{customer.name}</p>
              </div>
              {customer.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-semibold">{customer.phone}</p>
                </div>
              )}
              {customer.national_id && (
                <div>
                  <p className="text-sm text-muted-foreground">الرقم الوطني</p>
                  <p className="font-semibold">{customer.national_id}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/40 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              كشف الحساب
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جارٍ التحميل...</div>
          ) : ledgerEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="size-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد حركات حسابية</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">التاريخ</TableHead>
                    <TableHead className="text-center">الوصف</TableHead>
                    <TableHead className="text-center">الغرف / طريقة الدفع</TableHead>
                    <TableHead className="text-center">عدد الأيام</TableHead>
                    <TableHead className="text-center">مدين</TableHead>
                    <TableHead className="text-center">دائن</TableHead>
                    <TableHead className="text-center">الرصيد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry, index) => (
                    <TableRow key={`${entry.type}-${entry.id}`}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Calendar className="size-3 text-muted-foreground" />
                          {entry.date}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.type === 'reservation' ? (
                          <Badge variant="outline">{entry.rooms}</Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <CreditCard className="size-3" />
                            {entry.paymentMethod}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.days || '-'}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-green-700">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-red-700">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {formatCurrency(entry.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={4} className="text-center">
                      الإجمالي
                    </TableCell>
                    <TableCell className="text-center text-green-700">
                      {formatCurrency(totalDebit)}
                    </TableCell>
                    <TableCell className="text-center text-red-700">
                      {formatCurrency(totalCredit)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatCurrency(finalBalance)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {ledgerEntries.length > 0 && (
        <Card className="border-border/40 shadow-lg bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="size-5 text-primary" />
                <span className="font-semibold text-lg">الرصيد النهائي:</span>
              </div>
              <span className="font-bold text-2xl text-primary">
                {formatCurrency(finalBalance)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <CreatePaymentDialog
        open={openPaymentDialog}
        onOpenChange={setOpenPaymentDialog}
        paymentForm={paymentForm}
        onPaymentFormChange={setPaymentForm}
        onCreatePayment={handleCreatePayment}
        loading={loading}
      />
    </div>
  )
}
