import { useState, useEffect } from 'react'
import apiClient from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRoom: any | null
  floors: any[]
  roomTypes: any[]
  roomStatuses: any[]
  onSuccess: (roomId?: number) => void
  onError: (message: string) => void
}

export default function CreateRoomDialog({
  open,
  onOpenChange,
  editingRoom,
  floors,
  roomTypes,
  roomStatuses,
  onSuccess,
  onError
}: CreateRoomDialogProps) {
  const [form, setForm] = useState({
    number: '',
    floor_id: '',
    room_type_id: '',
    room_status_id: '',
    beds: 1,
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  // Update form when editingRoom changes
  useEffect(() => {
    if (editingRoom) {
      setForm({
        number: editingRoom.number,
        floor_id: String(editingRoom.floor_id),
        room_type_id: String(editingRoom.room_type_id),
        room_status_id: String(editingRoom.room_status_id),
        beds: editingRoom.beds,
        notes: editingRoom.notes || ''
      })
    } else {
      setForm({
        number: '',
        floor_id: '',
        room_type_id: '',
        room_status_id: '',
        beds: 1,
        notes: ''
      })
    }
  }, [editingRoom, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      onError('')
      
      if (!form.number?.trim()) {
        onError('رقم الغرفة مطلوب')
        return
      }
      if (!form.floor_id || !form.room_type_id || !form.room_status_id) {
        onError('الرجاء اختيار الدور، نوع الغرفة، وحالة الغرفة')
        return
      }
      if (parseInt(form.beds) < 1 || parseInt(form.beds) > 10) {
        onError('عدد الأسرة يجب أن يكون بين 1 و 10')
        return
      }
      
      const submitData = { ...form, beds: parseInt(form.beds) }
      
      let roomId: number | undefined
      if (editingRoom) {
        await apiClient.put(`/rooms/${editingRoom.id}`, submitData)
        roomId = editingRoom.id
      } else {
        const response = await apiClient.post('/rooms', submitData)
        roomId = response.data.id
      }
      
      onOpenChange(false)
      onSuccess(roomId)
    } catch (err: any) {
      onError(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm({
      number: '',
      floor_id: '',
      room_type_id: '',
      room_status_id: '',
      beds: 1,
      notes: ''
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {editingRoom ? 'تعديل غرفة' : 'إضافة غرفة جديدة'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {editingRoom ? 'تحديث بيانات الغرفة' : 'إنشاء غرفة جديدة في الفندق'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">رقم الغرفة</Label>
              <Input 
                value={form.number} 
                onChange={(e) => setForm({ ...form, number: e.target.value })} 
                placeholder="مثل: 101, 201" 
                required 
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">عدد الأسرة</Label>
              <Input 
                type="number" 
                min={1} 
                max={10} 
                value={form.beds} 
                onChange={(e) => setForm({ ...form, beds: e.target.value })} 
                required 
                className="h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">الدور</Label>
              <Select value={form.floor_id} onValueChange={(v: string) => setForm({ ...form, floor_id: v })} required>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((floor: any) => (
                    <SelectItem key={floor.id} value={String(floor.id)}>
                      الدور {floor.number} {floor.name ? `- ${floor.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">نوع الغرفة</Label>
              <Select value={form.room_type_id} onValueChange={(v: string) => setForm({ ...form, room_type_id: v })} required>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((type: any) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.name} ({type.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">حالة الغرفة</Label>
              <Select value={form.room_status_id} onValueChange={(v: string) => setForm({ ...form, room_status_id: v })} required>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {roomStatuses.map((status: any) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.name} ({status.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium">ملاحظات</Label>
              <Textarea 
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                placeholder="أضف ملاحظات..." 
                rows={3} 
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto h-11">
              إلغاء
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11">
              {loading ? 'جارٍ الحفظ...' : (editingRoom ? 'تحديث' : 'إنشاء')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

