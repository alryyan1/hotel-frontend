import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/ui/page-header'
import { Plus, Edit, Trash2, Building } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function Floors() {
  const [floors, setFloors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingFloor, setEditingFloor] = useState<any>(null)
  const [form, setForm] = useState({
    number: '',
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchFloors()
  }, [])

  const fetchFloors = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/floors')
      setFloors(data)
    } catch (err) {
      toast.error('Failed to fetch floors')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)

      if (editingFloor) {
        await apiClient.put(`/floors/${editingFloor.id}`, form)
        toast.success('Floor updated successfully')
      } else {
        await apiClient.post('/floors', form)
        toast.success('Floor created successfully')
      }

      setOpenDialog(false)
      setForm({ number: '', name: '', description: '' })
      setEditingFloor(null)
      fetchFloors()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (floor: any) => {
    setEditingFloor(floor)
    setForm({
      number: floor.number,
      name: floor.name || '',
      description: floor.description || ''
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this floor?')) return

    try {
      setLoading(true)
      await apiClient.delete(`/floors/${id}`)
      toast.success('Floor deleted successfully')
      fetchFloors()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setForm({ number: '', name: '', description: '' })
    setEditingFloor(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <PageHeader
        title="إدارة الأدوار"
        description="إضافة وتعديل وحذف أدوار الفندق"
        icon="🏢"
        action={
          <Button 
            onClick={() => setOpenDialog(true)} 
            className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm font-medium shadow-md"
          >
            <Plus className="size-4 sm:size-4 mr-2" />
            إضافة دور
          </Button>
        }
      />

      <Card className="border-border/40 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground font-medium">
              <span className="text-foreground font-bold">{floors.length}</span> دور
            </div>
          </div>

          {/* Mobile-first card layout */}
          <div className="block lg:hidden space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full mb-3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 flex-1" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : floors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3 opacity-50">🏢</div>
                <p className="text-muted-foreground">لا توجد أدوار. ابدأ بإضافة دور جديد.</p>
              </div>
            ) : (
              floors.map((floor: any) => (
                <Card key={floor.id} className="border-border/40 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold">الطابق {floor.number}</span>
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                              {floor.rooms_count || 0} غرفة
                            </span>
                          </div>
                          {floor.name && (
                            <p className="text-sm font-medium text-foreground">{floor.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {floor.description && (
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                        {floor.description}
                      </p>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(floor)} 
                        className="flex-1 h-9 text-sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        تعديل
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(floor.id)} 
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
                  <TableHead className="font-bold text-center">رقم الطابق</TableHead>
                  <TableHead className="font-bold text-center">الاسم</TableHead>
                  <TableHead className="font-bold text-center">الوصف</TableHead>
                  <TableHead className="font-bold text-center ">عدد الغرف</TableHead>
                  <TableHead className="font-bold text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-12 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-24 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-4 w-32 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-16 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : floors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="text-5xl mb-3 opacity-50">🏢</div>
                      <p className="text-muted-foreground">لا توجد أدوار. ابدأ بإضافة دور جديد.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  floors.map((floor: any) => (
                    <TableRow key={floor.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="text-center">
                        <span className="inline-flex items-center rounded-lg border border-primary/20 px-3 py-1.5 text-sm font-bold bg-primary/10 text-primary shadow-sm">
                          {floor.number}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-center">{floor.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-center">{floor.description || '-'}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-center">
                          {floor.rooms_count || 0} غرفة
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(floor)} className="hover:bg-primary/10">
                            <Edit className="w-4 h-4 mr-2" />
                            تعديل
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(floor.id)}>
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
            <DialogTitle className="text-xl font-bold">{editingFloor ? 'تعديل دور' : 'إضافة دور جديد'}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingFloor ? 'تحديث بيانات الطابق' : 'إنشاء دور جديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">رقم الطابق *</Label>
              <Input
                type="text"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                required
                className="h-12 text-base"
                placeholder="مثل: 1, 2, 1-1"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">اسم الطابق</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                className="h-12 text-base"
                placeholder="مثل: الطابق الأرضي، الطابق الأول"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">الوصف</Label>
              <Input 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                className="h-12 text-base"
                placeholder="وصف مختصر للدور"
                autoComplete="off"
              />
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
                {loading ? 'جارٍ الحفظ...' : (editingFloor ? 'تحديث' : 'إنشاء')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}



