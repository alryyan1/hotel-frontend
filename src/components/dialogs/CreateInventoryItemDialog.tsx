import { useState, useEffect } from 'react'
import apiClient from '../../api/axios'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateInventoryItemDialogProps {
  open: boolean
  onClose: () => void
  editingItem: any
  categories: any[]
  onSuccess: () => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

const NO_CATEGORY = 'none'

export default function CreateInventoryItemDialog({
  open,
  onClose,
  editingItem,
  categories,
  onSuccess,
  loading,
  setLoading
}: CreateInventoryItemDialogProps) {
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    quantity: '0',
    minimum_stock: '0'
  })
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false)
  const [quickCategoryName, setQuickCategoryName] = useState('')
  const [addingQuickCategory, setAddingQuickCategory] = useState(false)

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name || '',
        category_id: editingItem.category_id?.toString() || '',
        quantity: editingItem.quantity?.toString() || '0',
        minimum_stock: editingItem.minimum_stock?.toString() || '0'
      })
    } else {
      resetForm()
    }
  }, [editingItem, open])

  const resetForm = () => {
    setForm({
      name: '',
      category_id: '',
      quantity: '0',
      minimum_stock: '0'
    })
    setShowQuickAddCategory(false)
    setQuickCategoryName('')
  }

  const handleQuickAddCategory = async () => {
    if (!quickCategoryName.trim()) {
      toast.error('يرجى إدخال اسم الفئة')
      return
    }

    try {
      setAddingQuickCategory(true)
      const { data } = await apiClient.post('/inventory-categories', { name: quickCategoryName.trim() })
      toast.success('تم إضافة الفئة بنجاح')
      setForm({ ...form, category_id: data.id.toString() })
      setQuickCategoryName('')
      setShowQuickAddCategory(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل إضافة الفئة')
    } finally {
      setAddingQuickCategory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)

      const payload = {
        name: form.name,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        quantity: parseFloat(form.quantity) || 0,
        minimum_stock: parseFloat(form.minimum_stock) || 0
      }

      if (editingItem) {
        await apiClient.put(`/inventory/${editingItem.id}`, payload)
        toast.success('تم تحديث العنصر بنجاح')
      } else {
        await apiClient.post('/inventory', payload)
        toast.success('تم إضافة العنصر بنجاح')
      }

      onClose()
      resetForm()
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'تعديل عنصر' : 'إضافة عنصر جديد'}</DialogTitle>
          <DialogDescription>
            {editingItem ? 'تحديث بيانات العنصر' : 'إنشاء عنصر جديد في المخزون'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="item-name">اسم العنصر *</Label>
            <Input
              id="item-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="اسم العنصر"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label>الفئة</Label>
            <div className="flex gap-2">
              <Select
                value={form.category_id || NO_CATEGORY}
                onValueChange={(v) => setForm({ ...form, category_id: v === NO_CATEGORY ? '' : v })}
              >
                <SelectTrigger className="min-w-0 flex-1">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>بدون فئة</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!showQuickAddCategory && (
                <Button type="button" variant="outline" className="gap-1" onClick={() => setShowQuickAddCategory(true)}>
                  <Plus className="size-4" />
                  إضافة فئة
                </Button>
              )}
            </div>
            {showQuickAddCategory && (
              <div className="flex gap-2 pt-1">
                <Input
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  placeholder="اسم الفئة الجديدة"
                  autoComplete="off"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleQuickAddCategory()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleQuickAddCategory}
                  disabled={addingQuickCategory || !quickCategoryName.trim()}
                >
                  {addingQuickCategory && <Loader2 className="size-4 animate-spin" />}
                  إضافة
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="إلغاء"
                  onClick={() => {
                    setShowQuickAddCategory(false)
                    setQuickCategoryName('')
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="item-quantity">الكمية الحالية *</Label>
              <Input
                id="item-quantity"
                type="number"
                step="0.01"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
                placeholder="0"
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-minimum">الحد الأدنى للمخزون</Label>
              <Input
                id="item-minimum"
                type="number"
                step="0.01"
                min="0"
                value={form.minimum_stock}
                onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
                placeholder="0"
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? 'جارٍ الحفظ...' : (editingItem ? 'تحديث' : 'إنشاء')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
