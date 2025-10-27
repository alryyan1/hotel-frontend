import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import apiClient from '../api/axios'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
      setError('فشل في تحميل حالات الغرف')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      
      if (editingRoomStatus) {
        await apiClient.put(`/room-statuses/${editingRoomStatus.id}`, form)
        setSuccess('تم تحديث حالة الغرفة بنجاح')
      } else {
        await apiClient.post('/room-statuses', form)
        setSuccess('تم إنشاء حالة الغرفة بنجاح')
      }
      
      setOpenDialog(false)
      setForm({ code: '', name: '', color: '#2196f3' })
      setEditingRoomStatus(null)
      fetchRoomStatuses()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشلت العملية')
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
      setSuccess('تم حذف حالة الغرفة بنجاح')
      fetchRoomStatuses()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل الحذف')
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
    <div className="space-y-6">
      <PageHeader
        title="إدارة حالات الغرف"
        description="ضبط الحالات والألوان لتمييز حالة كل غرفة"
        icon="✅"
        action={
          <Button onClick={() => setOpenDialog(true)} className="shadow-md">
            <Plus className="size-4 mr-2" />
            إضافة حالة غرفة
          </Button>
        }
      />

      {error && <Alert variant="destructive" className="shadow-md"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="shadow-md border-green-200 bg-green-50"><AlertDescription className="text-green-700 font-medium">{success}</AlertDescription></Alert>}

      <Card className="border-border/40 shadow-lg">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground font-medium">
              الإجمالي: <span className="text-foreground font-bold">{roomStatuses.length}</span> حالة
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-border/40">
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
                            <Edit className="size-3" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(roomStatus.id)}>
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

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoomStatus ? 'تعديل حالة غرفة' : 'إضافة حالة غرفة جديدة'}</DialogTitle>
            <DialogDescription>{editingRoomStatus ? 'تحديث بيانات حالة الغرفة' : 'إنشاء حالة غرفة جديدة'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الرمز *</Label>
                <Input 
                  value={form.code} 
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                  placeholder="AVAIL, OCCUPIED" 
                  required 
                />
              </div>
              <div>
                <Label>الاسم *</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required 
                />
              </div>
            </div>
            <div>
              <Label>اللون</Label>
              <Select value={form.color} onValueChange={(v: string) => setForm({ ...form, color: v })}>
                <SelectTrigger>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>إلغاء</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'جارٍ الحفظ...' : (editingRoomStatus ? 'تحديث' : 'إنشاء')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
