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

interface CreateInventoryReceiptDialogProps {
  open: boolean
  onClose: () => void
  inventory: any[]
  onSuccess: () => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function CreateInventoryReceiptDialog({
  open,
  onClose,
  inventory,
  onSuccess,
  loading,
  setLoading
}: CreateInventoryReceiptDialogProps) {
  const [receiptItems, setReceiptItems] = useState<any[]>([])
  const [receiptForm, setReceiptForm] = useState({
    receipt_date: dayjs().format('YYYY-MM-DD'),
    supplier: '',
    notes: ''
  })

  useEffect(() => {
    if (open) {
      setReceiptItems([])
      setReceiptForm({
        receipt_date: dayjs().format('YYYY-MM-DD'),
        supplier: '',
        notes: ''
      })
    }
  }, [open])

  const handleAddItem = (item: any) => {
    const exists = receiptItems.find((receiptItem: any) => receiptItem.inventory_id === item.id)
    if (!exists) {
      setReceiptItems([...receiptItems, {
        inventory_id: item.id,
        inventory: item,
        quantity_received: '1',
        purchase_price: '',
        notes: ''
      }])
    } else {
      toast.error('هذا العنصر موجود بالفعل في الوارد')
    }
  }

  const handleRemoveItem = (index: number) => {
    setReceiptItems(receiptItems.filter((_, i) => i !== index))
  }

  const handleUpdateItemQuantity = (index: number, quantity: string) => {
    const newItems = [...receiptItems]
    newItems[index].quantity_received = quantity
    setReceiptItems(newItems)
  }

  const handleUpdateItemPrice = (index: number, price: string) => {
    const newItems = [...receiptItems]
    newItems[index].purchase_price = price
    setReceiptItems(newItems)
  }

  const handleUpdateItemNotes = (index: number, notes: string) => {
    const newItems = [...receiptItems]
    newItems[index].notes = notes
    setReceiptItems(newItems)
  }

  const handleSubmit = async () => {
    if (receiptItems.length === 0) {
      toast.error('يرجى إضافة عنصر واحد على الأقل')
      return
    }

    try {
      setLoading(true)
      const payload = {
        receipt_date: receiptForm.receipt_date,
        supplier: receiptForm.supplier || null,
        notes: receiptForm.notes || null,
        items: receiptItems.map((item: any) => ({
          inventory_id: item.inventory_id,
          quantity_received: parseFloat(item.quantity_received),
          purchase_price: item.purchase_price ? parseFloat(item.purchase_price) : null,
          notes: item.notes || null
        }))
      }

      await apiClient.post('/inventory-receipts', payload)
      toast.success('تم إنشاء الوارد بنجاح وتم تحديث المخزون')
      onClose()
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل إنشاء الوارد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>إنشاء وارد للمخزون</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="receipt-date">تاريخ الوارد *</Label>
              <Input
                id="receipt-date"
                type="date"
                value={receiptForm.receipt_date}
                onChange={(e) => setReceiptForm({ ...receiptForm, receipt_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="receipt-supplier">المورد</Label>
              <Input
                id="receipt-supplier"
                value={receiptForm.supplier}
                onChange={(e) => setReceiptForm({ ...receiptForm, supplier: e.target.value })}
                placeholder="اسم المورد (اختياري)"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>إضافة عنصر مستلم</Label>
            <InventoryItemPicker inventory={inventory} onPick={handleAddItem} placeholder="اختر عنصر لإضافته للوارد" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">العناصر المستلمة ({receiptItems.length})</div>
            {receiptItems.length === 0 ? (
              <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed py-6 text-sm text-muted-foreground">
                <Package className="size-6 opacity-50" />
                لم تتم إضافة عناصر بعد
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                <div className="hidden gap-2 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_110px_120px_1fr_40px]">
                  <span>العنصر</span>
                  <span>الكمية المستلمة</span>
                  <span>سعر الشراء</span>
                  <span>ملاحظات</span>
                  <span />
                </div>
                {receiptItems.map((item: any, index: number) => (
                  <div key={item.inventory_id} className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-[1fr_110px_120px_1fr_40px] sm:items-center">
                    <div className="col-span-2 font-medium sm:col-span-1">{item.inventory?.name || '-'}</div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.quantity_received}
                      onChange={(e) => handleUpdateItemQuantity(index, e.target.value)}
                      aria-label="الكمية المستلمة"
                      placeholder="الكمية"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.purchase_price}
                      onChange={(e) => handleUpdateItemPrice(index, e.target.value)}
                      aria-label="سعر الشراء"
                      placeholder="سعر الشراء"
                    />
                    <Input
                      className="col-span-2 sm:col-span-1"
                      value={item.notes}
                      onChange={(e) => handleUpdateItemNotes(index, e.target.value)}
                      placeholder="ملاحظات"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-span-2 justify-self-end text-destructive hover:text-destructive sm:col-span-1"
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
            <Label htmlFor="receipt-notes">ملاحظات</Label>
            <Textarea
              id="receipt-notes"
              value={receiptForm.notes}
              onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })}
              rows={3}
              placeholder="ملاحظات على الوارد (اختياري)"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading || receiptItems.length === 0}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء الوارد'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
