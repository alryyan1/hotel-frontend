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
import { Skeleton } from '@/components/ui/skeleton'

export default function RoomTypes() {
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRoomType, setEditingRoomType] = useState<any>(null)
  const [form, setForm] = useState({
    name: '',
  })

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

      if (editingRoomType) {
        await apiClient.put(`/room-types/${editingRoomType.id}`, form)
        toast.success('تم تحديث نوع الغرفة بنجاح')
      } else {
        await apiClient.post('/room-types', form)
        toast.success('تم إنشاء نوع الغرفة بنجاح')
      }

      setOpenDialog(false)
      setForm({ name: '' })
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
    setForm({ name: roomType.name })
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
    setForm({ name: '' })
    setEditingRoomType(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة أنواع الغرف"
        description="إضافة وتعديل أنواع الغرف"
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
                  <TableHead className="text-center font-bold">الاسم</TableHead>
                  <TableHead className="text-center font-bold min-w-[80px]">عدد الغرف</TableHead>
                  <TableHead className="text-center font-bold">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-20 mx-auto" />
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
                    <TableCell colSpan={3} className="text-center py-12">
                      <div className="text-5xl mb-3 opacity-50">🏷️</div>
                      <p className="text-muted-foreground">لا توجد أنواع غرف. ابدأ بإضافة نوع جديد.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  roomTypes.map((roomType: any) => (
                    <TableRow key={roomType.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-center">{roomType.name}</TableCell>
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

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editingRoomType ? 'تعديل نوع غرفة' : 'إضافة نوع غرفة جديد'}</DialogTitle>
            <DialogDescription className="text-sm">{editingRoomType ? 'تحديث بيانات نوع الغرفة' : 'إنشاء نوع غرفة جديد'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">الاسم *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                required
                className="h-11"
                placeholder="مثل: غرفة عادية، جناح"
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
