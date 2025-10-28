import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/page-header'
import { Search, Calendar, Users, Plus } from 'lucide-react'
import CreateReservationDialog from '@/components/dialogs/CreateReservationDialog'
import CreateCustomerDialog from '@/components/dialogs/CreateCustomerDialog'

export default function Reservations() {
  const [checkIn, setCheckIn] = useState<string>('')
  const [checkOut, setCheckOut] = useState<string>('')
  const [guestCount, setGuestCount] = useState<number>(1)
  const [roomTypeId, setRoomTypeId] = useState<string>('')
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [smsStatus, setSmsStatus] = useState<{success: boolean, message: string} | null>(null)
  const [openCreate, setOpenCreate] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [openCustomer, setOpenCustomer] = useState(false)
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', national_id: '', address: '', date_of_birth: '', gender: '' })
  const [form, setForm] = useState({
    customer_id: '',
    notes: ''
  })

  useEffect(() => {
    fetchRoomTypes()
    fetchCustomers()
  }, [])

  const fetchRoomTypes = async () => {
    try {
      const { data } = await apiClient.get('/room-types')
      setRoomTypes(data)
    } catch (e) {
      console.error('Failed to fetch room types', e)
    }
  }

  const fetchCustomers = async () => {
    try {
      const { data } = await apiClient.get('/customers')
      setCustomers(data?.data || data)
    } catch (e) {
      console.error('Failed to fetch customers', e)
    }
  }

  const searchAvailability = async () => {
    try {
      setError('')
      setSuccess('')
      if (!checkIn || !checkOut) {
        setError('الرجاء اختيار تاريخي الوصول والمغادرة')
        return
      }
      setLoading(true)
      const params: any = {
        check_in_date: checkIn,
        check_out_date: checkOut,
      }
      if (roomTypeId && roomTypeId !== 'all') params.room_type_id = roomTypeId
      if (guestCount) params.guest_count = guestCount
      const { data } = await apiClient.get('/availability', { params })
      const rooms = data?.data || data
      setAvailableRooms(rooms)
      
      // Show message if no rooms are available
      if (!rooms || rooms.length === 0) {
        setError('لا توجد غرف متاحة للتواريخ المحددة')
      }
    } catch (e) {
      console.error('Availability search failed', e)
      setError('فشل في جلب التوفر')
    } finally {
      setLoading(false)
    }
  }

  const toggleRoom = (room: any) => {
    setSelectedRooms((prev) => {
      const exists = prev.find((r) => r.id === room.id)
      if (exists) return prev.filter((r) => r.id !== room.id)
      return [...prev, room]
    })
  }

  const openCreateDialog = () => {
    if (!checkIn || !checkOut) {
      setError('اختر التواريخ أولاً')
      return
    }
    setOpenCreate(true)
  }

  const createReservation = async () => {
    try {
      setLoading(true)
      setError('')
      setSmsStatus(null)
      if (!form.customer_id || selectedRooms.length === 0) {
        setError('العميل وغرفة واحدة على الأقل مطلوبة')
        return
      }
      const payload = {
        customer_id: form.customer_id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guest_count: guestCount,
        notes: form.notes || '',
        rooms: selectedRooms.map((r) => ({ id: r.id }))
      }
      const { data } = await apiClient.post('/reservations', payload)
      
      // Handle SMS result
      if (data.sms_result) {
        if (data.sms_result.success) {
          setSmsStatus({
            success: true,
            message: 'تم إرسال رسالة تأكيد الحجز بنجاح'
          })
        } else {
          setSmsStatus({
            success: false,
            message: `فشل إرسال الرسالة: ${data.sms_result.error || 'خطأ غير معروف'}`
          })
        }
      }
      
      setSuccess('تم إنشاء الحجز بنجاح')
      setOpenCreate(false)
      setSelectedRooms([])
      setForm({ customer_id: '', notes: '' })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل إنشاء الحجز')
    } finally {
      setLoading(false)
    }
  }

  const createCustomer = async () => {
    try {
      setLoading(true)
      const payload = { ...customerForm }
      const { data } = await apiClient.post('/customers', payload)
      setCustomers((prev)=>[data, ...prev])
      setForm((f)=>({ ...f, customer_id: data.id }))
      setOpenCustomer(false)
      setCustomerForm({ name: '', phone: '', national_id: '', address: '', date_of_birth: '', gender: '' })
      setSuccess('تم إنشاء العميل')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل إنشاء العميل')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الحجوزات"
        description="ابحث عن التوفر وأنشئ حجوزات بسهولة"
        icon="🗓️"
      />

      {error && <Alert variant="destructive" className="shadow-md"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="shadow-md border-green-200 bg-green-50"><AlertDescription className="text-green-700 font-medium">{success}</AlertDescription></Alert>}
      {smsStatus && (
        <Alert className={`shadow-md ${smsStatus.success ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}>
          <AlertDescription className={`font-medium ${smsStatus.success ? 'text-blue-700' : 'text-orange-700'}`}>
            📱 {smsStatus.message}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border/40 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="size-5 text-primary" />
            <h3 className="font-bold text-lg">البحث عن توفر الغرف</h3>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-3">
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="size-4" />
                تاريخ الوصول
              </Label>
              <Input 
                type="date" 
                value={checkIn} 
                onChange={(e) => setCheckIn(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="size-4" />
                تاريخ المغادرة
              </Label>
              <Input 
                type="date" 
                value={checkOut} 
                onChange={(e) => setCheckOut(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="col-span-12 md:col-span-2">
              <Label className="flex items-center gap-2 mb-2">
                <Users className="size-4" />
                عدد الضيوف
              </Label>
              <Input 
                type="number" 
                min={1} 
                value={guestCount} 
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                className="h-11"
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <Label className="mb-2 block">نوع الغرفة</Label>
              <Select value={roomTypeId} onValueChange={(v: string) => setRoomTypeId(v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {roomTypes.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-12 md:col-span-1 flex items-end">
              <Button 
                className="w-full h-11 shadow-md" 
                onClick={searchAvailability} 
                disabled={loading}
              >
                {loading ? 'جارٍ البحث...' : 'بحث'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show results section when search has been performed */}
      {(availableRooms?.length > 0 || (availableRooms?.length === 0 && !loading && checkIn && checkOut)) && (
        <Card className="border-border/40 shadow-lg">
          <CardContent className="pt-6">
            {availableRooms?.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="font-bold text-lg">الغرف المتاحة ({availableRooms.length})</div>
                  <Button 
                    onClick={openCreateDialog} 
                    disabled={selectedRooms.length === 0}
                    className="shadow-md"
                  >
                    <Plus className="size-4 mr-2" />
                    إنشاء حجز ({selectedRooms.length})
                  </Button>
                </div>
                <div className="grid grid-cols-12 gap-4">
                  {availableRooms.map((room: any) => (
                    <div key={room.id} className="col-span-12 sm:col-span-6 lg:col-span-4">
                      <div 
                        onClick={() => toggleRoom(room)} 
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg ${
                          selectedRooms.find(r=>r.id===room.id) 
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/20' 
                            : 'border-border/40 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-base">غرفة {room.number}</div>
                          {selectedRooms.find(r=>r.id===room.id) && (
                            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mb-3">
                          الدور {room.floor?.number} • {room.type?.name}
                        </div>
                        <div className="flex gap-1.5 flex-wrap text-xs">
                          <span className="rounded-lg border border-border/60 bg-background px-2 py-1 font-medium">
                            {room.type?.capacity} ضيوف
                          </span>
                          {room.type?.area && (
                            <span className="rounded-lg border border-border/60 bg-background px-2 py-1 font-medium">
                              {room.type.area} م²
                            </span>
                          )}
                          {Array.isArray(room.type?.amenities) && room.type.amenities.slice(0,2).map((a:string,i:number)=>(
                            <span key={i} className="rounded-lg border border-border/60 bg-background px-2 py-1 font-medium">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3 opacity-50">🏨</div>
                <p className="text-muted-foreground text-lg font-medium">لا توجد غرف متاحة</p>
                <p className="text-muted-foreground text-sm mt-2">
                  للتواريخ المحددة ({checkIn} - {checkOut})
                </p>
                <p className="text-muted-foreground text-sm">
                  جرب تواريخ أخرى أو نوع غرفة مختلف
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <CreateReservationDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        customers={customers}
        selectedRooms={selectedRooms}
        form={form}
        onFormChange={setForm}
        onCreateReservation={createReservation}
        onOpenCustomerDialog={() => setOpenCustomer(true)}
        loading={loading}
      />

      <CreateCustomerDialog
        open={openCustomer}
        onOpenChange={setOpenCustomer}
        customerForm={customerForm}
        onCustomerFormChange={setCustomerForm}
        onCreateCustomer={createCustomer}
        loading={loading}
      />
    </div>
  )
}



