import { useState, useEffect } from 'react'
import apiClient from '../../api/axios'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UpdateStockDialogProps {
  open: boolean
  onClose: () => void
  selectedItem: any
  onSuccess: () => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

const formatQuantity = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function UpdateStockDialog({
  open,
  onClose,
  selectedItem,
  onSuccess,
  loading,
  setLoading
}: UpdateStockDialogProps) {
  const [stockChange, setStockChange] = useState('')
  const [stockNotes, setStockNotes] = useState('')

  useEffect(() => {
    if (open) {
      setStockChange('')
      setStockNotes('')
    }
  }, [open])

  const handleUpdateStock = async () => {
    if (!stockChange || parseFloat(stockChange) === 0) {
      toast.error('يرجى إدخال قيمة صحيحة')
      return
    }

    try {
      setLoading(true)
      await apiClient.post(`/inventory/${selectedItem.id}/update-stock`, {
        quantity_change: parseFloat(stockChange),
        notes: stockNotes || null
      })
      toast.success('تم تحديث المخزون بنجاح')
      onClose()
      setStockChange('')
      setStockNotes('')
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل تحديث المخزون')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setStockChange('')
    setStockNotes('')
  }

  const currentQty = parseFloat(String(selectedItem?.quantity || 0))
  const changeQty = parseFloat(stockChange || '0') || 0
  const newQty = currentQty + changeQty

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تحديث المخزون</DialogTitle>
        </DialogHeader>

        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/50 p-2.5">
                <div className="text-xs text-muted-foreground">العنصر</div>
                <div className="truncate font-semibold">{selectedItem.name}</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <div className="text-xs text-muted-foreground">الكمية الحالية</div>
                <div className="font-semibold tabular-nums">{formatQuantity(currentQty)}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stock-change">تغيير الكمية *</Label>
              <Input
                id="stock-change"
                type="number"
                step="0.01"
                value={stockChange}
                onChange={(e) => setStockChange(e.target.value)}
                placeholder="+10 للإضافة، -5 للطرح"
                required
              />
              <p className="text-xs text-muted-foreground">أدخل قيمة موجبة للإضافة أو سالبة للطرح</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stock-notes">الملاحظات</Label>
              <Textarea
                id="stock-notes"
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                rows={3}
                placeholder="ملاحظات حول التغيير (اختياري)"
              />
            </div>

            {changeQty !== 0 && (
              <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                <span className="text-muted-foreground">الكمية الجديدة</span>
                <span className="font-bold tabular-nums">{newQty >= 0 ? formatQuantity(newQty) : '0'}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
          <Button onClick={handleUpdateStock} disabled={loading || !stockChange || parseFloat(stockChange) === 0}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'جارٍ التحديث...' : 'تحديث'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
