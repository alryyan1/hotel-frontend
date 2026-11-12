import { useEffect, useState } from 'react'
import apiClient from '../../api/axios'
import { toast } from 'sonner'
import { History } from 'lucide-react'
import dayjs from 'dayjs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

  const TypeBadge = ({ type }: { type: string }) => {
    switch (type) {
      case 'add':
        return <Badge variant="success">إضافة</Badge>
      case 'deduct':
        return <Badge variant="destructive">خصم</Badge>
      case 'adjust':
        return <Badge className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">تعديل</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
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

  const changeClass = (change: number) =>
    change > 0 ? 'text-green-700 dark:text-green-400' : 'text-destructive'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-[calc(100%-2rem)] lg:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5" />
            تاريخ التغييرات - {inventoryItem?.name || ''}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">لا يوجد تاريخ تغييرات</div>
        ) : (
          <>
            {/* Mobile: one card per change */}
            <div className="space-y-2 md:hidden">
              {history.map((item: any) => (
                <div key={item.id} className="space-y-2 rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <TypeBadge type={item.type} />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between tabular-nums">
                    <span className="text-muted-foreground">{formatQuantity(item.quantity_before)}</span>
                    <span className={`font-bold ${changeClass(item.quantity_change)}`}>
                      {item.quantity_change > 0 ? '+' : ''}{formatQuantity(item.quantity_change)}
                    </span>
                    <span className="font-bold">{formatQuantity(item.quantity_after)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getReferenceLabel(item.reference_type, item.reference_id)} · {item.user?.username || item.user?.name || '-'}
                    {item.notes && ` · ${item.notes}`}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-center">التاريخ والوقت</TableHead>
                    <TableHead className="text-center">النوع</TableHead>
                    <TableHead className="text-center">الكمية قبل</TableHead>
                    <TableHead className="text-center">التغيير</TableHead>
                    <TableHead className="text-center">الكمية بعد</TableHead>
                    <TableHead className="text-center">المرجع</TableHead>
                    <TableHead className="text-center">المستخدم</TableHead>
                    <TableHead className="text-center">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center tabular-nums">
                        {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                      </TableCell>
                      <TableCell className="text-center"><TypeBadge type={item.type} /></TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">
                        {formatQuantity(item.quantity_before)}
                      </TableCell>
                      <TableCell className={`text-center font-bold tabular-nums ${changeClass(item.quantity_change)}`}>
                        {item.quantity_change > 0 ? '+' : ''}{formatQuantity(item.quantity_change)}
                      </TableCell>
                      <TableCell className="text-center font-bold tabular-nums">
                        {formatQuantity(item.quantity_after)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getReferenceLabel(item.reference_type, item.reference_id)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.user?.username || item.user?.name || '-'}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {item.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
