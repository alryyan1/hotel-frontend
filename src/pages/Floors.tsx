import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">إدارة الأدوار</h2>
        <Button onClick={() => setOpenDialog(true)}>إضافة دور</Button>
      </div>

      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}
      {success && (
        <Alert><AlertDescription className="text-green-700">{success}</AlertDescription></Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الدور</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>عدد الغرف</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floors.map((floor: any) => (
                  <TableRow key={floor.id}>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">{floor.number}</span>
                    </TableCell>
                    <TableCell>{floor.name || '-'}</TableCell>
                    <TableCell>{floor.description || '-'}</TableCell>
                    <TableCell>{floor.rooms_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(floor)}>تعديل</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(floor.id)}>حذف</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFloor ? 'تعديل دور' : 'إضافة دور جديد'}</DialogTitle>
            <DialogDescription>{editingFloor ? 'تحديث بيانات الدور' : 'إنشاء دور جديد'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>رقم الدور</Label>
              <Input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
            </div>
            <div>
              <Label>اسم الدور</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>الوصف</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>إلغاء</Button>
              <Button type="submit" disabled={loading}>{loading ? 'جارٍ الحفظ...' : (editingFloor ? 'تحديث' : 'إنشاء')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}



