import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import apiClient from '../api/axios'
import {
  Table,
  Card,
  Button,
  Tag,
  Modal,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Space,
  Typography,
  Alert,
  Tabs,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  EditOutlined,
  CalendarOutlined,
  DownloadOutlined,
  CustomerServiceOutlined,
  SwapOutlined,
  WarningOutlined,
  WhatsAppOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { toast } from 'sonner'

const { Text, Title } = Typography
const { TextArea } = Input

interface Reservation {
  id: number
  customer_id: number
  check_in_date: string
  check_out_date: string
  currency: 'USD' | 'SDG'
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  total_amount?: number
  paid_amount?: number
  checkout_reminder_sent_at?: string | null
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
    price_usd: number
    price_sdg: number
    type?: {
      name: string
    }
    pivot?: {
      rate: number
      currency: string
    }
  }>
  transactions?: Array<{
    id: number
    type: string
    amount: number
    currency: string
    transaction_date: string
    notes?: string
    room_id?: number
    rate?: number
    nights?: number
    check_in_date?: string
    check_out_date?: string
  }>
}

interface Customer {
  id: number
  name: string
  phone?: string
  national_id?: string
  type?: string
  contact_name_1?: string
  contact_name_2?: string
}

// A reservation bills in a single fixed currency; pick the matching room price.
const roomRateFor = (room: { price_usd: number; price_sdg: number }, currency: string): number =>
  currency === 'USD' ? Number(room.price_usd ?? 0) : Number(room.price_sdg ?? 0)

const statusConfig: Record<Reservation['status'], { label: string; color: string; icon: any }> = {
  pending: { label: 'في الانتظار', color: 'gold', icon: ClockCircleOutlined },
  confirmed: { label: 'مؤكد', color: 'blue', icon: CheckCircleOutlined },
  checked_in: { label: 'تم تسجيل الوصول', color: 'green', icon: LoginOutlined },
  checked_out: { label: 'تم تسجيل المغادرة', color: 'default', icon: LogoutOutlined },
  cancelled: { label: 'ملغي', color: 'red', icon: CloseCircleOutlined },
}

export default function ReservationsList() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)
  const [arrivalsPdfLoading, setArrivalsPdfLoading] = useState(false)
  const [departuresPdfLoading, setDeparturesPdfLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<number, string>>({})
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // Single date filter based on reservation creation date (created_at)
  const [createdAtFilter, setCreatedAtFilter] = useState<string>('')
  const [arrivalTodayFilter, setArrivalTodayFilter] = useState(false)
  const [departureTodayFilter, setDepartureTodayFilter] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [openConfirm, setOpenConfirm] = useState(false)
  const [actionType, setActionType] = useState<'confirm' | 'checkin' | 'checkout' | 'cancel'>('confirm')
  const [customerBalance, setCustomerBalance] = useState<number | null>(null)
  const [occupiedRoomsError, setOccupiedRoomsError] = useState<any>(null)
  const [openOccupiedRoomsDialog, setOpenOccupiedRoomsDialog] = useState(false)
  const [openExtend, setOpenExtend] = useState(false)
  const [newCheckOutDate, setNewCheckOutDate] = useState<string>('')
  const [extensionLoading, setExtensionLoading] = useState(false)
  const [openService, setOpenService] = useState(false)
  const [availableServices, setAvailableServices] = useState<any[]>([])
  const [serviceForm, setServiceForm] = useState({ room_id: '', service_id: '', amount: '', payment_method: 'cash', notes: '' })
  const [serviceLoading, setServiceLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [refundMethod, setRefundMethod] = useState('cash')
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [editDatesLoading, setEditDatesLoading] = useState(false)
  const [openEditReservation, setOpenEditReservation] = useState(false)
  const [editReservationTab, setEditReservationTab] = useState(0)
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [loadingAvailableRooms, setLoadingAvailableRooms] = useState(false)
  const [transferOldRoomId, setTransferOldRoomId] = useState<string>('')
  const [transferNewRoomId, setTransferNewRoomId] = useState<string>('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [editCheckInDate, setEditCheckInDate] = useState<string>('')
  const [editCheckOutDate, setEditCheckOutDate] = useState<string>('')

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
  }, [statusFilter, createdAtFilter, arrivalTodayFilter, departureTodayFilter, selectedCustomer, currentPage, perPage])

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

      if (arrivalTodayFilter) {
        params.checkin_date = dayjs().format('YYYY-MM-DD')
      }

      if (departureTodayFilter) {
        params.checkout_date = dayjs().format('YYYY-MM-DD')
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

  const handleAction = async (reservation: Reservation, action: 'confirm' | 'checkin' | 'checkout' | 'cancel', skipDialog: boolean = false) => {
    // Show dialog for checkout and cancel actions
    if (!skipDialog && (action === 'checkout' || action === 'cancel')) {
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
      setRefundMethod('cash')
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

          if (data.sms_result && !data.sms_result.skipped) {
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

          if (data.whatsapp_result && !data.whatsapp_result.skipped) {
            if (data.whatsapp_result.success) {
              toast.success('تم إرسال رسالة واتساب لتأكيد الحجز بنجاح', {
                position: 'top-right',
                duration: 4000
              })
            } else {
              toast.error(`فشل إرسال رسالة واتساب: ${data.whatsapp_result.error || 'خطأ غير معروف'}`, {
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
          const checkoutData = await apiClient.post(`/reservations/${reservation.id}/check-out`, {
            refund_method: refundMethod
          })
          updatedReservation = checkoutData.data
          toast.success('تم تسجيل المغادرة بنجاح')
          break
        case 'cancel':
          const cancelData = await apiClient.post(`/reservations/${reservation.id}/cancel`)
          updatedReservation = cancelData.data
          toast.success('تم إلغاء الحجز بنجاح')

          if (cancelData.data.whatsapp_result && !cancelData.data.whatsapp_result.skipped) {
            if (cancelData.data.whatsapp_result.success) {
              toast.success('تم إرسال إشعار الإلغاء عبر واتساب', {
                position: 'top-right',
                duration: 4000
              })
            } else {
              toast.error(`فشل إرسال إشعار الإلغاء عبر واتساب: ${cancelData.data.whatsapp_result.error || 'خطأ غير معروف'}`, {
                position: 'top-right',
                duration: 5000
              })
            }
          }
          break
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
    await handleAction(selectedReservation, actionType, true)
  }

  // Filtering is now done on the backend, so we just use the reservations directly
  const filteredReservations = reservations

  const clearDateFilter = () => {
    setCreatedAtFilter('')
  }

  const clearArrivalTodayFilter = () => {
    setArrivalTodayFilter(false)
  }

  const clearDepartureTodayFilter = () => {
    setDepartureTodayFilter(false)
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

  const handleSendCheckoutReminders = async () => {
    try {
      setReminderLoading(true)
      const { data } = await apiClient.post('/reservations/send-checkout-reminders')

      if (data.notified?.length) {
        const sentAtById = new Map<number, string>(
          data.notified.map((n: { reservation_id: number; checkout_reminder_sent_at: string }) => [n.reservation_id, n.checkout_reminder_sent_at])
        )
        setReservations(prev => prev.map(r => (
          sentAtById.has(r.id) ? { ...r, checkout_reminder_sent_at: sentAtById.get(r.id) } : r
        )))
      }

      if (data.total === 0) {
        toast.info('لا توجد حجوزات تغادر اليوم بحاجة لتذكير')
      } else {
        toast.success(`تم إرسال ${data.sent} من ${data.total} تذكير مغادرة عبر واتساب`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في إرسال تذكيرات المغادرة')
    } finally {
      setReminderLoading(false)
    }
  }

  const handleOpenTodayPdf = async (type: 'arrivals' | 'departures') => {
    const setPdfLoading = type === 'arrivals' ? setArrivalsPdfLoading : setDeparturesPdfLoading
    try {
      setPdfLoading(true)
      const response = await apiClient.get(`/reservations/today/${type}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const newWindow = window.open(url, '_blank')
      if (!newWindow) {
        toast.error('يرجى السماح بالنوافذ المنبثقة لعرض PDF')
        window.URL.revokeObjectURL(url)
        return
      }
      newWindow.addEventListener('load', () => setTimeout(() => window.URL.revokeObjectURL(url), 1000))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في إنشاء ملف PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const getStatusTag = (status: Reservation['status']) => {
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Tag color={config.color} variant="solid" icon={<Icon />}>
        {config.label}
      </Tag>
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
          color="blue"
          variant="outlined"
          onClick={() => handleAction(reservation, 'confirm', true)}
          disabled={isLoading}
          loading={isLoading && currentAction === 'confirm'}
        >
          تأكيد
        </Button>,
      )
    }
    if (!['checked_in', 'checked_out', 'cancelled'].includes(reservation.status)) {
      buttons.push(
        <Button
          key="cancel"
          size="small"
          danger
          variant="outlined"
          onClick={() => handleAction(reservation, 'cancel', false)}
          disabled={isLoading}
          loading={isLoading && currentAction === 'cancel'}
        >
          إلغاء
        </Button>,
      )
    }


    if (reservation.status === 'confirmed') {
      buttons.push(
        <Button
          key="checkin"
          size="small"
          color="green"
          variant="outlined"
          onClick={() => handleAction(reservation, 'checkin', true)}
          disabled={isLoading}
          loading={isLoading && currentAction === 'checkin'}
        >
          تسجيل الوصول
        </Button>,
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
          loading={isLoading && currentAction === 'checkout'}
        >
          تسجيل المغادرة
        </Button>,
      )
    }

    if (['confirmed', 'checked_in'].includes(reservation.status)) {
      buttons.push(
        <Button
          key="extend"
          size="small"
          color="purple"
          variant="outlined"
          icon={<CalendarOutlined />}
          onClick={() => {
            setSelectedReservation(reservation)
            setNewCheckOutDate(
              dayjs(reservation.check_out_date).add(1, 'day').format('YYYY-MM-DD'),
            )
            setOpenExtend(true)
          }}
          disabled={isLoading}
        >
          تمديد
        </Button>,
      )

      buttons.push(
        <Button
          key="service"
          size="small"
          color="cyan"
          variant="outlined"
          icon={<CustomerServiceOutlined />}
          onClick={() => {
            setSelectedReservation(reservation)
            setServiceForm({
              room_id: reservation.rooms?.[0]?.id?.toString() || '',
              service_id: '',
              amount: '',
              payment_method: 'cash',
              notes: '',
            })
            setOpenService(true)
          }}
          disabled={isLoading}
        >
          إضافة خدمة
        </Button>,
      )
    }

    if (!['checked_out', 'cancelled'].includes(reservation.status) && hasPermission('/reservations-list/edit-dates')) {
      buttons.push(
        <Button
          key="editreservation"
          size="small"
          color="orange"
          variant="outlined"
          icon={<EditOutlined />}
          onClick={() => {
            setSelectedReservation(reservation)
            setEditCheckInDate(dayjs(reservation.check_in_date).format('YYYY-MM-DD'))
            setEditCheckOutDate(dayjs(reservation.check_out_date).format('YYYY-MM-DD'))
            setEditReservationTab(0)
            setTransferOldRoomId(reservation.rooms?.[0]?.id?.toString() || '')
            setTransferNewRoomId('')
            setAvailableRooms([])
            setOpenEditReservation(true)
          }}
          disabled={isLoading}
        />,
      )
    }

    return buttons
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
      const roomRate = roomRateFor(room, selectedReservation.currency)

      // Extension nights are always priced at the room's current live rate
      // (matches backend extend()), not the frozen rate stored at booking time.
      const rate = roomRate || pivotRate || 0
      total += days * rate
    })

    return total
  }

  const handleServiceSubmit = async () => {
    if (!selectedReservation || !serviceForm.room_id || !serviceForm.service_id) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة')
      return
    }

    try {
      setServiceLoading(true)
      await apiClient.post('/reservation-services', {
        reservation_id: selectedReservation.id,
        room_id: serviceForm.room_id,
        service_id: serviceForm.service_id,
        amount: serviceForm.amount ? parseFloat(serviceForm.amount) : null,
        payment_method: serviceForm.payment_method,
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

  const calculateDateEditDiff = () => {
    if (!selectedReservation) return { oldDays: 0, newDays: 0, daysDiff: 0, oldAmount: 0, newAmount: 0 }
    const oldDays = Math.max(1, dayjs(selectedReservation.check_out_date).diff(dayjs(selectedReservation.check_in_date), 'day'))
    const newIn  = editCheckInDate  || selectedReservation.check_in_date
    const newOut = editCheckOutDate || selectedReservation.check_out_date
    const newDays = Math.max(1, dayjs(newOut).diff(dayjs(newIn), 'day'))
    let pricePerDay = 0
    selectedReservation.rooms.forEach((room: any) => {
      const rate = room.pivot?.rate !== undefined && room.pivot?.rate !== null ? Number(room.pivot.rate) : 0
      const base = roomRateFor(room, selectedReservation.currency)
      pricePerDay += rate || base || 0
    })
    const oldAmount = oldDays * pricePerDay
    const newAmount = newDays * pricePerDay
    return { oldDays, newDays, daysDiff: newDays - oldDays, oldAmount, newAmount }
  }

  const handleUpdateDates = async () => {
    if (!selectedReservation) return
    const newIn  = editCheckInDate  || selectedReservation.check_in_date
    const newOut = editCheckOutDate || selectedReservation.check_out_date
    if (!dayjs(newOut).isAfter(dayjs(newIn))) {
      toast.error('يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول')
      return
    }
    try {
      setEditDatesLoading(true)
      const payload: any = {}
      if (editCheckInDate)  payload.check_in_date  = editCheckInDate
      if (editCheckOutDate) payload.check_out_date = editCheckOutDate
      const { data } = await apiClient.post(`/reservations/${selectedReservation.id}/update-dates`, payload)
      setReservations(prev => prev.map(r => r.id === data.id ? { ...data, rooms: data.rooms || r.rooms } : r))
      setOpenEditReservation(false)
      setSelectedReservation(null)
      toast.success('تم تعديل التواريخ بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في تعديل التواريخ')
    } finally {
      setEditDatesLoading(false)
    }
  }

  const fetchAvailableRoomsForTransfer = async (reservation: Reservation) => {
    try {
      setLoadingAvailableRooms(true)
      const checkIn  = reservation.check_in_date?.slice(0, 10)
      const checkOut = reservation.check_out_date?.slice(0, 10)
      const { data } = await apiClient.get('/rooms/all', {
        params: {
          check_in_date: checkIn,
          check_out_date: checkOut,
          exclude_reservation_id: reservation.id,
        },
      })
      const currentRoomIds = reservation.rooms.map(r => r.id)
      const rooms: any[] = Array.isArray(data) ? data : []
      setAvailableRooms(rooms.filter(r => !currentRoomIds.includes(r.id)))
    } catch {
      toast.error('فشل في جلب الغرف')
    } finally {
      setLoadingAvailableRooms(false)
    }
  }

  const handleTransferRoom = async () => {
    if (!selectedReservation || !transferOldRoomId || !transferNewRoomId) return
    try {
      setTransferLoading(true)
      const { data } = await apiClient.post(`/reservations/${selectedReservation.id}/transfer-room`, {
        old_room_id: parseInt(transferOldRoomId),
        new_room_id: parseInt(transferNewRoomId),
      })
      setReservations(prev => prev.map(r => r.id === data.id ? data : r))
      setOpenEditReservation(false)
      setSelectedReservation(null)
      toast.success('تم تحويل الغرفة بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في تحويل الغرفة')
    } finally {
      setTransferLoading(false)
    }
  }

  const getTransferPriceDiff = () => {
    if (!selectedReservation || !transferOldRoomId || !transferNewRoomId) return null
    const oldRoom = selectedReservation.rooms.find(r => r.id.toString() === transferOldRoomId)
    const newRoom = availableRooms.find(r => r.id.toString() === transferNewRoomId)
    if (!oldRoom || !newRoom) return null
    const days = Math.max(1, dayjs(selectedReservation.check_out_date).diff(dayjs(selectedReservation.check_in_date), 'day'))
    const oldRate = oldRoom.pivot?.rate !== undefined && oldRoom.pivot?.rate !== null ? Number(oldRoom.pivot.rate) : roomRateFor(oldRoom, selectedReservation.currency)
    const newRate = roomRateFor(newRoom, selectedReservation.currency)
    return { oldRate, newRate, days, oldTotal: days * oldRate, newTotal: days * newRate, diff: days * (newRate - oldRate) }
  }

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name}${c.phone ? ` - ${c.phone}` : ''}`,
    customer: c,
  }))

  const columns: ColumnsType<Reservation> = [
    {
      title: 'رقم الحجز',
      key: 'id',
      align: 'center',
      width: 90,
      render: (_, r) => <Text strong>#{r.id}</Text>,
    },
    {
      title: 'العميل',
      key: 'customer',
      align: 'center',
      render: (_, r) => (
        <div>
          <Text strong style={{ display: 'block' }}>{r.customer?.name || 'غير محدد'}</Text>
          {r.customer?.type === 'company' && (r.customer as any)?.contact_name_1 && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {[(r.customer as any).contact_name_1, (r.customer as any).contact_name_2].filter(Boolean).join(' • ')}
            </Text>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>{r.customer?.phone || '-'}</Text>
        </div>
      ),
    },
    {
      title: 'الغرف',
      key: 'rooms',
      align: 'center',
      render: (_, r) => (
        <Space wrap size={4} style={{ justifyContent: 'center' }}>
          {r.rooms?.length
            ? r.rooms.map((room) => <Tag key={room.id}>غرفة {room.number}</Tag>)
            : <Text type="secondary">-</Text>}
        </Space>
      ),
    },
    {
      title: 'تاريخ الوصول',
      key: 'check_in',
      align: 'center',
      render: (_, r) => (
        <div>
          <Text strong style={{ display: 'block' }}>{formatDate(r.check_in_date)}</Text>
          <Text  style={{ fontSize: 12 }}>{getRelativeDate(r.check_in_date)}</Text>
        </div>
      ),
    },
    {
      title: 'تاريخ المغادرة',
      key: 'check_out',
      align: 'center',
      render: (_, r) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Text strong>{formatDate(r.check_out_date)}</Text>
            {r.checkout_reminder_sent_at && (
              <Tooltip title={`تم إرسال تذكير المغادرة عبر واتساب في ${dayjs(r.checkout_reminder_sent_at).format('DD/MM/YYYY HH:mm')}`}>
                <WhatsAppOutlined style={{ color: '#25D366' }} />
              </Tooltip>
            )}
          </div>
          <Text  style={{ fontSize: 12 }}>{getRelativeDate(r.check_out_date)}</Text>
        </div>
      ),
    },
    {
      title: 'الحالة',
      key: 'status',
      align: 'center',
      render: (_, r) => getStatusTag(r.status),
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      align: 'center',
      render: (_, r) => (
        <Space wrap size={4} style={{ justifyContent: 'center' }}>
          {getActionButtons(r)}
        </Space>
      ),
    },
  ]

  const dateEditDiff = selectedReservation && editCheckInDate && editCheckOutDate ? calculateDateEditDiff() : null
  const transferDiff = getTransferPriceDiff()

  return (
    <div className="flex flex-col gap-1 p-1">
      {/* Search and Filter Card */}
      <Card>
        <div className="flex flex-col md:flex-row gap-1 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>فلترة بالعميل</Text>
            <Select
              showSearch
              allowClear
              placeholder="اختر عميل..."
              style={{ width: '100%' }}
              loading={loadingCustomers}
              value={selectedCustomer?.id}
              onChange={(value) => setSelectedCustomer(value ? customers.find((c) => c.id === value) || null : null)}
              options={customerOptions}
              filterOption={(input, option) =>
                (option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>
          <div className="w-full md:w-[180px]">
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>فلترة بالحالة</Text>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: 'all', label: 'جميع الحالات' },
                { value: 'pending', label: 'في الانتظار' },
                { value: 'confirmed', label: 'مؤكد' },
                { value: 'checked_in', label: 'تم تسجيل الوصول' },
                { value: 'checked_out', label: 'تم تسجيل المغادرة' },
                { value: 'cancelled', label: 'ملغي' },
              ]}
            />
          </div>
          <div className="w-full md:w-[220px]">
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>تاريخ إنشاء الحجز</Text>
            <DatePicker
              style={{ width: '100%' }}
              allowClear
              value={createdAtFilter ? dayjs(createdAtFilter) : null}
              onChange={(_, dateString) => setCreatedAtFilter((dateString as string) || '')}
            />
          </div>
        </div>

        {(createdAtFilter || arrivalTodayFilter || departureTodayFilter || selectedCustomer) && (
          <Space wrap style={{ marginTop: 16 }}>
            {createdAtFilter && (
              <Tag color="blue" closable onClose={clearDateFilter}>
                تاريخ الإنشاء: {dayjs(createdAtFilter).format('DD/MM/YYYY')}
              </Tag>
            )}
            {arrivalTodayFilter && (
              <Tag color="green" closable onClose={clearArrivalTodayFilter}>
                الوصول اليوم ({dayjs().format('DD/MM/YYYY')})
              </Tag>
            )}
            {departureTodayFilter && (
              <Tag color="orange" closable onClose={clearDepartureTodayFilter}>
                المغادرة اليوم ({dayjs().format('DD/MM/YYYY')})
              </Tag>
            )}
            {selectedCustomer && (
              <Tag color="purple" closable onClose={clearCustomerFilter}>
                العميل: {selectedCustomer.name}
              </Tag>
            )}
          </Space>
        )}
      </Card>

      {/* Reservations Table Card */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>الحجوزات ({totalItems})</Title>}
        extra={
          <Space>
            <Button
              type={arrivalTodayFilter ? 'primary' : 'default'}
              icon={<LoginOutlined />}
              onClick={() => setArrivalTodayFilter(prev => !prev)}
            >
              الواصلون اليوم
            </Button>
            <Tooltip title="طباعة قائمة الوصول اليوم PDF">
              <Button
                icon={<FilePdfOutlined />}
                loading={arrivalsPdfLoading}
                onClick={() => handleOpenTodayPdf('arrivals')}
              />
            </Tooltip>
            <Button
              type={departureTodayFilter ? 'primary' : 'default'}
              icon={<LogoutOutlined />}
              onClick={() => setDepartureTodayFilter(prev => !prev)}
            >
              المغادرون اليوم
            </Button>
            <Tooltip title="طباعة قائمة المغادرة اليوم PDF">
              <Button
                icon={<FilePdfOutlined />}
                loading={departuresPdfLoading}
                onClick={() => handleOpenTodayPdf('departures')}
              />
            </Tooltip>
            <Button
              icon={<WhatsAppOutlined />}
              loading={reminderLoading}
              onClick={handleSendCheckoutReminders}
              disabled={loading}
            >
              تذكير مغادرة اليوم
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={exportLoading}
              onClick={handleExportExcel}
              disabled={loading || filteredReservations.length === 0}
            >
              تصدير Excel
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredReservations}
          loading={loading}
          rowClassName={(record) => record.status === 'cancelled' ? 'reservation-row-cancelled' : ''}
          pagination={{
            current: currentPage,
            pageSize: perPage,
            total: totalItems,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `من ${total} حجز`,
            onChange: (page, pageSize) => {
              if (pageSize !== perPage) {
                setPerPage(pageSize)
                setCurrentPage(1)
              } else {
                setCurrentPage(page)
              }
            },
          }}
        />
      </Card>

      {/* Confirmation Dialog */}
      <Modal
        open={openConfirm}
        onCancel={() => setOpenConfirm(false)}
        title="تأكيد العملية"
        footer={[
          <Button key="cancel" onClick={() => setOpenConfirm(false)}>إلغاء</Button>,
          <Button
            key="submit"
            type="primary"
            danger={actionType === 'cancel'}
            loading={!!(selectedReservation && actionLoading[selectedReservation.id])}
            onClick={handleDialogAction}
          >
            تأكيد
          </Button>,
        ]}
      >
        {actionType === 'checkout' && selectedReservation ? (
          <Space orientation="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
            {customerBalance !== null && customerBalance !== 0 && (
              <Alert
                type="error"
                showIcon
                message="تسجيل المغادرة!"
                description={
                  <div>
                    <Text style={{ fontSize: 13 }}>
                      تحذير تسويه يرجي الحساب اولا <strong>{customerBalance.toLocaleString()}</strong>
                    </Text>
                    <Text style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                      يرجى تسوية رصيد العميل أولاً قبل تسجيل المغادرة.
                    </Text>
                    <Button
                      type="primary"
                      size="small"
                      style={{ marginTop: 8 }}
                      onClick={() => {
                        setOpenConfirm(false)
                        navigate(`/customers/${selectedReservation.customer_id}/ledger`)
                      }}
                    >
                      الانتقال إلى دفتر الحسابات
                    </Button>
                  </div>
                }
              />
            )}
            {customerBalance === 0 && !isPaymentComplete(selectedReservation) && (
              <Alert
                type="warning"
                showIcon
                message="تحذير: الحساب غير مدفوع بالكامل!"
                description={
                  <div>
                    <Text style={{ fontSize: 13, display: 'block' }}>
                      المبلغ الإجمالي: <strong>{selectedReservation.total_amount?.toLocaleString() || 0}</strong>
                    </Text>
                    <Text style={{ fontSize: 13, display: 'block' }}>
                      المبلغ المدفوع: <strong>{selectedReservation.paid_amount?.toLocaleString() || 0}</strong>
                    </Text>
                    <Text type="danger" style={{ fontSize: 13, display: 'block' }}>
                      المبلغ المتبقي: <strong>{(selectedReservation.total_amount || 0) - (selectedReservation.paid_amount || 0)}</strong>
                    </Text>
                  </div>
                }
              />
            )}
            {(() => {
              const today = dayjs().startOf('day')
              const scheduledOut = dayjs(selectedReservation.check_out_date).startOf('day')
              const remainingDays = scheduledOut.diff(today, 'day')

              if (remainingDays > 0) {
                const debitTransactions = selectedReservation.transactions?.filter((t: any) => t.type === 'debit') || []
                const totalCharged = debitTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0)

                const checkIn = dayjs(selectedReservation.check_in_date).startOf('day')
                const originalCheckOut = dayjs(selectedReservation.check_out_date).startOf('day')
                const totalDays = originalCheckOut.diff(checkIn, 'day') || 1

                const dailyRate = totalCharged / totalDays
                const refundTotal = Math.round(dailyRate * remainingDays)

                return (
                  <Alert
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    message={`مغادرة مبكرة (متبقي ${remainingDays} يوم)`}
                    description={
                      <div>
                        <Text style={{ fontSize: 13, display: 'block' }}>
                          تاريخ المغادرة المجدولة: <strong>{formatDate(selectedReservation.check_out_date)}</strong>
                        </Text>
                        <Text strong style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                          المبلغ المراد استرجاعه: <Text type="danger" strong>{refundTotal.toLocaleString()} SDG</Text>
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                          (تم الحساب بناءً على إجمالي قيمة الحجز: {totalCharged.toLocaleString()} SDG لـ {totalDays} يوم)
                        </Text>
                        <Text style={{ fontSize: 13, display: 'block', marginTop: 8 }}>
                          هل أنت متأكد من تسجيل المغادرة؟ يرجى تحديد طريقة استرجاع المبلغ:
                        </Text>
                        <Select
                          style={{ width: '100%', marginTop: 8 }}
                          value={refundMethod}
                          onChange={(value) => setRefundMethod(value)}
                          options={[
                            { value: 'cash', label: 'نقدي' },
                            { value: 'bankak', label: 'بنكك' },
                            { value: 'Ocash', label: 'أوكاش' },
                            { value: 'fawri', label: 'فوري' },
                          ]}
                        />
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                          سيتم تسجيل هذه العملية كـ "مسترجع" في التقارير المالية.
                        </Text>
                      </div>
                    }
                  />
                )
              } else if (customerBalance === 0 && isPaymentComplete(selectedReservation)) {
                return <Text>هل أنت متأكد من تسجيل المغادرة؟</Text>
              }
              return null
            })()}
          </Space>
        ) : (
          <Text>هل أنت متأكد من تنفيذ هذا الإجراء؟ لا يمكن التراجع عن بعض العمليات.</Text>
        )}
      </Modal>

      {/* Occupied Rooms Error Dialog */}
      <Modal
        open={openOccupiedRoomsDialog}
        onCancel={() => {
          setOpenOccupiedRoomsDialog(false)
          setOccupiedRoomsError(null)
        }}
        title={<Text type="danger" strong>لا يمكن تسجيل الوصول</Text>}
        width={640}
        footer={[
          <Button
            key="close"
            type="primary"
            danger
            onClick={() => {
              setOpenOccupiedRoomsDialog(false)
              setOccupiedRoomsError(null)
            }}
          >
            إغلاق
          </Button>,
        ]}
      >
        {occupiedRoomsError && (
          <Space orientation="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
            <Alert
              type="error"
              showIcon
              message="بعض الغرف محجوزة حالياً من قبل حجوزات أخرى"
              description={`لا يمكن تسجيل الوصول للحجز #${occupiedRoomsError.reservationId} لأن بعض الغرف المخصصة له محجوزة من قبل حجوزات أخرى.`}
            />

            <Text strong>الغرف المحجوزة:</Text>

            <Space orientation="vertical" size={12} style={{ width: '100%' }}>
              {occupiedRoomsError.occupiedRooms.map((item: any, index: number) => (
                <div key={index} className="rounded-md border border-destructive/40 bg-card p-3">
                  <Text strong type="danger" style={{ display: 'block', marginBottom: 6 }}>
                    غرفة {item.room_number}
                  </Text>
                  <Text style={{ fontSize: 13, display: 'block' }}>
                    <strong>رقم الحجز:</strong> #{item.conflicting_reservation.id}
                  </Text>
                  <Text style={{ fontSize: 13, display: 'block' }}>
                    <strong>العميل:</strong> {item.conflicting_reservation.customer_name}
                  </Text>
                  <Text style={{ fontSize: 13, display: 'block' }}>
                    <strong>تاريخ الوصول:</strong> {dayjs(item.conflicting_reservation.check_in_date).format('DD/MM/YYYY')}
                  </Text>
                  <Text style={{ fontSize: 13, display: 'block' }}>
                    <strong>تاريخ المغادرة:</strong> {dayjs(item.conflicting_reservation.check_out_date).format('DD/MM/YYYY')}
                  </Text>
                  <div style={{ marginTop: 6 }}>
                    {getStatusTag(item.conflicting_reservation.status)}
                  </div>
                </div>
              ))}
            </Space>

            <Alert type="info" showIcon message="يرجى الانتظار حتى يتم تسجيل مغادرة الحجوزات السابقة أو اختيار غرف أخرى." />
          </Space>
        )}
      </Modal>

      {/* Extend Dialog */}
      <Modal
        open={openExtend}
        onCancel={() => !extensionLoading && setOpenExtend(false)}
        title={`تمديد الحجز #${selectedReservation?.id}`}
        width={420}
        footer={[
          <Button key="cancel" onClick={() => setOpenExtend(false)} disabled={extensionLoading}>إلغاء</Button>,
          <Button
            key="submit"
            type="primary"
            loading={extensionLoading}
            disabled={!newCheckOutDate || dayjs(newCheckOutDate).isBefore(dayjs(selectedReservation?.check_out_date).add(1, 'day'))}
            onClick={handleExtend}
          >
            تأكيد التمديد
          </Button>,
        ]}
      >
        <Space orientation="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
          <Text type="secondary">
            تاريخ المغادرة الحالي: <strong>{selectedReservation && formatDate(selectedReservation.check_out_date)}</strong>
          </Text>

          <DatePicker
            style={{ width: '100%' }}
            placeholder="تاريخ المغادرة الجديد"
            value={newCheckOutDate ? dayjs(newCheckOutDate) : null}
            onChange={(_, dateString) => setNewCheckOutDate((dateString as string) || '')}
            disabledDate={(current) => !!selectedReservation && current && !current.isAfter(dayjs(selectedReservation.check_out_date), 'day')}
          />

          {selectedReservation && newCheckOutDate && (
            <div className="rounded-md border border-border bg-muted p-3">
              <div className="flex justify-between">
                <Text style={{ fontSize: 13 }}>عدد الأيام الإضافية:</Text>
                <Text strong style={{ fontSize: 13 }}>
                  {dayjs(newCheckOutDate).diff(dayjs(selectedReservation.check_out_date), 'day')} يوم
                </Text>
              </div>
              <div className="flex justify-between" style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 13 }}>التكلفة الإضافية:</Text>
                <Text strong style={{ fontSize: 13, color: '#1677ff' }}>
                  {calculateExtensionPrice().toLocaleString()} SDG
                </Text>
              </div>
            </div>
          )}
        </Space>
      </Modal>

      {/* Unified Edit Reservation Dialog */}
      <Modal
        open={openEditReservation}
        onCancel={() => !editDatesLoading && !transferLoading && setOpenEditReservation(false)}
        title={`تعديل الحجز #${selectedReservation?.id}`}
        width={520}
        footer={[
          <Button key="cancel" onClick={() => setOpenEditReservation(false)} disabled={editDatesLoading || transferLoading}>إلغاء</Button>,
          editReservationTab === 0 ? (
            <Button
              key="dates"
              color="orange"
              variant="solid"
              loading={editDatesLoading}
              disabled={!editCheckInDate || !editCheckOutDate}
              icon={<CalendarOutlined />}
              onClick={handleUpdateDates}
            >
              تأكيد تعديل التواريخ
            </Button>
          ) : (
            <Button
              key="transfer"
              type="primary"
              loading={transferLoading}
              disabled={!transferOldRoomId || !transferNewRoomId}
              icon={<SwapOutlined />}
              onClick={handleTransferRoom}
            >
              تأكيد التحويل
            </Button>
          ),
        ]}
      >
        <Tabs
          activeKey={editReservationTab === 0 ? 'dates' : 'transfer'}
          onChange={(key) => {
            const v = key === 'dates' ? 0 : 1
            setEditReservationTab(v)
            if (v === 1 && selectedReservation && availableRooms.length === 0) {
              fetchAvailableRoomsForTransfer(selectedReservation)
            }
          }}
          items={[
            {
              key: 'dates',
              label: 'تعديل التواريخ',
              icon: <CalendarOutlined />,
              children: (
                <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                  <div className="rounded-md border border-border bg-muted p-3">
                    <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                      تاريخ الوصول الحالي: <strong>{selectedReservation && formatDate(selectedReservation.check_in_date)}</strong>
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                      تاريخ المغادرة الحالي: <strong>{selectedReservation && formatDate(selectedReservation.check_out_date)}</strong>
                    </Text>
                  </div>

                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="تاريخ الوصول الجديد"
                    value={editCheckInDate ? dayjs(editCheckInDate) : null}
                    onChange={(_, dateString) => setEditCheckInDate((dateString as string) || '')}
                  />
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="تاريخ المغادرة الجديد"
                    value={editCheckOutDate ? dayjs(editCheckOutDate) : null}
                    onChange={(_, dateString) => setEditCheckOutDate((dateString as string) || '')}
                    disabledDate={(current) => !!editCheckInDate && current && !current.isAfter(dayjs(editCheckInDate), 'day')}
                  />

                  {dateEditDiff && dateEditDiff.daysDiff !== 0 && (
                    <Alert
                      type={dateEditDiff.daysDiff > 0 ? 'warning' : 'info'}
                      showIcon
                      message={
                        <div>
                          <div className="flex justify-between">
                            <Text style={{ fontSize: 13 }}>عدد الأيام الجديد:</Text>
                            <Text strong style={{ fontSize: 13 }}>{dateEditDiff.newDays} يوم</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text style={{ fontSize: 13 }}>المبلغ القديم:</Text>
                            <Text style={{ fontSize: 13 }}>{dateEditDiff.oldAmount.toLocaleString()} SDG</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text strong style={{ fontSize: 13 }}>المبلغ الجديد:</Text>
                            <Text strong style={{ fontSize: 13 }}>{dateEditDiff.newAmount.toLocaleString()} SDG</Text>
                          </div>
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            سيتم تعديل المعاملة الأصلية في كشف الحساب.
                          </Text>
                        </div>
                      }
                    />
                  )}
                </Space>
              ),
            },
            {
              key: 'transfer',
              label: 'تحويل الغرفة',
              icon: <SwapOutlined />,
              children: (
                <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                  <div className="rounded-md border border-border bg-muted p-3">
                    <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                      الغرف الحالية: <strong>{selectedReservation?.rooms.map((r) => `غرفة ${r.number}`).join('، ')}</strong>
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                      الفترة: <strong>{selectedReservation && formatDate(selectedReservation.check_in_date)}</strong> → <strong>{selectedReservation && formatDate(selectedReservation.check_out_date)}</strong>
                    </Text>
                  </div>

                  <div>
                    <Text style={{ display: 'block', marginBottom: 6 }}>الغرفة المراد التحويل منها</Text>
                    <Select
                      style={{ width: '100%' }}
                      value={transferOldRoomId || undefined}
                      onChange={(value) => setTransferOldRoomId(value)}
                      options={selectedReservation?.rooms.map((room) => {
                        const rate = room.pivot?.rate || (selectedReservation ? roomRateFor(room, selectedReservation.currency) : 0)
                        return {
                          value: room.id.toString(),
                          label: `غرفة ${room.number}${room.type?.name ? ` — ${room.type.name}` : ''}${rate ? ` (${rate.toLocaleString()} ${selectedReservation?.currency}/ليلة)` : ''}`,
                        }
                      })}
                    />
                  </div>

                  <div>
                    <Text style={{ display: 'block', marginBottom: 6 }}>الغرفة الجديدة</Text>
                    <Select
                      style={{ width: '100%' }}
                      loading={loadingAvailableRooms}
                      value={transferNewRoomId || undefined}
                      onChange={(value) => setTransferNewRoomId(value)}
                      notFoundContent="لا توجد غرف أخرى"
                      options={availableRooms.map((room: any) => {
                        const rate = selectedReservation ? roomRateFor(room, selectedReservation.currency) : 0
                        return {
                          value: room.id.toString(),
                          label: `غرفة ${room.number}${room.type?.name ? ` — ${room.type.name}` : ''}${rate ? ` (${rate.toLocaleString()} ${selectedReservation?.currency}/ليلة)` : ''}`,
                        }
                      })}
                    />
                  </div>

                  {transferDiff && (
                    <Alert
                      type={transferDiff.diff === 0 ? 'success' : transferDiff.diff > 0 ? 'warning' : 'info'}
                      showIcon
                      message={
                        <div>
                          <div className="flex justify-between">
                            <Text style={{ fontSize: 13 }}>سعر الغرفة القديمة:</Text>
                            <Text style={{ fontSize: 13 }}>{transferDiff.oldRate.toLocaleString()} {selectedReservation?.currency}/ليلة</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text style={{ fontSize: 13 }}>سعر الغرفة الجديدة:</Text>
                            <Text strong style={{ fontSize: 13 }}>{transferDiff.newRate.toLocaleString()} {selectedReservation?.currency}/ليلة</Text>
                          </div>
                          <div className="flex justify-between" style={{ marginTop: 4 }}>
                            <Text style={{ fontSize: 13 }}>إجمالي قديم ({transferDiff.days} يوم):</Text>
                            <Text style={{ fontSize: 13 }}>{transferDiff.oldTotal.toLocaleString()} {selectedReservation?.currency}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text strong style={{ fontSize: 13 }}>إجمالي جديد:</Text>
                            <Text strong style={{ fontSize: 13 }}>{transferDiff.newTotal.toLocaleString()} {selectedReservation?.currency}</Text>
                          </div>
                          {transferDiff.diff !== 0 && (
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                              {transferDiff.diff > 0 ? `فرق إضافي: +${transferDiff.diff.toLocaleString()} ${selectedReservation?.currency}` : `خصم: ${transferDiff.diff.toLocaleString()} ${selectedReservation?.currency}`} — سيتم تعديل كشف الحساب تلقائياً.
                            </Text>
                          )}
                        </div>
                      }
                    />
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Modal>

      {/* Add Service Dialog */}
      <Modal
        open={openService}
        onCancel={() => !serviceLoading && setOpenService(false)}
        title={`إضافة خدمة للحجز #${selectedReservation?.id}`}
        width={480}
        footer={[
          <Button key="cancel" onClick={() => setOpenService(false)} disabled={serviceLoading}>إلغاء</Button>,
          <Button
            key="submit"
            type="primary"
            loading={serviceLoading}
            disabled={!serviceForm.room_id || !serviceForm.service_id}
            onClick={handleServiceSubmit}
          >
            إضافة الخدمة
          </Button>,
        ]}
      >
        <Space orientation="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
          <div>
            <Text style={{ display: 'block', marginBottom: 6 }}>الغرفة</Text>
            <Select
              style={{ width: '100%' }}
              value={serviceForm.room_id || undefined}
              onChange={(value) => setServiceForm({ ...serviceForm, room_id: value })}
              options={selectedReservation?.rooms?.map((room) => ({
                value: room.id.toString(),
                label: `غرفة ${room.number}`,
              }))}
            />
          </div>

          <div>
            <Text style={{ display: 'block', marginBottom: 6 }}>نوع الخدمة</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="اختر خدمة"
              value={serviceForm.service_id || undefined}
              onChange={(value) => setServiceForm({ ...serviceForm, service_id: value })}
              options={availableServices.map((svc) => ({
                value: svc.id.toString(),
                label: svc.name,
              }))}
            />
          </div>

          <div>
            <Text style={{ display: 'block', marginBottom: 6 }}>المبلغ (SDG) - اختياري</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              value={serviceForm.amount ? Number(serviceForm.amount) : undefined}
              onChange={(value) => setServiceForm({ ...serviceForm, amount: value === null ? '' : String(value) })}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              يمكن تركه فارغاً وإضافة المبلغ لاحقاً عبر كشف الحساب
            </Text>
          </div>

          <div>
            <Text style={{ display: 'block', marginBottom: 6 }}>طريقة الدفع</Text>
            <Select
              style={{ width: '100%' }}
              value={serviceForm.payment_method}
              onChange={(value) => setServiceForm({ ...serviceForm, payment_method: value })}
              options={[
                { value: 'cash', label: 'نقدي' },
                { value: 'bankak', label: 'بنكك' },
                { value: 'Ocash', label: 'أوكاش' },
                { value: 'fawri', label: 'فوري' },
              ]}
            />
          </div>

          <div>
            <Text style={{ display: 'block', marginBottom: 6 }}>ملاحظات</Text>
            <TextArea
              rows={3}
              value={serviceForm.notes}
              onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}
