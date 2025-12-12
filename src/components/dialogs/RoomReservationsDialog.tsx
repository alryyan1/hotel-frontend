import { useState, useEffect } from 'react'
import apiClient from '@/api/axios'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  AccessTime as ClockIcon,
  HowToReg as UserCheckIcon,
} from '@mui/icons-material'
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
  pending: { label: 'في الانتظار', color: 'warning', icon: ClockIcon },
  confirmed: { label: 'مؤكد', color: 'info', icon: CheckCircleIcon },
  checked_in: { label: 'تم تسجيل الوصول', color: 'success', icon: UserCheckIcon },
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
      <Chip
        icon={<Icon sx={{ fontSize: 12 }} />}
        label={config.label}
        color={config.color as any}
        size="small"
        variant="outlined"
      />
    )
  }

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
        الحجوزات النشطة - غرفة {roomNumber}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : reservations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">لا توجد حجوزات نشطة لهذه الغرفة</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">رقم الحجز</TableCell>
                  <TableCell align="center">العميل</TableCell>
                  <TableCell align="center">تاريخ الوصول</TableCell>
                  <TableCell align="center">تاريخ المغادرة</TableCell>
                  <TableCell align="center">عدد الضيوف</TableCell>
                  <TableCell align="center">الحالة</TableCell>
                  <TableCell align="center">الأيام المتبقية</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reservations.map((reservation) => {
                  const daysRemaining = getDaysRemaining(reservation.check_out_date)
                  return (
                    <TableRow key={reservation.id}>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        #{reservation.id}
                      </TableCell>
                      <TableCell align="center">
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {reservation.customer.name}
                          </Typography>
                          {reservation.customer.phone && (
                            <Typography variant="caption" color="text.secondary">
                              {reservation.customer.phone}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{formatDate(reservation.check_in_date)}</TableCell>
                      <TableCell align="center">{formatDate(reservation.check_out_date)}</TableCell>
                      <TableCell align="center">{reservation.guest_count}</TableCell>
                      <TableCell align="center">{getStatusBadge(reservation.status)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={daysRemaining === 0 ? 'اليوم' : daysRemaining === 1 ? 'يوم واحد' : `${daysRemaining} أيام`}
                          size="small"
                          variant="outlined"
                          sx={{
                            bgcolor: daysRemaining <= 1 ? 'orange.50' : 'blue.50',
                            color: daysRemaining <= 1 ? 'orange.700' : 'blue.700',
                            borderColor: daysRemaining <= 1 ? 'orange.200' : 'blue.200',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
          <Button variant="outlined" onClick={() => onOpenChange(false)} sx={{ height: 44 }}>
            إغلاق
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

