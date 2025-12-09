import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Filter, ArrowDownCircle } from 'lucide-react'
import dayjs from 'dayjs'
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Button as MuiButton,
  TextField,
  Box,
  Typography
} from '@mui/material'

export default function InventoryReceipts() {
  const [receipts, setReceipts] = useState<any[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openReceiptDetails, setOpenReceiptDetails] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')

  useEffect(() => {
    fetchReceipts()
  }, [])

  useEffect(() => {
    filterReceipts()
  }, [receipts, searchTerm, dateFrom, dateTo, supplierFilter])

  const fetchReceipts = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/inventory-receipts')
      const receiptsData = data?.data || data || []
      setReceipts(receiptsData)
      setFilteredReceipts(receiptsData)
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        toast.error(err?.response?.data?.message || 'فشل في تحميل الواردات')
      } else {
        setReceipts([])
        setFilteredReceipts([])
      }
    } finally {
      setLoading(false)
    }
  }

  const filterReceipts = () => {
    let filtered = [...receipts]

    if (searchTerm) {
      filtered = filtered.filter((receipt: any) =>
        (receipt.receipt_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (receipt.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (receipt.supplier || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (dateFrom) {
      filtered = filtered.filter((receipt: any) => {
        const receiptDate = dayjs(receipt.receipt_date).format('YYYY-MM-DD')
        return receiptDate >= dateFrom
      })
    }

    if (dateTo) {
      filtered = filtered.filter((receipt: any) => {
        const receiptDate = dayjs(receipt.receipt_date).format('YYYY-MM-DD')
        return receiptDate <= dateTo
      })
    }

    if (supplierFilter) {
      filtered = filtered.filter((receipt: any) =>
        (receipt.supplier || '').toLowerCase().includes(supplierFilter.toLowerCase())
      )
    }

    filtered.sort((a: any, b: any) => {
      const dateA = dayjs(a.created_at)
      const dateB = dayjs(b.created_at)
      return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0
    })

    setFilteredReceipts(filtered)
  }

  const handleViewDetails = (receipt: any) => {
    setSelectedReceipt(receipt)
    setOpenReceiptDetails(true)
  }

  const handleDelete = async (receipt: any) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الوارد؟ سيتم عكس الكميات في المخزون.')) return

    try {
      setLoading(true)
      await apiClient.delete(`/inventory-receipts/${receipt.id}`)
      toast.success('تم حذف الوارد بنجاح')
      fetchReceipts()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل حذف الوارد')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setSupplierFilter('')
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">واردات المخزون</h1>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground font-medium">
          <span className="text-foreground font-bold">{filteredReceipts.length}</span> من أصل <span className="text-foreground font-bold">{receipts.length}</span> وارد
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setOpenFiltersDialog(true)} className="h-9 w-full sm:w-auto">
            <Filter className="size-4 mr-2" />
            الفلاتر والبحث
          </Button>
        </div>
      </div>

      {/* Filters Dialog */}
      <MuiDialog open={openFiltersDialog} onClose={() => setOpenFiltersDialog(false)} maxWidth="sm" fullWidth>
        <MuiDialogTitle>الفلاتر والبحث</MuiDialogTitle>
        <MuiDialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="البحث"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              placeholder="ابحث في رقم الوارد، المورد، الملاحظات..."
              InputProps={{
                startAdornment: <Search className="size-4 mr-2" />
              }}
            />
            <TextField
              label="المورد"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              fullWidth
              placeholder="ابحث في اسم المورد"
            />
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                label="من تاريخ"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="إلى تاريخ"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        </MuiDialogContent>
        <MuiDialogActions>
          <MuiButton variant="outlined" onClick={clearFilters}>مسح الفلاتر</MuiButton>
          <MuiButton variant="contained" onClick={() => setOpenFiltersDialog(false)}>تطبيق</MuiButton>
        </MuiDialogActions>
      </MuiDialog>

      {/* Receipts Table */}
      <Card className="border-border/40 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3 opacity-50">📥</div>
              <p className="text-muted-foreground">جارٍ التحميل...</p>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3 opacity-50">📥</div>
              <p className="text-muted-foreground font-medium">لا توجد واردات</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-bold text-center">رقم الوارد</TableHead>
                    <TableHead className="font-bold text-center">التاريخ</TableHead>
                    <TableHead className="font-bold text-center">المورد</TableHead>
                    <TableHead className="font-bold text-center">عدد العناصر</TableHead>
                    <TableHead className="font-bold text-center">المستخدم</TableHead>
                    <TableHead className="font-bold text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt: any) => (
                    <TableRow key={receipt.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-center">{receipt.receipt_number || '-'}</TableCell>
                      <TableCell className="text-center">
                        {receipt.receipt_date ? dayjs(receipt.receipt_date).format('YYYY-MM-DD') : '-'}
                      </TableCell>
                      <TableCell className="text-center">{receipt.supplier || '-'}</TableCell>
                      <TableCell className="text-center">{receipt.items?.length || 0}</TableCell>
                      <TableCell className="text-center">{receipt.user?.username || receipt.user?.name || '-'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(receipt)}>
                            عرض التفاصيل
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(receipt)}>
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Details Dialog */}
      <MuiDialog 
        open={openReceiptDetails} 
        onClose={() => {
          setOpenReceiptDetails(false)
          setSelectedReceipt(null)
        }}
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
          تفاصيل الوارد
        </MuiDialogTitle>
        <MuiDialogContent>
          {selectedReceipt && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>رقم الوارد:</strong> {selectedReceipt.receipt_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>التاريخ:</strong> {selectedReceipt.receipt_date ? dayjs(selectedReceipt.receipt_date).format('YYYY-MM-DD') : '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>المورد:</strong> {selectedReceipt.supplier || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>المستخدم:</strong> {selectedReceipt.user?.username || selectedReceipt.user?.name || '-'}
                </Typography>
                {selectedReceipt.notes && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>الملاحظات:</strong> {selectedReceipt.notes}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>عناصر الوارد</Typography>
                <div className="rounded-lg border border-border/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-bold text-center">العنصر</TableHead>
                        <TableHead className="font-bold text-center">الفئة</TableHead>
                        <TableHead className="font-bold text-center">الكمية المستلمة</TableHead>
                        <TableHead className="font-bold text-center">سعر الشراء</TableHead>
                        <TableHead className="font-bold text-center">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReceipt.items?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-center">{item.inventory?.name || '-'}</TableCell>
                          <TableCell className="text-center">{item.inventory?.category?.name || '-'}</TableCell>
                          <TableCell className="text-center font-bold">
                            {parseFloat(item.quantity_received || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.purchase_price ? parseFloat(item.purchase_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                          </TableCell>
                          <TableCell className="text-center">{item.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Box>
            </Box>
          )}
        </MuiDialogContent>
        <MuiDialogActions>
          <MuiButton variant="outlined" onClick={() => {
            setOpenReceiptDetails(false)
            setSelectedReceipt(null)
          }}>
            إغلاق
          </MuiButton>
        </MuiDialogActions>
      </MuiDialog>
    </div>
  )
}

