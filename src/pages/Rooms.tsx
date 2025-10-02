import { useState, useEffect } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([])
  const [filteredRooms, setFilteredRooms] = useState<any[]>([])
  const [displayedRooms, setDisplayedRooms] = useState<any[]>([])
  const [floors, setFloors] = useState<any[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [roomStatuses, setRoomStatuses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFloor, setFilterFloor] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(9)
  const [savingStatus, setSavingStatus] = useState(false)
  const [form, setForm] = useState<any>({
    number: '',
    floor_id: '',
    room_type_id: '',
    room_status_id: '',
    beds: 1,
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterRooms()
  }, [rooms, searchTerm, filterFloor, filterType, filterStatus])

  useEffect(() => {
    const start = page * rowsPerPage
    const end = start + rowsPerPage
    setDisplayedRooms(filteredRooms.slice(start, end))
  }, [filteredRooms, page, rowsPerPage])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [roomsRes, floorsRes, roomTypesRes, roomStatusesRes] = await Promise.all([
        apiClient.get('/rooms'),
        apiClient.get('/floors'),
        apiClient.get('/room-types'),
        apiClient.get('/room-statuses')
      ])
      setRooms(roomsRes.data)
      setFloors(floorsRes.data)
      setRoomTypes(roomTypesRes.data)
      setRoomStatuses(roomStatusesRes.data)
    } catch (err) {
      setError('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const filterRooms = () => {
    const filtered = rooms.filter((room: any) => {
      const matchesSearch = (room.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.type?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFloor = !filterFloor || String(room.floor_id) === filterFloor
      const matchesType = !filterType || String(room.room_type_id) === filterType
      const matchesStatus = !filterStatus || String(room.room_status_id) === filterStatus
      return matchesSearch && matchesFloor && matchesType && matchesStatus
    })
    setFilteredRooms(filtered)
    setPage(0)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterFloor('')
    setFilterType('')
    setFilterStatus('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      if (!form.number?.trim()) {
        setError('رقم الغرفة مطلوب')
        return
      }
      if (!form.floor_id || !form.room_type_id || !form.room_status_id) {
        setError('الرجاء اختيار الدور، نوع الغرفة، وحالة الغرفة')
        return
      }
      if (parseInt(form.beds) < 1 || parseInt(form.beds) > 10) {
        setError('عدد الأسرة يجب أن يكون بين 1 و 10')
        return
      }
      const submitData = { ...form, beds: parseInt(form.beds) }
      if (editingRoom) {
        await apiClient.put(`/rooms/${editingRoom.id}`, submitData)
        setSuccess('تم تحديث الغرفة بنجاح')
      } else {
        await apiClient.post('/rooms', submitData)
        setSuccess('تم إنشاء الغرفة بنجاح')
      }
      setOpenDialog(false)
      setForm({ number: '', floor_id: '', room_type_id: '', room_status_id: '', beds: 1, notes: '' })
      setEditingRoom(null)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (room: any) => {
    setEditingRoom(room)
    setForm({
      number: room.number,
      floor_id: String(room.floor_id),
      room_type_id: String(room.room_type_id),
      room_status_id: String(room.room_status_id),
      beds: room.beds,
      notes: room.notes || ''
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الغرفة؟')) return
    try {
      setLoading(true)
      await apiClient.delete(`/rooms/${id}`)
      setSuccess('تم حذف الغرفة بنجاح')
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setForm({ number: '', floor_id: '', room_type_id: '', room_status_id: '', beds: 1, notes: '' })
    setEditingRoom(null)
  }

  const getStatusColor = (status: any) => status?.color || '#2196f3'
  const getStatusName = (status: any) => status?.name || 'غير محدد'

  const RoomCard = ({ room }: { room: any }) => (
    <Card className="relative">
      <span className="absolute -top-2 right-4 inline-block h-4 w-4 rounded-full border-2 border-white" style={{ backgroundColor: getStatusColor(room.status) }} />
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 font-bold">
            {room.number}
          </div>
          <div className="flex-1">
            <CardTitle>غرفة {room.number}</CardTitle>
            <CardDescription>الدور {room.floor?.number} - {room.floor?.name || 'بدون اسم'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <div className="font-semibold text-sm">{room.type?.name}</div>
          <div className="text-xs text-neutral-600">
                {room.type?.code} • {room.type?.capacity} ضيوف • ${room.type?.base_price}
          </div>
          {(room.type?.area || room.type?.beds_count || room.type?.amenities?.length) && (
            <div className="text-xs text-neutral-500 mt-1">
                  {room.type?.area ? `${room.type.area} م²` : ''}
                  {room.type?.area && room.type?.beds_count ? ' • ' : ''}
                  {room.type?.beds_count ? `${room.type.beds_count} سرير` : ''}
                  {(room.type?.area || room.type?.beds_count) && room.type?.amenities?.length ? ' • ' : ''}
                  {room.type?.amenities?.length ? room.type.amenities.join(', ') : ''}
            </div>
          )}
        </div>
        <div className="text-sm">{room.beds} سرير</div>
        <Badge style={{ backgroundColor: getStatusColor(room.status) }} className="text-white">
          {getStatusName(room.status)}
        </Badge>
        {room.notes && (
          <div className="text-xs italic text-neutral-500">"{room.notes}"</div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => handleView(room)}>عرض</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(room)}>تعديل</Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(room.id)}>حذف</Button>
        </div>
      </CardFooter>
    </Card>
  )

  const handleView = (room: any) => {
    setSelectedRoom(room)
    setOpenDetailsDialog(true)
  }

  const handleChangeStatus = async () => {
    if (!selectedRoom) return
    try {
      setSavingStatus(true)
      const payload = {
        number: selectedRoom.number,
        floor_id: selectedRoom.floor_id,
        room_type_id: selectedRoom.room_type_id,
        room_status_id: selectedRoom.room_status_id,
        beds: selectedRoom.beds,
        notes: selectedRoom.notes || ''
      }
      await apiClient.put(`/rooms/${selectedRoom.id}`, payload)
      setSuccess('تم تحديث حالة الغرفة')
      setOpenDetailsDialog(false)
      setSelectedRoom(null)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل تحديث الحالة')
    } finally {
      setSavingStatus(false)
    }
  }

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="rounded-xl border bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">إدارة الغرف</h1>
            <p className="opacity-90">إدارة وتنظيم غرف الفندق بسهولة</p>
          </div>
          <div className="text-6xl opacity-70">🏨</div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-12 md:col-span-4">
              <Label>البحث</Label>
              <Input
              placeholder="البحث عن غرفة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-span-6 md:col-span-2">
              <Label>الدور</Label>
              <Select value={filterFloor} onValueChange={setFilterFloor}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأدوار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  {floors.map((floor: any) => (
                    <SelectItem key={floor.id} value={String(floor.id)}>الدور {floor.number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-6 md:col-span-2">
              <Label>النوع</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {roomTypes.map((type: any) => (
                    <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-6 md:col-span-2">
              <Label>الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {roomStatuses.map((status: any) => (
                    <SelectItem key={status.id} value={String(status.id)}>{status.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-6 md:col-span-2 flex gap-2">
              <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                {viewMode === 'grid' ? 'قائمة' : 'شبكة'}
              </Button>
              <Button variant="outline" onClick={clearFilters}>مسح</Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-neutral-600">
            إجمالي الغرف: {rooms.length} | المعروضة: {filteredRooms.length}
            </div>
            <Button onClick={() => setOpenDialog(true)}>إضافة غرفة جديدة</Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-12 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="col-span-12 sm:col-span-6 md:col-span-4">
              <div className="h-64 rounded-lg border bg-white animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-12 gap-3">
              {displayedRooms.map((room: any) => (
                <div key={room.id} className="col-span-12 sm:col-span-6 md:col-span-4">
                  <RoomCard room={room} />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الغرفة</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الأسرة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRooms.map((room: any) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-semibold">غرفة {room.number}</TableCell>
                      <TableCell>الدور {room.floor?.number}</TableCell>
                      <TableCell>{room.type?.name}</TableCell>
                      <TableCell>{room.beds}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: getStatusColor(room.status) }} className="text-white">
                          {getStatusName(room.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(room)}>عرض</Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(room)}>تعديل</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(room.id)}>حذف</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {filteredRooms.length === 0 && !loading && (
            <Card className="p-10 text-center">
              <div className="text-7xl mb-2">🏨</div>
              <h3 className="text-neutral-600 mb-2">لا توجد غرف متاحة</h3>
              <p className="text-sm text-neutral-500 mb-4">
                {searchTerm || filterFloor || filterType || filterStatus 
                  ? 'لم يتم العثور على غرف تطابق معايير البحث'
                  : 'ابدأ بإضافة غرف جديدة للفندق'}
              </p>
              {!(searchTerm || filterFloor || filterType || filterStatus) && (
                <Button onClick={() => setOpenDialog(true)}>إضافة غرفة جديدة</Button>
              )}
            </Card>
          )}

          {filteredRooms.length > 0 && (
            <div className="flex justify-end gap-2 items-center">
              <span className="text-sm">الصفحة: {page + 1}</span>
              <Select value={String(rowsPerPage)} onValueChange={(v: string) => { setRowsPerPage(parseInt(v)); setPage(0); }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {[6, 9, 12, 24].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                </SelectContent>
                  </Select>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))}>السابق</Button>
                <Button variant="outline" size="sm" disabled={(page + 1) * rowsPerPage >= filteredRooms.length} onClick={() => setPage((p) => p + 1)}>التالي</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'تعديل غرفة' : 'إضافة غرفة جديدة'}</DialogTitle>
            <DialogDescription>{editingRoom ? 'تحديث بيانات الغرفة' : 'إنشاء غرفة جديدة في الفندق'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>رقم الغرفة</Label>
                <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="مثل: 101, 201" required />
              </div>
              <div>
                <Label>عدد الأسرة</Label>
                <Input type="number" min={1} max={10} value={form.beds} onChange={(e) => setForm({ ...form, beds: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الدور</Label>
                <Select value={form.floor_id} onValueChange={(v: string) => setForm({ ...form, floor_id: v })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map((floor: any) => (
                      <SelectItem key={floor.id} value={String(floor.id)}>الدور {floor.number} {floor.name ? `- ${floor.name}` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                        </Select>
              </div>
              <div>
                <Label>نوع الغرفة</Label>
                <Select value={form.room_type_id} onValueChange={(v: string) => setForm({ ...form, room_type_id: v })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type: any) => (
                      <SelectItem key={type.id} value={String(type.id)}>{type.name} ({type.code})</SelectItem>
                    ))}
                  </SelectContent>
                        </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>حالة الغرفة</Label>
                <Select value={form.room_status_id} onValueChange={(v: string) => setForm({ ...form, room_status_id: v })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomStatuses.map((status: any) => (
                      <SelectItem key={status.id} value={String(status.id)}>{status.name} ({status.code})</SelectItem>
                    ))}
                  </SelectContent>
                        </Select>
              </div>
              <div>
                <Label>ملاحظات</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="أضف ملاحظات..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>إلغاء</Button>
              <Button type="submit" disabled={loading}>{loading ? 'جارٍ الحفظ...' : (editingRoom ? 'تحديث' : 'إنشاء')}</Button>
            </DialogFooter>
          </form>
          </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        <DialogContent>
          <DialogHeader>
        <DialogTitle>تفاصيل الغرفة</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-neutral-100 font-semibold">{selectedRoom.number}</div>
                <div>
                  <div className="font-bold">غرفة {selectedRoom.number}</div>
                  <div className="text-sm text-neutral-500">الدور {selectedRoom.floor?.number} • {selectedRoom.type?.name}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>حالة الغرفة</Label>
                  <Select value={String(selectedRoom.room_status_id)} onValueChange={(v: string) => setSelectedRoom({ ...selectedRoom, room_status_id: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomStatuses.map((status: any) => (
                        <SelectItem key={status.id} value={String(status.id)}>{status.name}</SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                </div>
                <div>
                  <Label>ملاحظات</Label>
                  <Input value={selectedRoom.notes || ''} onChange={(e) => setSelectedRoom({ ...selectedRoom, notes: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">معلومات</div>
                <div className="flex gap-2">
                  <Badge variant="outline">الأسرة: {selectedRoom.beds}</Badge>
                  <Badge variant="outline">النوع: {selectedRoom.type?.code}</Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenDetailsDialog(false); setSelectedRoom(null); }}>إغلاق</Button>
            <Button onClick={handleChangeStatus} disabled={savingStatus}>{savingStatus ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
