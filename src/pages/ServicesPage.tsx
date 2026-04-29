import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, LayoutList, Calendar, Home } from 'lucide-react'
import apiClient from '../api/axios'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import dayjs from 'dayjs'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [reservationServices, setReservationServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [formName, setFormName] = useState('')

  useEffect(() => {
    fetchServices()
    fetchReservationServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/services')
      setServices(data)
    } catch (err) {
      toast.error('فشل في تحميل أسماء الخدمات')
    } finally {
      setLoading(false)
    }
  }

  const fetchReservationServices = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/reservation-services')
      setReservationServices(data)
    } catch (err) {
      toast.error('فشل في تحميل طلبات الخدمات')
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (svc: any) => {
    setEditingService(svc)
    setFormName(svc.name)
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return

    try {
      setLoading(true)
      await apiClient.delete(`/services/${id}`)
      toast.success('تم حذف الخدمة بنجاح')
      fetchServices()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الحذف، قد تكون الخدمة مرتبطة بطلبات')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReservationService = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف طلب الخدمة هذا؟')) return
    try {
      setLoading(true)
      await apiClient.delete(`/reservation-services/${id}`)
      toast.success('تم حذف طلب الخدمة بنجاح')
      fetchReservationServices()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل حذف طلب الخدمة')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount)
  }


  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="الخدمات"
        description="إدارة الخدمات وطلبات الخدمات للحجوزات"
        icon={<LayoutList className="size-6 text-primary" />}
      />

      <Tabs defaultValue="requests" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
          <TabsTrigger value="requests">الطلبات</TabsTrigger>
          <TabsTrigger value="categories">تعريف الخدمات</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-0">
          <Card className="border-border/40 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">الطلبات المسجلة</h3>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-center font-bold">التاريخ</TableHead>
                      <TableHead className="text-center font-bold">العميل</TableHead>
                      <TableHead className="text-center font-bold">الغرفة</TableHead>
                      <TableHead className="text-center font-bold">الخدمة</TableHead>
                      <TableHead className="text-center font-bold">المبلغ</TableHead>
                      <TableHead className="text-center font-bold">ملاحظات</TableHead>
                      <TableHead className="text-center font-bold">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && reservationServices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Skeleton className="h-8 w-full max-w-sm mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : reservationServices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <LayoutList className="size-12 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-muted-foreground">لا توجد طلبات خدمات حالياً.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      reservationServices.map((req: any) => (
                        <TableRow key={req.id}>
                          <TableCell className="text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <Calendar className="size-3 text-muted-foreground" />
                              <span>{dayjs(req.created_at).format('YYYY-MM-DD')}</span>
                              <span className="text-xs text-muted-foreground">{dayjs(req.created_at).format('hh:mm A')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {req.reservation?.customer?.name || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-semibold">
                              <Home className="size-3 mr-1" />
                              {req.room?.number || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold text-primary">
                            {req.service?.name || '-'}
                          </TableCell>
                          <TableCell className="text-center font-bold text-emerald-600">
                            {formatCurrency(req.amount)}
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground max-w-xs truncate">
                            {req.notes || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteReservationService(req.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
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
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(svc.id)} className="h-8 w-8 p-0">
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
        </TabsContent>
      </Tabs>

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
    </div>
  )
}
