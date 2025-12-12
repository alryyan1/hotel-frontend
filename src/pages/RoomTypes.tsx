import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import apiClient from '../api/axios'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

export default function RoomTypes() {
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRoomType, setEditingRoomType] = useState<any>(null)
  const [form, setForm] = useState({
    code: '',
    name: '',
    capacity: 1,
    base_price: 0,
    description: '',
    area: '',
    beds_count: '',
    amenities: [] as string[]
  })

  // Helper function to format numbers with thousands separator
  const formatNumber = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '-'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '-'
    return num.toLocaleString('en-US')
  }

  useEffect(() => {
    fetchRoomTypes()
  }, [])

  const fetchRoomTypes = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/room-types')
      setRoomTypes(data)
    } catch (err) {
      toast.error('فشل في تحميل أنواع الغرف')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      const submitData = {
        ...form,
        capacity: parseInt(String(form.capacity)),
        base_price: parseFloat(String(form.base_price)),
        area: form.area === '' ? null : parseInt(String(form.area)),
        beds_count: form.beds_count === '' ? null : parseInt(String(form.beds_count)),
        amenities: form.amenities
      }
      
      if (editingRoomType) {
        await apiClient.put(`/room-types/${editingRoomType.id}`, submitData)
        toast.success('تم تحديث نوع الغرفة بنجاح')
      } else {
        await apiClient.post('/room-types', submitData)
        toast.success('تم إنشاء نوع الغرفة بنجاح')
      }
      
      setOpenDialog(false)
      setForm({ code: '', name: '', capacity: 1, base_price: 0, description: '', area: '', beds_count: '', amenities: [] })
      setEditingRoomType(null)
      fetchRoomTypes()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (roomType: any) => {
    setEditingRoomType(roomType)
    setForm({
      code: roomType.code,
      name: roomType.name,
      capacity: roomType.capacity,
      base_price: roomType.base_price,
      description: roomType.description || '',
      area: roomType.area ?? '',
      beds_count: roomType.beds_count ?? '',
      amenities: Array.isArray(roomType.amenities) ? roomType.amenities : []
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف نوع الغرفة هذا؟')) return
    
    try {
      setLoading(true)
      await apiClient.delete(`/room-types/${id}`)
      toast.success('تم حذف نوع الغرفة بنجاح')
      fetchRoomTypes()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setForm({ code: '', name: '', capacity: 1, base_price: 0, description: '', area: '', beds_count: '', amenities: [] })
    setEditingRoomType(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة أنواع الغرف"
        description="إضافة وتعديل أنواع الغرف والمرافق"
        icon="🏷️"
        action={
          <Button onClick={() => setOpenDialog(true)} className="shadow-md">
            <Plus className="size-4 mr-2" />
            إضافة نوع غرفة
          </Button>
        }
      />


      <Card className="border-border/40 shadow-lg">
        <CardContent className="pt-4 sm:pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground font-medium">
              الإجمالي: <span className="text-foreground font-bold">{roomTypes.length}</span> نوع
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-center font-bold">الرمز</TableHead>
                  <TableHead className="text-center font-bold">الاسم</TableHead>
                  <TableHead className="text-center   font-bold hidden sm:table-cell">السعة</TableHead>
                  <TableHead className="text-center   font-bold hidden md:table-cell">السعر</TableHead>
                  <TableHead className="text-center   font-bold hidden lg:table-cell">المساحة</TableHead>
                  <TableHead className="text-center   font-bold hidden lg:table-cell">الأسرة</TableHead>
                  <TableHead className="text-center   font-bold hidden xl:table-cell">المرافق</TableHead>
                  <TableHead className="text-center   font-bold min-w-[80px]">عدد الغرف</TableHead>
                  <TableHead className="text-center   font-bold ">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center">
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-5 w-12 mx-auto" />
                          <Skeleton className="h-3 w-24 mx-auto sm:hidden" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col">
                          <Skeleton className="h-5 w-20 mx-auto" />
                          <Skeleton className="h-3 w-32 mx-auto sm:hidden" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        <Skeleton className="h-6 w-16 mx-auto" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">
                        <Skeleton className="h-5 w-16 mx-auto" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <Skeleton className="h-4 w-8 mx-auto" />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Skeleton className="h-4 w-32 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-12 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : roomTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="text-5xl mb-3 opacity-50">🏷️</div>
                      <p className="text-muted-foreground">لا توجد أنواع غرف. ابدأ بإضافة نوع جديد.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  roomTypes.map((roomType: any) => (
                    <TableRow key={roomType.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="text-center">
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="font-bold w-fit">{roomType.code}</Badge>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {roomType.name} • {formatNumber(roomType.base_price)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-center">
                        <div className="flex flex-col">
                          <span>{roomType.name}</span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {formatNumber(roomType.capacity)} ضيوف • {formatNumber(roomType.rooms_count || 0)} غرفة
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        <Badge variant="outline">{formatNumber(roomType.capacity)} ضيوف</Badge>
                      </TableCell>
                      <TableCell className="font-semibold hidden md:table-cell text-center">{formatNumber(roomType.base_price)}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell text-center">{roomType.area ? `${formatNumber(roomType.area)} م²` : '-'}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell text-center">{formatNumber(roomType.beds_count)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate hidden xl:table-cell">
                        {Array.isArray(roomType.amenities) && roomType.amenities.length 
                          ? roomType.amenities.join(', ') 
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                          {formatNumber(roomType.rooms_count || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(roomType)} className="hover:bg-primary/10 h-8 px-2">
                            <Edit className="size-3" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(roomType.id)} className="h-8 px-2">
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog - Mobile Responsive */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editingRoomType ? 'تعديل نوع غرفة' : 'إضافة نوع غرفة جديد'}</DialogTitle>
            <DialogDescription className="text-sm">{editingRoomType ? 'تحديث بيانات نوع الغرفة' : 'إنشاء نوع غرفة جديد'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">الرمز *</Label>
                <Input 
                  value={form.code} 
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                  placeholder="STD, DEL, SUITE" 
                  required 
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">الاسم *</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required 
                  className="h-11"
                  placeholder="مثل: غرفة عادية، جناح"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">السعة (عدد الضيوف) *</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={10}
                  value={form.capacity} 
                  onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} 
                  required 
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">السعر الأساسي *</Label>
                <Input 
                  type="number" 
                  min={0} 
                  step={0.01}
                  value={form.base_price} 
                  onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })} 
                  required 
                  className="h-11"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">المساحة (م²)</Label>
                <Input 
                  type="number" 
                  min={0}
                  value={form.area} 
                  onChange={(e) => setForm({ ...form, area: e.target.value })} 
                  className="h-11"
                  placeholder="مثل: 25"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">عدد الأسرة</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={10}
                  value={form.beds_count} 
                  onChange={(e) => setForm({ ...form, beds_count: e.target.value })} 
                  className="h-11"
                  placeholder="مثل: 2"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">المرافق (افصل بينها بفاصلة)</Label>
              <Input 
                value={Array.isArray(form.amenities) ? form.amenities.join(', ') : ''} 
                onChange={(e) => setForm({ ...form, amenities: e.target.value.split(',').map(a => a.trim()).filter(Boolean) })} 
                placeholder="تكييف، ثلاجة، واي فاي، شرفة"
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">الوصف</Label>
              <Textarea 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                rows={3}
                className="resize-none"
                placeholder="وصف مختصر لنوع الغرفة"
              />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto h-11">
                إلغاء
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11">
                {loading ? 'جارٍ الحفظ...' : (editingRoomType ? 'تحديث' : 'إنشاء')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
