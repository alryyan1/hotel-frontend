import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const [openCreate, setOpenCreate] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [openCustomer, setOpenCustomer] = useState(false)
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', national_id: '', address: '', date_of_birth: '', gender: '' })
  const [form, setForm] = useState({
    customer_id: '',
    code: '',
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
      setAvailableRooms(data?.data || data)
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
      if (!form.customer_id || !form.code || selectedRooms.length === 0) {
        setError('عميل، كود الحجز، وغرفة واحدة على الأقل مطلوبة')
        return
      }
      const payload = {
        code: form.code,
        customer_id: form.customer_id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guest_count: guestCount,
        notes: form.notes || '',
        rooms: selectedRooms.map((r) => ({ id: r.id }))
      }
      await apiClient.post('/reservations', payload)
      setSuccess('تم إنشاء الحجز بنجاح')
      setOpenCreate(false)
      setSelectedRooms([])
      setForm({ customer_id: '', code: '', notes: '' })
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
    <div className="p-3 space-y-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-bold mb-3">البحث عن توفر الغرف</h3>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-3">
              <Label>تاريخ الوصول</Label>
              <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <Label>تاريخ المغادرة</Label>
              <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
            <div className="col-span-12 md:col-span-2">
              <Label>عدد الضيوف</Label>
              <Input type="number" min={1} value={guestCount} onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <Label>نوع الغرفة</Label>
              <Select value={roomTypeId} onValueChange={(v: string) => setRoomTypeId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">الكل</SelectItem>
                  {roomTypes.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-12 md:col-span-1 flex items-end">
              <Button className="w-full" onClick={searchAvailability} disabled={loading}>بحث</Button>
            </div>
          </div>
          {error && <Alert className="mt-3" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert className="mt-3"><AlertDescription className="text-green-700">{success}</AlertDescription></Alert>}
        </CardContent>
      </Card>

      {availableRooms?.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold">الغرف المتاحة</div>
              <Button variant="outline" onClick={openCreateDialog} disabled={selectedRooms.length === 0}>إنشاء حجز</Button>
            </div>
            <div className="grid grid-cols-12 gap-3">
              {availableRooms.map((room: any) => (
                <div key={room.id} className="col-span-12 md:col-span-4">
                  <div onClick={() => toggleRoom(room)} className={`cursor-pointer rounded-lg border p-3 ${selectedRooms.find(r=>r.id===room.id) ? 'border-blue-600' : ''}`}>
                    <div className="font-semibold text-sm">غرفة {room.number}</div>
                    <div className="text-xs text-neutral-500">الدور {room.floor?.number} • {room.type?.name}</div>
                    <div className="mt-2 flex gap-1 flex-wrap text-xs">
                      <span className="rounded-full border px-2 py-0.5">{room.type?.capacity} ضيوف</span>
                      {room.type?.area && <span className="rounded-full border px-2 py-0.5">{room.type.area} م²</span>}
                      {Array.isArray(room.type?.amenities) && room.type.amenities.slice(0,3).map((a:string,i:number)=>(<span key={i} className="rounded-full border px-2 py-0.5">{a}</span>))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إنشاء حجز</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-12 gap-3 mt-1">
            <div className="col-span-12">
              <Label>العميل</Label>
              <Select value={form.customer_id} onValueChange={(v: string) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c:any)=>(
                    <SelectItem key={c.id} value={String(c.id)}>{c.name} — {c.phone || c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-12">
              <Button variant="outline" onClick={() => setOpenCustomer(true)}>عميل جديد</Button>
            </div>
            <div className="col-span-12">
              <Label>كود الحجز</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="مثال: RES-2025-0001" />
            </div>
            <div className="col-span-12">
              <Label>ملاحظات</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="col-span-12">
              <div className="text-sm font-semibold">الغرف المختارة</div>
              <div className="flex gap-2 flex-wrap mt-1">
                {selectedRooms.map((r:any)=>(
                  <span key={r.id} className="rounded-full border px-2 py-0.5 text-xs">غرفة {r.number}</span>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>إلغاء</Button>
            <Button onClick={createReservation} disabled={loading}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openCustomer} onOpenChange={setOpenCustomer}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>عميل جديد</DialogTitle>
            <DialogDescription>إضافة عميل إلى قاعدة البيانات</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-12 gap-3 mt-1">
            <div className="col-span-12">
              <Label>الاسم</Label>
              <Input value={customerForm.name} onChange={(e)=>setCustomerForm({ ...customerForm, name: e.target.value })} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Label>الهاتف</Label>
              <Input value={customerForm.phone} onChange={(e)=>setCustomerForm({ ...customerForm, phone: e.target.value })} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Label>الرقم الوطني</Label>
              <Input value={customerForm.national_id} onChange={(e)=>setCustomerForm({ ...customerForm, national_id: e.target.value })} />
            </div>
            <div className="col-span-12">
              <Label>العنوان</Label>
              <Input value={customerForm.address} onChange={(e)=>setCustomerForm({ ...customerForm, address: e.target.value })} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Label>تاريخ الميلاد</Label>
              <Input type="date" value={customerForm.date_of_birth} onChange={(e)=>setCustomerForm({ ...customerForm, date_of_birth: e.target.value })} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Label>النوع</Label>
              <Select value={customerForm.gender} onValueChange={(v: string) => setCustomerForm({ ...customerForm, gender: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="غير محدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">غير محدد</SelectItem>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenCustomer(false)}>إلغاء</Button>
            <Button onClick={createCustomer} disabled={loading}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



