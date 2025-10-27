import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CreateReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: any[]
  selectedRooms: any[]
  form: {
    customer_id: string
    notes: string
  }
  onFormChange: (form: { customer_id: string; notes: string }) => void
  onCreateReservation: () => void
  onOpenCustomerDialog: () => void
  loading: boolean
}

export default function CreateReservationDialog({
  open,
  onOpenChange,
  customers,
  selectedRooms,
  form,
  onFormChange,
  onCreateReservation,
  onOpenCustomerDialog,
  loading
}: CreateReservationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>إنشاء حجز</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-3 mt-1">
          <div className="col-span-12">
            <Label>العميل</Label>
            <Select 
              value={form.customer_id} 
              onValueChange={(v: string) => onFormChange({ ...form, customer_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر العميل" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} — {c.phone || c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-12">
            <Button variant="outline" onClick={onOpenCustomerDialog}>
              عميل جديد
            </Button>
          </div>
          <div className="col-span-12">
            <Label>ملاحظات</Label>
            <Input 
              value={form.notes} 
              onChange={(e) => onFormChange({ ...form, notes: e.target.value })} 
            />
          </div>
          <div className="col-span-12">
            <div className="text-sm font-semibold">الغرف المختارة</div>
            <div className="flex gap-2 flex-wrap mt-1">
              {selectedRooms.map((r: any) => (
                <span key={r.id} className="rounded-full border px-2 py-0.5 text-xs">
                  غرفة {r.number}
                </span>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={onCreateReservation} disabled={loading}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
