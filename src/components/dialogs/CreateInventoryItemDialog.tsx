import { useState, useEffect } from 'react'
import apiClient from '../../api/axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Button as MuiButton,
  TextField,
  Typography,
  Box,
  Autocomplete
} from '@mui/material'
import { Plus } from 'lucide-react'

interface CreateInventoryItemDialogProps {
  open: boolean
  onClose: () => void
  editingItem: any
  categories: any[]
  onSuccess: () => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

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
    <MuiDialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxHeight: '90vh'
        }
      }}
    >
      <MuiDialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
        {editingItem ? 'تعديل عنصر' : 'إضافة عنصر جديد'}
      </MuiDialogTitle>
      <MuiDialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {editingItem ? 'تحديث بيانات العنصر' : 'إنشاء عنصر جديد في المخزون'}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            label="اسم العنصر *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            fullWidth
            placeholder="اسم العنصر"
            autoComplete="off"
          />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: showQuickAddCategory ? 2 : 0 }}>
              <Autocomplete
                fullWidth
                options={categories}
                getOptionLabel={(option) => option.name || ''}
                value={categories.find((cat: any) => cat.id?.toString() === form.category_id) || null}
                onChange={(event, newValue) => {
                  setForm({ ...form, category_id: newValue ? newValue.id.toString() : '' })
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="الفئة"
                    placeholder="اختر الفئة أو أضف فئة جديدة"
                  />
                )}
                noOptionsText="لا توجد فئات"
              />
              {!showQuickAddCategory && (
                <MuiButton
                  type="button"
                  variant="outlined"
                  size="small"
                  onClick={() => setShowQuickAddCategory(true)}
                  sx={{ minWidth: 'auto', px: 2, whiteSpace: 'nowrap', height: '56px' }}
                >
                  <Plus className="size-4 mr-1" />
                  إضافة فئة
                </MuiButton>
              )}
            </Box>
            {showQuickAddCategory && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  label="اسم الفئة الجديدة"
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="أدخل اسم الفئة"
                  autoComplete="off"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleQuickAddCategory()
                    }
                  }}
                />
                <MuiButton
                  type="button"
                  variant="contained"
                  size="small"
                  onClick={handleQuickAddCategory}
                  disabled={addingQuickCategory || !quickCategoryName.trim()}
                  sx={{ minWidth: 'auto', px: 2, whiteSpace: 'nowrap', height: '40px' }}
                >
                  {addingQuickCategory ? '...' : 'إضافة'}
                </MuiButton>
                <MuiButton
                  type="button"
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowQuickAddCategory(false)
                    setQuickCategoryName('')
                  }}
                  sx={{ minWidth: 'auto', px: 2, whiteSpace: 'nowrap', height: '40px' }}
                >
                  إلغاء
                </MuiButton>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <TextField
              label="الكمية الحالية *"
              type="number"
              inputProps={{ step: "0.01", min: "0" }}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
              fullWidth
              placeholder="0"
              onFocus={(e) => {
                e.target.select()
              }}
            />
            <TextField
              label="الحد الأدنى للمخزون"
              type="number"
              inputProps={{ step: "0.01", min: "0" }}
              value={form.minimum_stock}
              onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
              fullWidth
              placeholder="0"
              onFocus={(e) => {
                e.target.select()
              }}
            />
          </Box>
          <MuiDialogActions sx={{ padding: '16px 0', gap: '8px', flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
            <MuiButton
              type="button"
              variant="outlined"
              onClick={handleClose}
              fullWidth
              sx={{ 
                order: { xs: 2, sm: 1 },
                height: '48px',
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              إلغاء
            </MuiButton>
            <MuiButton
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
              sx={{ 
                order: { xs: 1, sm: 2 },
                height: '48px',
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              {loading ? 'جارٍ الحفظ...' : (editingItem ? 'تحديث' : 'إنشاء')}
            </MuiButton>
          </MuiDialogActions>
        </Box>
      </MuiDialogContent>
    </MuiDialog>
  )
}

