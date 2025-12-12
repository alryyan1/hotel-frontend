import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const colorOptions = [
  { value: '#f44336', label: 'أحمر' },
  { value: '#e91e63', label: 'وردي' },
  { value: '#9c27b0', label: 'بنفسجي' },
  { value: '#3f51b5', label: 'نيلي' },
  { value: '#2196f3', label: 'أزرق' },
  { value: '#03a9f4', label: 'أزرق فاتح' },
  { value: '#00bcd4', label: 'سماوي' },
  { value: '#009688', label: 'تركواز' },
  { value: '#4caf50', label: 'أخضر' },
  { value: '#8bc34a', label: 'أخضر فاتح' },
  { value: '#ffeb3b', label: 'أصفر' },
  { value: '#ffc107', label: 'كهرماني' },
  { value: '#ff9800', label: 'برتقالي' },
  { value: '#ff5722', label: 'برتقالي داكن' },
  { value: '#795548', label: 'بني' },
  { value: '#607d8b', label: 'رمادي مزرق' },
]

export default function RoomStatuses() {
  const [roomStatuses, setRoomStatuses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRoomStatus, setEditingRoomStatus] = useState<any>(null)
  const [form, setForm] = useState({
    code: '',
    name: '',
    color: '#2196f3'
  })

  useEffect(() => {
    fetchRoomStatuses()
  }, [])

  const fetchRoomStatuses = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/room-statuses')
      setRoomStatuses(data)
    } catch (err) {
      toast.error('فشل في تحميل حالات الغرف')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      if (editingRoomStatus) {
        await apiClient.put(`/room-statuses/${editingRoomStatus.id}`, form)
        toast.success('تم تحديث حالة الغرفة بنجاح')
      } else {
        await apiClient.post('/room-statuses', form)
        toast.success('تم إنشاء حالة الغرفة بنجاح')
      }
      
      setOpenDialog(false)
      setForm({ code: '', name: '', color: '#2196f3' })
      setEditingRoomStatus(null)
      fetchRoomStatuses()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (roomStatus: any) => {
    setEditingRoomStatus(roomStatus)
    setForm({
      code: roomStatus.code,
      name: roomStatus.name,
      color: roomStatus.color || '#2196f3'
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف حالة الغرفة هذه؟')) return
    
    try {
      setLoading(true)
      await apiClient.delete(`/room-statuses/${id}`)
      toast.success('تم حذف حالة الغرفة بنجاح')
      fetchRoomStatuses()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setForm({ code: '', name: '', color: '#2196f3' })
    setEditingRoomStatus(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <PageHeader
        title="إدارة حالات الغرف"
        description="ضبط الحالات والألوان لتمييز حالة كل غرفة"
        icon="✅"
        action={
          <Button 
            onClick={() => setOpenDialog(true)} 
            className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm font-medium shadow-md"
          >
            <Plus className="size-4 sm:size-4 mr-2" />
            إضافة حالة غرفة
          </Button>
        }
      />

      <Card className="border-border/40 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground font-medium">
              الإجمالي: <span className="text-foreground font-bold">{roomStatuses.length}</span> حالة
            </div>
          </div>

          {/* Mobile-first card layout */}
          <div className="block lg:hidden space-y-3">
            {roomStatuses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3 opacity-50">✅</div>
                <p className="text-muted-foreground">لا توجد حالات غرف. ابدأ بإضافة حالة جديدة.</p>
              </div>
            ) : (
              roomStatuses.map((roomStatus: any) => (
                <Card key={roomStatus.id} className="border-border/40 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              className="text-white font-bold shadow-sm text-sm"
                              style={{ backgroundColor: roomStatus.color || '#2196f3' }}
                            >
                              {roomStatus.code}
                            </Badge>
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                              {roomStatus.rooms_count || 0} غرفة
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{roomStatus.name}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-6 h-6 rounded-md border-2 border-border shadow-sm"
                        style={{ backgroundColor: roomStatus.color || '#2196f3' }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {colorOptions.find(c => c.value === roomStatus.color)?.label || 'مخصص'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(roomStatus)} 
                        className="flex-1 h-9 text-sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        تعديل
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(roomStatus.id)} 
                        className="flex-1 h-9 text-sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop table layout */}
          <div className="hidden lg:block overflow-x-auto rounded-lg border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-bold">الرمز</TableHead>
                  <TableHead className="font-bold">الاسم</TableHead>
                  <TableHead className="font-bold">اللون</TableHead>
                  <TableHead className="font-bold">عدد الغرف</TableHead>
                  <TableHead className="font-bold text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomStatuses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="text-5xl mb-3 opacity-50">✅</div>
                      <p className="text-muted-foreground">لا توجد حالات غرف. ابدأ بإضافة حالة جديدة.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  roomStatuses.map((roomStatus: any) => (
                    <TableRow key={roomStatus.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <Badge 
                          className="text-white font-bold shadow-sm"
                          style={{ backgroundColor: roomStatus.color || '#2196f3' }}
                        >
                          {roomStatus.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{roomStatus.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-md border-2 border-border shadow-sm"
                            style={{ backgroundColor: roomStatus.color || '#2196f3' }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {colorOptions.find(c => c.value === roomStatus.color)?.label || 'مخصص'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                          {roomStatus.rooms_count || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(roomStatus)} className="hover:bg-primary/10">
                            <Edit className="w-4 h-4 mr-2" />
                            تعديل
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(roomStatus.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            حذف
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

      {/* Create/Edit Dialog - Mobile First */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="w-[95vw] max-w-md mx-auto sm:w-full sm:max-w-lg">
          <DialogHeader className="text-center sm:text-right">
            <DialogTitle className="text-xl font-bold">{editingRoomStatus ? 'تعديل حالة غرفة' : 'إضافة حالة غرفة جديدة'}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingRoomStatus ? 'تحديث بيانات حالة الغرفة' : 'إنشاء حالة غرفة جديدة'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">الرمز *</Label>
                <Input 
                  value={form.code} 
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                  placeholder="CLEANING, MAINTENANCE" 
                  required 
                  className="h-12 text-base"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">الاسم *</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required 
                  className="h-12 text-base"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">اللون</Label>
              <Select value={form.color} onValueChange={(v: string) => setForm({ ...form, color: v })}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="flex flex-col gap-3 pt-6 sm:flex-row sm:gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseDialog} 
                className="w-full h-12 text-base font-medium order-2 sm:order-1 sm:w-auto"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 text-base font-medium order-1 sm:order-2 sm:w-auto"
              >
                {loading ? 'جارٍ الحفظ...' : (editingRoomStatus ? 'تحديث' : 'إنشاء')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
