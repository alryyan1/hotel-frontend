import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/axios'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  alpha,
} from '@mui/material'
import {
  AttachMoney as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'
import { toast } from 'sonner'
import dayjs from 'dayjs'

interface Summary {
  total_revenue: number
  revenue_by_method?: Record<string, number>
  total_debits: number
  total_expenses: number
  net_profit: number
  date_from?: string
  date_to?: string
}

interface Transaction {
  id: number
  customer_id: number
  reservation_id?: number
  type: 'debit' | 'credit'
  amount: number
  currency: string
  method?: 'cash' | 'bankak' | 'Ocash' | 'fawri'
  reference?: string
  transaction_date: string
  notes?: string
  customer?: {
    id: number
    name: string
    phone?: string
  }
  reservation?: {
    id: number
    check_in_date: string
    check_out_date: string
  }
}

interface CustomerBalance {
  id: number
  name: string
  phone?: string
  national_id?: string
  total_debit: number
  total_credit: number
  balance: number
}

export default function Accountant() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [customerBalances, setCustomerBalances] = useState<CustomerBalance[]>([])
  const [loading, setLoading] = useState(false)
  
  // Date filters
  const [dateFrom, setDateFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [dateTo, setDateTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  
  // Transaction filters
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('')
  const [transactionMethodFilter, setTransactionMethodFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1)
  const [balancesPage, setBalancesPage] = useState(1)
  const [balancesTotalPages, setBalancesTotalPages] = useState(1)
  
  // Dialog states
  const [openTransactionsDialog, setOpenTransactionsDialog] = useState(false)
  const [openCustomerBalancesDialog, setOpenCustomerBalancesDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editForm, setEditForm] = useState({
    amount: '',
    method: 'cash' as 'cash' | 'bankak' | 'Ocash' | 'fawri',
    reference: '',
    notes: '',
    transaction_date: '',
  })

  useEffect(() => {
    fetchSummary()
    fetchTransactions()
    fetchCustomerBalances()
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchTransactions()
  }, [transactionTypeFilter, transactionMethodFilter, searchTerm, transactionsPage])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      
      const { data } = await apiClient.get(`/accounting/summary?${params.toString()}`)
      setSummary(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في جلب الملخص المالي')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (transactionTypeFilter) params.append('type', transactionTypeFilter)
      if (transactionMethodFilter) params.append('method', transactionMethodFilter)
      if (searchTerm) params.append('search', searchTerm)
      params.append('per_page', '20')
      params.append('page', transactionsPage.toString())
      
      const { data } = await apiClient.get(`/accounting/transactions?${params.toString()}`)
      setTransactions(data.data || [])
      setTransactionsTotalPages(data.last_page || 1)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في جلب العمليات المالية')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerBalances = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('per_page', '20')
      params.append('page', balancesPage.toString())
      
      const { data } = await apiClient.get(`/accounting/customer-balances?${params.toString()}`)
      setCustomerBalances(data.data || [])
      setBalancesTotalPages(data.last_page || 1)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في جلب أرصدة العملاء')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPdf = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      
      const response = await apiClient.get(`/accounting/report/pdf?${params.toString()}`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const newWindow = window.open(url, '_blank')
      
      if (!newWindow) {
        toast.error('يرجى السماح بالنوافذ المنبثقة لعرض PDF')
        window.URL.revokeObjectURL(url)
        return
      }
      
      newWindow.addEventListener('load', () => {
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 1000)
      })
      
      toast.success('تم فتح التقرير في نافذة جديدة')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في تصدير PDF')
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      
      const response = await apiClient.get(`/accounting/report/excel?${params.toString()}`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `accounting_report_${dayjs().format('YYYY-MM-DD')}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('تم تحميل التقرير بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في تصدير Excel')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setEditForm({
      amount: transaction.amount.toString(),
      method: transaction.method || 'cash',
      reference: transaction.reference || '',
      notes: transaction.notes || '',
      transaction_date: dayjs(transaction.transaction_date).format('YYYY-MM-DD'),
    })
    setOpenEditDialog(true)
  }

  const handleEditSubmit = async () => {
    if (!editingTransaction) return

    try {
      setLoading(true)
      await apiClient.put(`/transactions/${editingTransaction.id}`, editForm)
      toast.success('تم تحديث العملية بنجاح')
      setOpenEditDialog(false)
      setEditingTransaction(null)
      fetchTransactions()
      fetchSummary()
      fetchCustomerBalances()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في تحديث العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = async (transaction: Transaction) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه العملية؟')) return

    try {
      setLoading(true)
      await apiClient.delete(`/transactions/${transaction.id}`)
      toast.success('تم حذف العملية بنجاح')
      fetchTransactions()
      fetchSummary()
      fetchCustomerBalances()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في حذف العملية')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '0'
    }
    return new Intl.NumberFormat('en-US').format(amount)
  }

  const methodLabels: Record<string, string> = {
    cash: 'نقدي',
    bankak: 'بنكاك',
    Ocash: 'أوكاش',
    fawri: 'فوري'
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 4, 
      p: { xs: 2, md: 4 }, 
      maxWidth: '1400px', 
      mx: 'auto', 
      width: '100%',
      minHeight: '100vh',
      pb: 6
    }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          boxShadow: '0 10px 30px rgba(25, 118, 210, 0.2)'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              الحسابات
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              نظرة شاملة على الأداء المالي
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <TextField
              type="date"
              label="من تاريخ"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(255,255,255,0.7)',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.9)',
                }
              }}
            />
            <TextField
              type="date"
              label="إلى تاريخ"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(255,255,255,0.7)',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.9)',
                }
              }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportPdf}
                disabled={loading}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportExcel}
                disabled={loading}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Excel
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {/* Financial Summary Cards */}
      {summary && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                }
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    إجمالي الإيرادات
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatCurrency(summary.total_revenue)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'primary.light',
                    color: 'primary.main'
                  }}
                >
                  <DollarSignIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                }
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    إجمالي المصروفات
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {formatCurrency(summary.total_expenses)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'error.light',
                    color: 'error.main'
                  }}
                >
                  <TrendingDownIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                }
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    إجمالي المدين
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {formatCurrency(summary.total_debits)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'info.light',
                    color: 'info.main'
                  }}
                >
                  <AccountBalanceIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Payment Method Breakdown Card */}
      {summary && summary.revenue_by_method && Object.keys(summary.revenue_by_method).length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <DollarSignIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              تفصيل الإيرادات حسب طريقة الدفع
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            {Object.entries(summary.revenue_by_method).map(([method, amount]) => (
              <Grid key={method} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {methodLabels[method] || method}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(amount)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Quick Access Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            onClick={() => setOpenTransactionsDialog(true)}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              border: '2px solid transparent',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                borderColor: 'primary.main',
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)'
                }}
              >
                <AccountBalanceIcon sx={{ fontSize: 40 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  العمليات المالية
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  عرض جميع العمليات المالية
                </Typography>
                <Chip 
                  label={`${transactions.length} عملية`} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <ArrowForwardIcon sx={{ color: 'primary.main' }} />
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            onClick={() => setOpenCustomerBalancesDialog(true)}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              border: '2px solid transparent',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                borderColor: 'primary.main',
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)'
                }}
              >
                <PeopleIcon sx={{ fontSize: 40 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  أرصدة العملاء
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  عرض جميع أرصدة العملاء
                </Typography>
                <Chip 
                  label={`${customerBalances.length} عميل`} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <ArrowForwardIcon sx={{ color: 'primary.main' }} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Transactions Dialog */}
      <Dialog
        open={openTransactionsDialog}
        onClose={() => setOpenTransactionsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AccountBalanceIcon color="primary" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              العمليات المالية
            </Typography>
          </Stack>
        </DialogTitle>
        <Divider />
        <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="بحث بالمرجع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>النوع</InputLabel>
              <Select
                value={transactionTypeFilter}
                label="النوع"
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
              >
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="debit">مدين</MenuItem>
                <MenuItem value="credit">دائن</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>طريقة الدفع</InputLabel>
              <Select
                value={transactionMethodFilter}
                label="طريقة الدفع"
                onChange={(e) => setTransactionMethodFilter(e.target.value)}
              >
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="cash">نقدي</MenuItem>
                <MenuItem value="bankak">بنكاك</MenuItem>
                <MenuItem value="Ocash">أوكاش</MenuItem>
                <MenuItem value="fawri">فوري</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : transactions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                لا توجد عمليات مالية
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>التاريخ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>النوع</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>العميل</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>المبلغ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>طريقة الدفع</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>المرجع</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id}
                      hover
                    >
                      <TableCell>
                        {dayjs(transaction.transaction_date).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.type === 'debit' ? 'مدين' : 'دائن'}
                          color={transaction.type === 'debit' ? 'primary' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {transaction.customer?.name || '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {transaction.method ? (
                          <Chip
                            label={methodLabels[transaction.method] || transaction.method}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.reference || '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(transaction)}
                            disabled={transaction.type === 'debit'}
                            title={transaction.type === 'debit' ? 'لا يمكن تعديل عمليات الحجز' : 'تعديل'}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(transaction)}
                            title="حذف"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {transactionsTotalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Pagination
                    count={transactionsTotalPages}
                    page={transactionsPage}
                    onChange={(_, page) => setTransactionsPage(page)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setOpenTransactionsDialog(false)} 
            variant="outlined"
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Balances Dialog */}
      <Dialog
        open={openCustomerBalancesDialog}
        onClose={() => setOpenCustomerBalancesDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <PeopleIcon color="primary" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              أرصدة العملاء
            </Typography>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : customerBalances.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                لا توجد أرصدة عملاء
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>العميل</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>الهاتف</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>مدين</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>دائن</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>الرصيد</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerBalances.map((balance) => (
                    <TableRow 
                      key={balance.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        setOpenCustomerBalancesDialog(false)
                        navigate(`/customers/${balance.id}/ledger`)
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>
                        {balance.name}
                      </TableCell>
                      <TableCell>
                        {balance.phone || '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 500 }}>
                        {formatCurrency(balance.total_debit)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main', fontWeight: 500 }}>
                        {formatCurrency(balance.total_credit)}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: 600,
                          color: balance.balance > 0 ? 'error.main' : 'success.main'
                        }}
                      >
                        {formatCurrency(balance.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {balancesTotalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Pagination
                    count={balancesTotalPages}
                    page={balancesPage}
                    onChange={(_, page) => setBalancesPage(page)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setOpenCustomerBalancesDialog(false)} 
            variant="outlined"
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => {
          setOpenEditDialog(false)
          setEditingTransaction(null)
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>تعديل العملية المالية</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                type="date"
                label="تاريخ العملية"
                value={editForm.transaction_date}
                onChange={(e) => setEditForm({ ...editForm, transaction_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="المبلغ"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                inputProps={{ step: '0.01', min: '0.01' }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>طريقة الدفع</InputLabel>
                <Select
                  value={editForm.method}
                  label="طريقة الدفع"
                  onChange={(e) => setEditForm({ ...editForm, method: e.target.value as any })}
                >
                  <MenuItem value="cash">نقدي</MenuItem>
                  <MenuItem value="bankak">بنكاك</MenuItem>
                  <MenuItem value="Ocash">أوكاش</MenuItem>
                  <MenuItem value="fawri">فوري</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="الرقم المرجعي"
                value={editForm.reference}
                onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="ملاحظات"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenEditDialog(false)
              setEditingTransaction(null)
            }}
            variant="outlined"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={loading || !editForm.amount || parseFloat(editForm.amount) <= 0}
          >
            {loading ? <CircularProgress size={16} /> : 'حفظ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

