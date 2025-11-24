import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, UserCheck, UserX, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'

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
  pending: { label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  confirmed: { label: 'مؤكد', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  checked_in: { label: 'تم تسجيل الوصول', color: 'bg-green-100 text-green-800 border-green-200', icon: UserCheck },
  checked_out: { label: 'تم تسجيل المغادرة', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: UserX },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
}

export default function ReservationsList() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<number, string>>({}) // Track loading per reservation: { reservationId: 'actionType' }
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [openDetails, setOpenDetails] = useState(false)
  const [openConfirm, setOpenConfirm] = useState(false)
  const [actionType, setActionType] = useState<'confirm' | 'checkin' | 'checkout' | 'cancel' | 'delete'>('confirm')

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

  const handleAction = async (reservation: Reservation, action: 'confirm' | 'checkin' | 'checkout' | 'cancel' | 'delete', skipDialog: boolean = false) => {
    // Show dialog for checkout and cancel actions
    if (!skipDialog && (action === 'checkout' || action === 'cancel' || action === 'delete')) {
      setSelectedReservation(reservation)
      setActionType(action)
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
          
          // Handle SMS result
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
          // Remove reservation from list
          setReservations(prev => prev.filter(r => r.id !== reservation.id))
          setOpenConfirm(false)
          setSelectedReservation(null)
          return
      }
      
      // Update reservation in list
      if (updatedReservation) {
        setReservations(prev => prev.map(r => r.id === reservation.id ? updatedReservation! : r))
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

  const getStatusBadge = (status: Reservation['status']) => {
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Badge className={`${config.color} border`}>
        <Icon className="size-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY')
  }

  const formatDateWithTime = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY HH:mm')
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
          size="sm"
          variant="outline"
          onClick={() => handleAction(reservation, 'confirm', true)}
          disabled={isLoading}
          className="text-blue-600 hover:text-blue-700"
        >
          {currentAction === 'confirm' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'تأكيد'
          )}
        </Button>
      )
    }
    
    if (reservation.status === 'confirmed') {
      buttons.push(
        <Button
          key="checkin"
          size="sm"
          variant="outline"
          onClick={() => handleAction(reservation, 'checkin', true)}
          disabled={isLoading}
          className="text-green-600 hover:text-green-700"
        >
          {currentAction === 'checkin' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'تسجيل الوصول'
          )}
        </Button>
      )
    }
    
    if (reservation.status === 'checked_in') {
      buttons.push(
        <Button
          key="checkout"
          size="sm"
          variant="outline"
          onClick={() => handleAction(reservation, 'checkout', false)}
          disabled={isLoading}
          className="text-gray-600 hover:text-gray-700"
        >
          {currentAction === 'checkout' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'تسجيل المغادرة'
          )}
        </Button>
      )
    }
    
    if (!['checked_in', 'checked_out'].includes(reservation.status)) {
      buttons.push(
        <Button
          key="cancel"
          size="sm"
          variant="outline"
          onClick={() => handleAction(reservation, 'cancel', false)}
          disabled={isLoading}
          className="text-red-600 hover:text-red-700"
        >
          {currentAction === 'cancel' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'إلغاء'
          )}
        </Button>
      )
    }
    
    return buttons
  }

  return (
    <div className="space-y-6">
      {/* <PageHeader
        title="قائمة الحجوزات"
        description="عرض وإدارة جميع الحجوزات"
        icon="📋"
      /> */}

      <Card className="border-border/40 shadow-lg">
    
        <CardContent>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-8">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder="البحث بالعميل، الهاتف،   أو رقم الغرفة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="فلترة بالحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="checked_in">تم تسجيل الوصول</SelectItem>
                  <SelectItem value="checked_out">تم تسجيل المغادرة</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-lg">
        <CardHeader>
          <CardTitle>الحجوزات ({filteredReservations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && reservations.length === 0 ? (
            <div className="text-center py-8">جارٍ التحميل...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-center'>رقم الحجز</TableHead>
                    <TableHead className='text-center'>العميل</TableHead>
                    <TableHead className='text-center'>الغرف</TableHead>
                    <TableHead className='text-center'>تاريخ الوصول</TableHead>
                    <TableHead className='text-center'>تاريخ المغادرة</TableHead>
                    <TableHead className='text-center'>عدد الضيوف</TableHead>
                    <TableHead className='text-center'>الحالة</TableHead>
                    <TableHead className='text-center'>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        لا توجد حجوزات
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium text-center">#{reservation.id}</TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">{reservation.customer?.name || 'غير محدد'}</div>
                          <div className="text-sm text-muted-foreground">
                            {reservation.customer?.phone || reservation.customer?.email || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap gap-1">
                          {reservation.rooms.map((room) => (
                            <Badge key={room.id} variant="outline" className="text-xs">
                              غرفة {room.number}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">{formatDate(reservation.check_in_date)}</div>
                          <div className="text-xs text-muted-foreground">{getRelativeDate(reservation.check_in_date)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">{formatDate(reservation.check_out_date)}</div>
                          <div className="text-xs text-muted-foreground">{getRelativeDate(reservation.check_out_date)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{reservation.guest_count}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(reservation.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReservation(reservation)
                              setOpenDetails(true)
                            }}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {getActionButtons(reservation)}
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الحجز #{selectedReservation?.id}</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">العميل</label>
                  <p className="font-medium">{selectedReservation.customer?.name || 'غير محدد'}</p>
                  <p className="text-sm text-muted-foreground">{selectedReservation.customer?.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                  <div className="mt-1">{getStatusBadge(selectedReservation.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">تاريخ الوصول</label>
                  <p className="font-medium">{formatDate(selectedReservation.check_in_date)}</p>
                  <p className="text-sm text-muted-foreground">{getRelativeDate(selectedReservation.check_in_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">تاريخ المغادرة</label>
                  <p className="font-medium">{formatDate(selectedReservation.check_out_date)}</p>
                  <p className="text-sm text-muted-foreground">{getRelativeDate(selectedReservation.check_out_date)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">الغرف</label>
                <div className="mt-2 space-y-2">
                  {selectedReservation.rooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">غرفة {room.number}</p>
                        <p className="text-sm text-muted-foreground">
                          {room.floor ? `الدور ${room.floor.number}` : 'الدور غير محدد'} • {room.type?.name || 'نوع غير محدد'} • {room.type?.capacity || 0} ضيوف
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedReservation.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ملاحظات</label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedReservation.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDetails(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد العملية</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من تنفيذ هذا الإجراء؟ لا يمكن التراجع عن بعض العمليات.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenConfirm(false)}>إلغاء</Button>
            <Button onClick={handleDialogAction} disabled={selectedReservation ? actionLoading[selectedReservation.id] !== undefined : false}>
              {selectedReservation && actionLoading[selectedReservation.id] ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  جارٍ التنفيذ...
                </>
              ) : (
                'تأكيد'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
