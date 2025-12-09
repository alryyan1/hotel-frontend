import { useState, useEffect } from 'react'
import apiClient from '../../api/axios'
import { toast } from 'sonner'
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Button as MuiButton,
  TextField,
  Typography,
  Box
} from '@mui/material'

interface UpdateStockDialogProps {
  open: boolean
  onClose: () => void
  selectedItem: any
  onSuccess: () => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

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

  return (
    <MuiDialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxWidth: '400px'
        }
      }}
    >
      <MuiDialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
        تحديث المخزون
      </MuiDialogTitle>
      <MuiDialogContent>
        {selectedItem && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              العنصر: <strong>{selectedItem.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              الكمية الحالية: <strong>{parseFloat(selectedItem.quantity || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="تغيير الكمية"
                type="number"
                inputProps={{ step: "0.01" }}
                value={stockChange}
                onChange={(e) => setStockChange(e.target.value)}
                fullWidth
                placeholder="+10 للإضافة، -5 للطرح"
                helperText="أدخل قيمة موجبة للإضافة أو سالبة للطرح"
                required
              />
              <TextField
                label="الملاحظات"
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="ملاحظات حول التغيير (اختياري)"
              />
              {stockChange && parseFloat(stockChange) !== 0 && (
                <Typography variant="body2" color="text.secondary">
                  الكمية الجديدة: <strong>
                    {(() => {
                      const currentQty = parseFloat(String(selectedItem.quantity || 0))
                      const changeQty = parseFloat(String(stockChange || 0))
                      const newQty = currentQty + changeQty
                      return newQty >= 0
                        ? newQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0'
                    })()}
                    </strong>
                </Typography>
              )}
            </Box>
          </>
        )}
      </MuiDialogContent>
      <MuiDialogActions>
        <MuiButton variant="outlined" onClick={handleClose}>
          إلغاء
        </MuiButton>
        <MuiButton
          variant="contained"
          onClick={handleUpdateStock}
          disabled={loading || !stockChange || parseFloat(stockChange) === 0}
        >
          {loading ? 'جارٍ التحديث...' : 'تحديث'}
        </MuiButton>
      </MuiDialogActions>
    </MuiDialog>
  )
}

