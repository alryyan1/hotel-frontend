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
        إنشاء طلب من المخزون
      </MuiDialogTitle>
      <MuiDialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            label="تاريخ الطلب *"
            type="date"
            value={orderForm.order_date}
            onChange={(e) => setOrderForm({ ...orderForm, order_date: e.target.value })}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          
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
                    label="إضافة عنصر"
                    placeholder="اختر عنصر لإضافته للطلب"
                  />
                )}
                noOptionsText="لا توجد عناصر"
              />
            </Box>

            {orderItems.length > 0 && (
              <Card className="border-border/40">
                <CardContent className="p-0">
                  <div className="rounded-lg border border-border/40">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="font-bold text-center">العنصر</TableHead>
                          <TableHead className="font-bold text-center">الكمية</TableHead>
                          <TableHead className="font-bold text-center">ملاحظات</TableHead>
                          <TableHead className="font-bold text-center">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-center">
                              {item.inventory?.name || '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <TextField
                                type="number"
                                inputProps={{ step: "0.01", min: "0.01" }}
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(index, e.target.value)}
                                size="small"
                                sx={{ width: '100px' }}
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
            value={orderForm.notes}
            onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
            fullWidth
            multiline
            rows={3}
            placeholder="ملاحظات على الطلب (اختياري)"
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
          disabled={loading || orderItems.length === 0}
        >
          {loading ? 'جارٍ الإنشاء...' : 'إنشاء الطلب'}
        </MuiButton>
      </MuiDialogActions>
    </MuiDialog>
  )
}

