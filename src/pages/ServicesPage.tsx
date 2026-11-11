import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, LayoutList, Loader2 } from 'lucide-react'
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

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [formName, setFormName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/services')
      setServices(data)
    } catch {
      // apiClient's interceptor already toasts the error
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (editingService) {
        await apiClient.put(`/services/${editingService.id}`, { name: formName })
        toast.success('تم تحديث الخدمة بنجاح')
      } else {
        await apiClient.post('/services', { name: formName })
        toast.success('تم إضافة الخدمة بنجاح')
      }
      setOpenDialog(false)
      setFormName('')
      setEditingService(null)
      fetchServices()
    } catch {
      // apiClient's interceptor already toasts the error
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (svc: any) => {
    setEditingService(svc)
    setFormName(svc.name)
    setOpenDialog(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await apiClient.delete(`/services/${deleteTarget.id}`)
      toast.success('تم حذف الخدمة بنجاح')
      setDeleteTarget(null)
      fetchServices()
    } catch {
      // apiClient's interceptor already toasts the error
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="الخدمات"
        description="تعريف أنواع الخدمات — طلبات الخدمات تظهر في قائمة الحجوزات"
        icon={<LayoutList className="size-6 text-primary" />}
      />

      <Card className="border-border/40 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <Button onClick={() => {
              setEditingService(null)
              setFormName('')
              setOpenDialog(true)
            }}>
              <Plus className="size-4 mr-2" />
              إضافة خدمة
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-center font-bold w-16">#</TableHead>
                  <TableHead className="font-bold text-right">اسم الخدمة</TableHead>
                  <TableHead className="text-center font-bold w-32">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <Skeleton className="h-8 w-full max-w-sm mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12">
                      <p className="text-muted-foreground">لا توجد أقسام خدمات. ابدأ بإضافة قسم جديد.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((svc: any, index: number) => (
                    <TableRow key={svc.id}>
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {svc.name}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(svc)} className="h-8 w-8 p-0">
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(svc)} className="h-8 w-8 p-0">
                            <Trash2 className="size-4" />
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
            <DialogTitle>{editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</DialogTitle>
            <DialogDescription>أدخل اسم قسم الخدمة (مثل: نظافة، طعام، غسيل ملابس)</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">اسم الخدمة *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="h-11 mt-1"
                placeholder="مثال: خدمة الغرف"
              />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} className="w-full sm:w-auto h-11">
                إلغاء
              </Button>
              <Button type="submit" disabled={loading || !formName.trim()} className="w-full sm:w-auto h-11">
                {loading ? 'جارٍ الحفظ...' : (editingService ? 'تحديث' : 'إنشاء')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>حذف الخدمة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف «{deleteTarget?.name}»؟ لا يمكن حذف خدمة مرتبطة بطلبات.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting} className="w-full sm:w-auto">
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="w-full sm:w-auto">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
