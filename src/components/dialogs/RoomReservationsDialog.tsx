import { useState, useEffect } from 'react'
import apiClient from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import dayjs from 'dayjs'
import { CheckCircle, Clock, UserCheck } from 'lucide-react'

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
  customer: {
    id: number
    name: string
    phone?: string
    email?: string
  }
  rooms: Array<{
    id: number
    number: string
  }>
}

interface RoomReservationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: number | null
  roomNumber: string
}

const statusConfig = {
  pending: { label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  confirmed: { label: 'مؤكد', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  checked_in: { label: 'تم تسجيل الوصول', color: 'bg-green-100 text-green-800 border-green-200', icon: UserCheck },
}

export default function RoomReservationsDialog({
  open,
  onOpenChange,
  roomId,
  roomNumber
}: RoomReservationsDialogProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && roomId) {
      fetchReservations()
    } else {
      setReservations([])
      setError('')
    }
  }, [open, roomId])

  const fetchReservations = async () => {
    if (!roomId) return
    
    try {
      setLoading(true)
      setError('')
      const { data } = await apiClient.get('/reservations')
      const allReservations = data?.data || data
      
      // Filter for active reservations for this room
      // Active statuses: 'pending', 'confirmed', 'checked_in'
      const activeStatuses = ['pending', 'confirmed', 'checked_in']
      const roomReservations = allReservations
        .filter((reservation: Reservation) => 
          activeStatuses.includes(reservation.status) &&
          reservation.rooms.some(room => room.id === roomId)
        )
        .sort((a: Reservation, b: Reservation) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ) // Descending order (newest first)
      
      setReservations(roomReservations)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في جلب الحجوزات')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY')
  }

  const getDaysRemaining = (checkOutDate: string): number => {
    const today = dayjs().startOf('day')
    const checkOut = dayjs(checkOutDate).startOf('day')
    const days = checkOut.diff(today, 'day')
    return days >= 0 ? days : 0
  }

  const getStatusBadge = (status: Reservation['status']) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null
    const Icon = config.icon
    return (
      <Badge className={`${config.color} border`}>
        <Icon className="size-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            الحجوزات النشطة - غرفة {roomNumber}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8">جارٍ التحميل...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>لا توجد حجوزات نشطة لهذه الغرفة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">رقم الحجز</TableHead>
                  <TableHead className="text-center">العميل</TableHead>
                  <TableHead className="text-center">تاريخ الوصول</TableHead>
                  <TableHead className="text-center">تاريخ المغادرة</TableHead>
                  <TableHead className="text-center">عدد الضيوف</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">الأيام المتبقية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium text-center">#{reservation.id}</TableCell>
                    <TableCell className="text-center">
                      <div>
                        <div className="font-medium">{reservation.customer.name}</div>
                        {reservation.customer.phone && (
                          <div className="text-sm text-muted-foreground">
                            {reservation.customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{formatDate(reservation.check_in_date)}</TableCell>
                    <TableCell className="text-center">{formatDate(reservation.check_out_date)}</TableCell>
                    <TableCell className="text-center">{reservation.guest_count}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(reservation.status)}</TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const daysRemaining = getDaysRemaining(reservation.check_out_date)
                        return (
                          <Badge variant="outline" className={daysRemaining <= 1 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                            {daysRemaining === 0 ? 'اليوم' : daysRemaining === 1 ? 'يوم واحد' : `${daysRemaining} أيام`}
                          </Badge>
                        )
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11">
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

