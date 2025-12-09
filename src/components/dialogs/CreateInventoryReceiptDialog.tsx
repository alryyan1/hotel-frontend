import { useState, useEffect } from 'react'
import apiClient from '../../api/axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Button as MuiButton,
  TextField,
  Box,
  Autocomplete
} from '@mui/material'
import { Trash2 } from 'lucide-react'
import dayjs from 'dayjs'

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
    <MuiDialog 
      open={open} 
      onClose={onClose}
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
        إنشاء وارد للمخزون
      </MuiDialogTitle>
      <MuiDialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <TextField
              label="تاريخ الوارد *"
              type="date"
              value={receiptForm.receipt_date}
              onChange={(e) => setReceiptForm({ ...receiptForm, receipt_date: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="المورد"
              value={receiptForm.supplier}
              onChange={(e) => setReceiptForm({ ...receiptForm, supplier: e.target.value })}
              fullWidth
              placeholder="اسم المورد (اختياري)"
              autoComplete="off"
            />
          </Box>
          
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Autocomplete
                fullWidth
                options={inventory}
                getOptionLabel={(option) => option.name || ''}
                onChange={(event, newValue) => {
                  if (newValue) {
                    handleAddItem(newValue)
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="إضافة عنصر مستلم"
                    placeholder="اختر عنصر لإضافته للوارد"
                  />
                )}
                noOptionsText="لا توجد عناصر"
              />
            </Box>

            {receiptItems.length > 0 && (
              <Card className="border-border/40">
                <CardContent className="p-0">
                  <div className="rounded-lg border border-border/40">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="font-bold text-center">العنصر</TableHead>
                          <TableHead className="font-bold text-center">الكمية المستلمة</TableHead>
                          <TableHead className="font-bold text-center">سعر الشراء</TableHead>
                          <TableHead className="font-bold text-center">ملاحظات</TableHead>
                          <TableHead className="font-bold text-center">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receiptItems.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-center">
                              {item.inventory?.name || '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <TextField
                                type="number"
                                inputProps={{ step: "0.01", min: "0.01" }}
                                value={item.quantity_received}
                                onChange={(e) => handleUpdateItemQuantity(index, e.target.value)}
                                size="small"
                                sx={{ width: '100px' }}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <TextField
                                type="number"
                                inputProps={{ step: "0.01", min: "0" }}
                                value={item.purchase_price}
                                onChange={(e) => handleUpdateItemPrice(index, e.target.value)}
                                size="small"
                                placeholder="0.00"
                                sx={{ width: '120px' }}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <TextField
                                value={item.notes}
                                onChange={(e) => handleUpdateItemNotes(index, e.target.value)}
                                size="small"
                                placeholder="ملاحظات"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </Box>

          <TextField
            label="ملاحظات"
            value={receiptForm.notes}
            onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })}
            fullWidth
            multiline
            rows={3}
            placeholder="ملاحظات على الوارد (اختياري)"
          />
        </Box>
      </MuiDialogContent>
      <MuiDialogActions>
        <MuiButton variant="outlined" onClick={onClose}>
          إلغاء
        </MuiButton>
        <MuiButton
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || receiptItems.length === 0}
        >
          {loading ? 'جارٍ الإنشاء...' : 'إنشاء الوارد'}
        </MuiButton>
      </MuiDialogActions>
    </MuiDialog>
  )
}

