import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/ui/page-header'
import { Plus } from 'lucide-react'

export default function Floors() {
  const [floors, setFloors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
      setError('Failed to fetch floors')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')

      if (editingFloor) {
        await apiClient.put(`/floors/${editingFloor.id}`, form)
        setSuccess('Floor updated successfully')
      } else {
        await apiClient.post('/floors', form)
        setSuccess('Floor created successfully')
      }

      setOpenDialog(false)
      setForm({ number: '', name: '', description: '' })
      setEditingFloor(null)
      fetchFloors()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Operation failed')
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
      setSuccess('Floor deleted successfully')
      fetchFloors()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
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
    <div className="space-y-6">
      <PageHeader
        title="إدارة الأدوار"
        description="إضافة وتعديل وحذف أدوار الفندق"
        icon="🏢"
        action={
          <Button onClick={() => setOpenDialog(true)} className="shadow-md">
            <Plus className="size-4 mr-2" />
            إضافة دور
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}
      {success && (
        <Alert><AlertDescription className="text-green-700">{success}</AlertDescription></Alert>
      )}

      <Card className="border-border/40 shadow-lg">
        <CardContent className="pt-4 sm:pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground font-medium">
              <span className="text-foreground font-bold">{floors.length}</span> دور
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-bold min-w-[120px]">رقم الدور</TableHead>
                  <TableHead className="font-bold hidden sm:table-cell">الاسم</TableHead>
                  <TableHead className="font-bold hidden md:table-cell">الوصف</TableHead>
                  <TableHead className="font-bold min-w-[100px]">عدد الغرف</TableHead>
                  <TableHead className="font-bold text-center min-w-[150px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="text-5xl mb-3 opacity-50">🏢</div>
                      <p className="text-muted-foreground">لا توجد أدوار. ابدأ بإضافة دور جديد.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  floors.map((floor: any) => (
                    <TableRow key={floor.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center rounded-lg border border-primary/20 px-3 py-1.5 text-sm font-bold bg-primary/10 text-primary shadow-sm w-fit">
                            {floor.number}
                          </span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {floor.name || 'بدون اسم'} • {floor.rooms_count || 0} غرفة
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium hidden sm:table-cell">{floor.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{floor.description || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                          {floor.rooms_count || 0} غرفة
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 justify-center">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(floor)} className="hover:bg-primary/10 h-8 px-2 text-xs">
                            تعديل
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(floor.id)} className="h-8 px-2 text-xs">
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

      {/* Create/Edit Dialog - Mobile Responsive */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editingFloor ? 'تعديل دور' : 'إضافة دور جديد'}</DialogTitle>
            <DialogDescription className="text-sm">{editingFloor ? 'تحديث بيانات الدور' : 'إنشاء دور جديد'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">رقم الدور</Label>
              <Input 
                type="number" 
                value={form.number} 
                onChange={(e) => setForm({ ...form, number: e.target.value })} 
                required 
                className="h-11"
                placeholder="مثل: 1, 2, 3"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">اسم الدور (اختياري)</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                className="h-11"
                placeholder="مثل: الطابق الأرضي، الطابق الأول"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">الوصف (اختياري)</Label>
              <Input 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                className="h-11"
                placeholder="وصف مختصر للدور"
              />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto h-11">
                إلغاء
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11">
                {loading ? 'جارٍ الحفظ...' : (editingFloor ? 'تحديث' : 'إنشاء')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}



