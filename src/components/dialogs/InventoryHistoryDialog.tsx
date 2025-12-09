import { useEffect, useState } from 'react'
import apiClient from '../../api/axios'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Button as MuiButton,
  Box,
  Typography,
  Chip
} from '@mui/material'
import { History } from 'lucide-react'
import dayjs from 'dayjs'

interface InventoryHistoryDialogProps {
  open: boolean
  onClose: () => void
  inventoryItem: any
}

export default function InventoryHistoryDialog({
  open,
  onClose,
  inventoryItem
}: InventoryHistoryDialogProps) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && inventoryItem?.id) {
      fetchHistory()
    }
  }, [open, inventoryItem])

  const fetchHistory = async () => {
    if (!inventoryItem?.id) return

    try {
      setLoading(true)
      const { data } = await apiClient.get(`/inventory/${inventoryItem.id}/history`)
      const historyData = data?.data || data || []
      setHistory(historyData)
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        toast.error(err?.response?.data?.message || 'فشل في تحميل التاريخ')
      } else {
        setHistory([])
      }
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'add':
        return 'إضافة'
      case 'deduct':
        return 'خصم'
      case 'adjust':
        return 'تعديل'
      default:
        return type
    }
  }

  const getTypeColor = (type: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (type) {
      case 'add':
        return 'success'
      case 'deduct':
        return 'error'
      case 'adjust':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getReferenceLabel = (referenceType: string, referenceId: number): string => {
    switch (referenceType) {
      case 'receipt':
        return `وارد #${referenceId}`
      case 'order':
        return `طلب #${referenceId}`
      case 'manual':
        return 'تعديل يدوي'
      default:
        return referenceType || '-'
    }
  }

  const formatQuantity = (quantity: number): string => {
    return parseFloat(quantity.toString()).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxHeight: '90vh'
        }
      }}
    >
      <MuiDialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 1 }}>
        <History className="size-5" />
        تاريخ التغييرات - {inventoryItem?.name || ''}
      </MuiDialogTitle>
      <MuiDialogContent dividers>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">جارٍ التحميل...</Typography>
          </Box>
        ) : history.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">لا يوجد تاريخ تغييرات</Typography>
          </Box>
        ) : (
          <Box>
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-bold text-center">التاريخ والوقت</TableHead>
                    <TableHead className="font-bold text-center">النوع</TableHead>
                    <TableHead className="font-bold text-center">الكمية قبل</TableHead>
                    <TableHead className="font-bold text-center">التغيير</TableHead>
                    <TableHead className="font-bold text-center">الكمية بعد</TableHead>
                    <TableHead className="font-bold text-center">المرجع</TableHead>
                    <TableHead className="font-bold text-center">المستخدم</TableHead>
                    <TableHead className="font-bold text-center">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item: any) => (
                    <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="text-center">
                        {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Chip
                          label={getTypeLabel(item.type)}
                          color={getTypeColor(item.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatQuantity(item.quantity_before)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Typography
                          variant="body2"
                          sx={{
                            color: item.quantity_change > 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {item.quantity_change > 0 ? '+' : ''}{formatQuantity(item.quantity_change)}
                        </Typography>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {formatQuantity(item.quantity_after)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getReferenceLabel(item.reference_type, item.reference_id)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.user?.username || item.user?.name || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Box>
        )}
      </MuiDialogContent>
      <MuiDialogActions>
        <MuiButton variant="outlined" onClick={onClose}>
          إغلاق
        </MuiButton>
      </MuiDialogActions>
    </MuiDialog>
  )
}

