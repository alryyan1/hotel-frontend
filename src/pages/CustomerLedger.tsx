import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft, FileText, Calendar, Users, DollarSign } from 'lucide-react'
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

interface LedgerEntry {
  reservationId: number
  date: string
  description: string
  rooms: string
  days: number
  debit: number
  credit: number
  balance: number
}

export default function CustomerLedger() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [roomTypes, setRoomTypes] = useState<Record<number, { base_price: number; name: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchCustomer()
      fetchRoomTypes()
      fetchReservations()
    }
  }, [id])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get(`/customers/${id}`)
      setCustomer(data?.data || data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في جلب بيانات العميل')
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
      setError(err?.response?.data?.message || 'فشل في جلب الحجوزات')
    } finally {
      setLoading(false)
    }
  }

  const calculateLedger = useCallback((reservationsData: Reservation[]) => {
    const entries: LedgerEntry[] = []
    let runningBalance = 0

    // Sort reservations by check_in_date
    const sortedReservations = [...reservationsData].sort(
      (a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime()
    )

    sortedReservations.forEach((reservation) => {
      const checkIn = dayjs(reservation.check_in_date)
      const checkOut = dayjs(reservation.check_out_date)
      const days = checkOut.diff(checkIn, 'day') || 1 // At least 1 day

      let totalDebit = 0
      const roomNames: string[] = []

      reservation.rooms.forEach((room) => {
        // Try to get base_price from room.type first, then from roomTypes map
        const basePrice = room.type?.base_price || roomTypes[room.room_type_id]?.base_price || 0
        const roomDebit = days * basePrice
        totalDebit += roomDebit
        roomNames.push(`غرفة ${room.number}`)
      })

      runningBalance += totalDebit

      entries.push({
        reservationId: reservation.id,
        date: dayjs(reservation.check_in_date).format('DD/MM/YYYY'),
        description: `حجز #${reservation.id} - ${roomNames.join(', ')}`,
        rooms: roomNames.join(', '),
        days,
        debit: totalDebit,
        credit: 0,
        balance: runningBalance
      })
    })

    setLedgerEntries(entries)
  }, [roomTypes])

  useEffect(() => {
    if (reservations.length > 0 && Object.keys(roomTypes).length > 0) {
      calculateLedger(reservations)
    }
  }, [reservations, roomTypes, calculateLedger])

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
      <PageHeader
        title="كشف حساب العميل"
        description={customer ? `كشف حساب ${customer.name}` : 'جاري التحميل...'}
        icon="📊"
      />

      {error && (
        <Alert variant="destructive" className="shadow-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/customers')}
          className="shadow-md"
        >
          <ArrowLeft className="size-4 mr-2" />
          العودة إلى العملاء
        </Button>
      </div>

      {customer && (
        <Card className="border-border/40 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              بيانات العميل
            </CardTitle>
          </CardHeader>
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
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            كشف الحساب
          </CardTitle>
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
                    <TableHead className="text-center">الغرف</TableHead>
                    <TableHead className="text-center">عدد الأيام</TableHead>
                    <TableHead className="text-center">مدين</TableHead>
                    <TableHead className="text-center">دائن</TableHead>
                    <TableHead className="text-center">الرصيد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry, index) => (
                    <TableRow key={entry.reservationId}>
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
                        <Badge variant="outline">{entry.rooms}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{entry.days}</TableCell>
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
    </div>
  )
}
