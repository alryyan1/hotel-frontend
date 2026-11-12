import { useState, useEffect } from 'react'
import apiClient from '../../api/axios'
import { toast } from 'sonner'
import { Loader2, Package, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import InventoryItemPicker from '@/components/inventory/InventoryItemPicker'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateInventoryOrderDialogProps {
  open: boolean
  onClose: () => void
  inventory: any[]
  onSuccess: () => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function CreateInventoryOrderDialog({
  open,
  onClose,
  inventory,
  onSuccess,
  loading,
  setLoading
}: CreateInventoryOrderDialogProps) {
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [orderForm, setOrderForm] = useState({
    order_date: dayjs().format('YYYY-MM-DD'),
    notes: ''
  })

  useEffect(() => {
    if (open) {
      setOrderItems([])
      setOrderForm({
        order_date: dayjs().format('YYYY-MM-DD'),
        notes: ''
      })
    }
  }, [open])

  const handleAddItem = (item: any) => {
    const exists = orderItems.find((orderItem: any) => orderItem.inventory_id === item.id)
    if (!exists) {
      setOrderItems([...orderItems, {
        inventory_id: item.id,
        inventory: item,
        quantity: '1',
        notes: ''
      }])
    } else {
      toast.error('هذا العنصر موجود بالفعل في الطلب')
    }
  }

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handleUpdateItemQuantity = (index: number, quantity: string) => {
    const newItems = [...orderItems]
    newItems[index].quantity = quantity
    setOrderItems(newItems)
  }

  const handleUpdateItemNotes = (index: number, notes: string) => {
    const newItems = [...orderItems]
    newItems[index].notes = notes
    setOrderItems(newItems)
  }

  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      toast.error('يرجى إضافة عنصر واحد على الأقل')
      return
    }

    try {
      setLoading(true)
      const payload = {
        order_date: orderForm.order_date,
        notes: orderForm.notes || null,
        items: orderItems.map((item: any) => ({
          inventory_id: item.inventory_id,
          quantity: parseFloat(item.quantity),
          notes: item.notes || null
        }))
      }

      await apiClient.post('/inventory-orders', payload)
      toast.success('تم إنشاء الطلب بنجاح')
      onClose()
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل إنشاء الطلب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>إنشاء طلب من المخزون</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="order-date">تاريخ الطلب *</Label>
              <Input
                id="order-date"
                type="date"
                value={orderForm.order_date}
                onChange={(e) => setOrderForm({ ...orderForm, order_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>إضافة عنصر</Label>
              <InventoryItemPicker inventory={inventory} onPick={handleAddItem} placeholder="اختر عنصر لإضافته للطلب" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">عناصر الطلب ({orderItems.length})</div>
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed py-6 text-sm text-muted-foreground">
                <Package className="size-6 opacity-50" />
                لم تتم إضافة عناصر بعد
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {orderItems.map((item: any, index: number) => (
                  <div key={item.inventory_id} className="grid gap-2 p-3 sm:grid-cols-[1fr_110px_1fr_auto] sm:items-center">
                    <div className="font-medium">{item.inventory?.name || '-'}</div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItemQuantity(index, e.target.value)}
                      aria-label="الكمية"
                      placeholder="الكمية"
                    />
                    <Input
                      value={item.notes}
                      onChange={(e) => handleUpdateItemNotes(index, e.target.value)}
                      placeholder="ملاحظات"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="justify-self-end text-destructive hover:text-destructive"
                      onClick={() => handleRemoveItem(index)}
                      aria-label="حذف"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="order-notes">ملاحظات</Label>
            <Textarea
              id="order-notes"
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              rows={3}
              placeholder="ملاحظات على الطلب (اختياري)"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading || orderItems.length === 0}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء الطلب'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
