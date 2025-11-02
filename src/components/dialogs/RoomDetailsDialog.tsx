import { useState, useEffect } from 'react'
import apiClient from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface RoomDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedRoom: any | null
  roomStatuses: any[]
  onSuccess: (roomId?: number) => void
  onError: (message: string) => void
}

export default function RoomDetailsDialog({
  open,
  onOpenChange,
  selectedRoom,
  roomStatuses,
  onSuccess,
  onError
}: RoomDetailsDialogProps) {
  const [room, setRoom] = useState<any>(null)
  const [savingStatus, setSavingStatus] = useState(false)

  // Update room state when selectedRoom changes
  useEffect(() => {
    if (selectedRoom) {
      setRoom({ ...selectedRoom })
    }
  }, [selectedRoom, open])

  const handleChangeStatus = async () => {
    if (!room) return
    
    try {
      setSavingStatus(true)
      const payload = {
        number: room.number,
        floor_id: room.floor_id,
        room_type_id: room.room_type_id,
        room_status_id: room.room_status_id,
        beds: room.beds,
        notes: room.notes || ''
      }
      await apiClient.put(`/rooms/${room.id}`, payload)
      onOpenChange(false)
      onSuccess(room.id)
    } catch (err: any) {
      onError(err?.response?.data?.message || 'فشل تحديث الحالة')
    } finally {
      setSavingStatus(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!room) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">تفاصيل الغرفة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
              {room.number}
            </div>
            <div>
              <div className="font-bold text-lg">غرفة {room.number}</div>
              <div className="text-sm text-muted-foreground">
                الدور {room.floor?.number} • {room.type?.name}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">حالة الغرفة</Label>
              <Select 
                value={String(room.room_status_id)} 
                onValueChange={(v: string) => setRoom({ ...room, room_status_id: v })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roomStatuses.map((status: any) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">ملاحظات</Label>
              <Textarea 
                value={room.notes || ''} 
                onChange={(e) => setRoom({ ...room, notes: e.target.value })} 
                placeholder="أضف ملاحظات..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div>
              <div className="text-sm font-semibold mb-2">معلومات إضافية</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">الأسرة: {room.beds}</Badge>
                <Badge variant="outline" className="text-xs">النوع: {room.type?.code}</Badge>
                <Badge variant="outline" className="text-xs">السعر: ${room.type?.base_price}</Badge>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto h-11">
            إغلاق
          </Button>
          <Button onClick={handleChangeStatus} disabled={savingStatus} className="w-full sm:w-auto h-11">
            {savingStatus ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

