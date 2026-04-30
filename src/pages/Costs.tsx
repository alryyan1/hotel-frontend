import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as DollarSignIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocalOffer as TagIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import { toast } from 'sonner'
import dayjs from 'dayjs'

export default function Costs() {
  const [costs, setCosts] = useState<any[]>([])
  const [filteredCosts, setFilteredCosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCost, setEditingCost] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false)
  const [costCategories, setCostCategories] = useState<any[]>([])
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '' })
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false)
  const [quickCategoryName, setQuickCategoryName] = useState('')
  const [addingQuickCategory, setAddingQuickCategory] = useState(false)
  const [openExportDialog, setOpenExportDialog] = useState(false)
  const [exportDateFrom, setExportDateFrom] = useState('')
  const [exportDateTo, setExportDateTo] = useState('')
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    cost_category_id: '',
    payment_method: '',
    notes: ''
  })

  useEffect(() => {
    fetchCosts()
    fetchCostCategories()
  }, [])

  useEffect(() => {
    filterCosts()
  }, [costs, searchTerm, filterCategory, filterDateFrom, filterDateTo])

  const fetchCosts = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/costs')
      const costsData = data?.data || data || []
      setCosts(costsData)
      setFilteredCosts(costsData)
    } catch (err: any) {
      // If endpoint doesn't exist, use empty array (for development)
      if (err?.response?.status !== 404) {
        toast.error(err?.response?.data?.message || 'فشل في تحميل المصاريف')
      } else {
        setCosts([])
        setFilteredCosts([])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCostCategories = async () => {
    try {
      const { data } = await apiClient.get('/cost-categories')
      const categoriesData = data?.data || data || []
      setCostCategories(categoriesData)
    } catch (err: any) {
      // If endpoint doesn't exist, use empty array (for development)
      if (err?.response?.status !== 404) {
        toast.error(err?.response?.data?.message || 'فشل في تحميل الفئات')
      } else {
        setCostCategories([])
      }
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const payload = { name: categoryForm.name }

      if (editingCategory) {
        await apiClient.put(`/cost-categories/${editingCategory.id}`, payload)
        toast.success('تم تحديث الفئة بنجاح')
      } else {
        await apiClient.post('/cost-categories', payload)
        toast.success('تم إضافة الفئة بنجاح')
      }

      setOpenCategoryDialog(false)
      setCategoryForm({ name: '' })
      setEditingCategory(null)
      fetchCostCategories()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setCategoryForm({ name: category.name || '' })
    setOpenCategoryDialog(true)
  }

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفئة؟')) return

    try {
      setLoading(true)
      await apiClient.delete(`/cost-categories/${id}`)
      toast.success('تم حذف الفئة بنجاح')
      fetchCostCategories()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAddCategory = async () => {
    if (!quickCategoryName.trim()) {
      toast.error('يرجى إدخال اسم الفئة')
      return
    }

    try {
      setAddingQuickCategory(true)
      const { data } = await apiClient.post('/cost-categories', { name: quickCategoryName.trim() })
      toast.success('تم إضافة الفئة بنجاح')
      
      // Refresh categories list
      await fetchCostCategories()
      
      // Select the newly added category
      setForm({ ...form, cost_category_id: data.id.toString() })
      
      // Reset quick add form
      setQuickCategoryName('')
      setShowQuickAddCategory(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل إضافة الفئة')
    } finally {
      setAddingQuickCategory(false)
    }
  }

  const filterCosts = () => {
    let filtered = [...costs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((cost: any) =>
        (cost.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cost.cost_category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cost.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter((cost: any) => cost.cost_category_id?.toString() === filterCategory)
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter((cost: any) => {
        const costDate = dayjs(cost.date).format('YYYY-MM-DD')
        return costDate >= filterDateFrom
      })
    }

    if (filterDateTo) {
      filtered = filtered.filter((cost: any) => {
        const costDate = dayjs(cost.date).format('YYYY-MM-DD')
        return costDate <= filterDateTo
      })
    }

    // Sort by date (newest first)
    filtered.sort((a: any, b: any) => {
      const dateA = dayjs(a.date)
      const dateB = dayjs(b.date)
      return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0
    })

    setFilteredCosts(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)

      const payload = {
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
        cost_category_id: form.cost_category_id ? parseInt(form.cost_category_id) : null,
        payment_method: form.payment_method || null,
        notes: form.notes || null
      }

      if (editingCost) {
        await apiClient.put(`/costs/${editingCost.id}`, payload)
        toast.success('تم تحديث المصروف بنجاح')
      } else {
        await apiClient.post('/costs', payload)
        toast.success('تم إضافة المصروف بنجاح')
      }

      setOpenDialog(false)
      setForm({ description: '', amount: '', date: dayjs().format('YYYY-MM-DD'), cost_category_id: '', payment_method: '', notes: '' })
      setEditingCost(null)
      fetchCosts()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (cost: any) => {
    setEditingCost(cost)
    setForm({
      description: cost.description || '',
      amount: cost.amount?.toString() || '',
      date: cost.date ? dayjs(cost.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      cost_category_id: cost.cost_category_id?.toString() || '',
      payment_method: cost.payment_method || '',
      notes: cost.notes || ''
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return

    try {
      setLoading(true)
      await apiClient.delete(`/costs/${id}`)
      toast.success('تم حذف المصروف بنجاح')
      fetchCosts()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setForm({ description: '', amount: '', date: dayjs().format('YYYY-MM-DD'), cost_category_id: '', payment_method: '', notes: '' })
    setEditingCost(null)
    setShowQuickAddCategory(false)
    setQuickCategoryName('')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  // Get categories for filter from cost categories table
  const categories = costCategories

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams()
      if (exportDateFrom) {
        params.append('date_from', exportDateFrom)
      }
      if (exportDateTo) {
        params.append('date_to', exportDateTo)
      }

      const response = await apiClient.get(`/costs/export/excel?${params.toString()}`, {
        responseType: 'blob',
      })
      
      // Create a blob from the response
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      
      // Create a temporary anchor element and trigger download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const dateRange = exportDateFrom && exportDateTo 
        ? `${exportDateFrom}_to_${exportDateTo}`
        : dayjs().format('YYYY-MM-DD')
      link.download = `costs_export_${dateRange}.xlsx`
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('تم تصدير البيانات بنجاح')
      setOpenExportDialog(false)
      setExportDateFrom('')
      setExportDateTo('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل تصدير البيانات')
    }
  }

  const formatCurrency = (amount: number) => {
    return parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'نقداً'
      case 'bankak': return 'بنكك'
      case 'Ocash': return 'أوكاش'
      case 'fawri': return 'فوري'
      default: return method
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ boxShadow: 2 }}
        >
          إضافة مصروف جديد
        </Button>
      </Stack>

      {/* Action Bar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Typography variant="body2" color="text.secondary">
          <Typography component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            {filteredCosts.length}
          </Typography>
          {' من أصل '}
          <Typography component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            {costs.length}
          </Typography>
          {' مصروف'}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button variant="outlined" startIcon={<FilterIcon />} onClick={() => setOpenFiltersDialog(true)} size="small">
            الفلاتر والبحث
          </Button>
          <Button variant="outlined" startIcon={<TagIcon />} onClick={() => setOpenCategoryDialog(true)} size="small">
            إدارة الفئات
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => setOpenExportDialog(true)} size="small">
            تصدير Excel
          </Button>
        </Stack>
      </Stack>

      {/* Filters Dialog */}
      <Dialog open={openFiltersDialog} onClose={() => setOpenFiltersDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>الفلاتر والبحث</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Search Bar */}
            <TextField
              fullWidth
              label="البحث"
              placeholder="ابحث في الوصف، الفئة، الملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />

            {/* Filters Grid */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="category-filter-label">الفئة</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    label="الفئة"
                  >
                    <MenuItem value="">جميع الفئات</MenuItem>
                    {categories.map((category: any) => (
                      <MenuItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="من تاريخ"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="إلى تاريخ"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={clearFilters}>
            مسح الفلاتر
          </Button>
          <Button variant="contained" onClick={() => setOpenFiltersDialog(false)}>
            تطبيق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Costs Table/Cards */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                جارٍ التحميل...
              </Typography>
            </Box>
          ) : filteredCosts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h2" sx={{ mb: 2, opacity: 0.5 }}>
                💰
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                لا توجد مصاريف
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {searchTerm || filterCategory || filterDateFrom || filterDateTo
                  ? 'لم يتم العثور على مصاريف تطابق معايير البحث'
                  : 'ابدأ بإضافة مصروف جديد'}
              </Typography>
              {!(searchTerm || filterCategory || filterDateFrom || filterDateTo) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                  sx={{ mt: 2, boxShadow: 2 }}
                >
                  إضافة مصروف جديد
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
                <Stack spacing={2}>
                  {filteredCosts.map((cost: any) => (
                    <Card key={cost.id} sx={{ boxShadow: 1, '&:hover': { boxShadow: 2 } }}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  {cost.description}
                                </Typography>
                                {cost.cost_category && (
                                  <Chip
                                    label={cost.cost_category.name}
                                    color="primary"
                                    size="small"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                )}
                              </Stack>
                              <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {dayjs(cost.date).format('YYYY-MM-DD')}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                  {formatCurrency(cost.amount)}
                                </Typography>
                                {cost.payment_method && (
                                  <Chip
                                    label={getPaymentMethodLabel(cost.payment_method)}
                                    color="secondary"
                                    size="small"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                )}
                              </Stack>
                              {cost.notes && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {cost.notes}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleEdit(cost)}
                              fullWidth
                            >
                              تعديل
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDelete(cost.id)}
                              fullWidth
                            >
                              حذف
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>

              {/* Desktop Table Layout */}
              <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>التاريخ</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>الوصف</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>الفئة</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>المبلغ</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>طريقة الدفع</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>الملاحظات</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>إجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCosts.map((cost: any) => (
                      <TableRow key={cost.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell align="center" sx={{ fontWeight: 500 }}>
                          {dayjs(cost.date).format('YYYY-MM-DD')}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 500 }}>
                          {cost.description || '-'}
                        </TableCell>
                        <TableCell align="center">
                          {cost.cost_category ? (
                            <Chip
                              label={cost.cost_category.name}
                              color="primary"
                              size="small"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {formatCurrency(cost.amount)}
                        </TableCell>
                        <TableCell align="center">
                          {cost.payment_method ? (
                            <Chip
                              label={getPaymentMethodLabel(cost.payment_method)}
                              color="secondary"
                              size="small"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cost.notes || '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(cost)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(cost.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          {editingCost ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {editingCost ? 'تحديث بيانات المصروف' : 'إنشاء مصروف جديد'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="الوصف"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              fullWidth
              placeholder="وصف المصروف"
              autoComplete="off"
              size="small"
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="المبلغ"
                  type="number"
                  inputProps={{ step: "0.01", min: "0" }}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  fullWidth
                  placeholder="0.00"
                  autoComplete="off"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="التاريخ"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size="small"
                />
              </Grid>
            </Grid>
            <Box>
              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: showQuickAddCategory ? 2 : 0 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="category-select-label">الفئة</InputLabel>
                  <Select
                    labelId="category-select-label"
                    value={form.cost_category_id}
                    onChange={(e) => setForm({ ...form, cost_category_id: e.target.value })}
                    label="الفئة"
                  >
                    <MenuItem value="">اختر الفئة</MenuItem>
                    {costCategories.map((category: any) => (
                      <MenuItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {!showQuickAddCategory && (
                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setShowQuickAddCategory(true)}
                    sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
                  >
                    إضافة فئة
                  </Button>
                )}
              </Stack>
              {showQuickAddCategory && (
                <Stack direction="row" spacing={1} alignItems="flex-start">
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
                  <Button
                    type="button"
                    variant="contained"
                    size="small"
                    onClick={handleQuickAddCategory}
                    disabled={addingQuickCategory || !quickCategoryName.trim()}
                    sx={{ whiteSpace: 'nowrap', minWidth: 'auto', height: '40px' }}
                  >
                    {addingQuickCategory ? <CircularProgress size={16} /> : 'إضافة'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setShowQuickAddCategory(false)
                      setQuickCategoryName('')
                    }}
                    sx={{ whiteSpace: 'nowrap', minWidth: 'auto', height: '40px' }}
                  >
                    إلغاء
                  </Button>
                </Stack>
              )}
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel id="payment-method-label">طريقة الدفع</InputLabel>
              <Select
                labelId="payment-method-label"
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                label="طريقة الدفع"
              >
                <MenuItem value="">اختر طريقة الدفع</MenuItem>
                <MenuItem value="cash">نقداً</MenuItem>
                <MenuItem value="bankak">بنكك</MenuItem>
                <MenuItem value="Ocash">أوكاش</MenuItem>
                <MenuItem value="fawri">فوري</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="الملاحظات"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
              multiline
              rows={4}
              placeholder="ملاحظات إضافية (اختياري)"
              autoComplete="off"
              size="small"
            />
            <DialogActions sx={{ padding: '16px 0', gap: 1 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={handleCloseDialog}
                fullWidth
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={16} /> : (editingCost ? 'تحديث' : 'إنشاء')}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Cost Categories Management Dialog */}
      <Dialog
        open={openCategoryDialog}
        onClose={() => {
          setOpenCategoryDialog(false)
          setCategoryForm({ name: '' })
          setEditingCategory(null)
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          <TagIcon />
          إدارة الفئات
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Box component="form" onSubmit={handleCategorySubmit} sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="اسم الفئة"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ name: e.target.value })}
                required
                fullWidth
                placeholder="أدخل اسم الفئة"
                autoComplete="off"
                size="small"
              />
              {editingCategory && (
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setCategoryForm({ name: '' })
                    setEditingCategory(null)
                  }}
                  sx={{ minWidth: '100px' }}
                >
                  إلغاء
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !categoryForm.name}
                sx={{ minWidth: '120px' }}
              >
                {editingCategory ? 'تحديث' : 'إضافة'}
              </Button>
            </Box>
          </Box>
          
          <Card sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 0 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>الاسم</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {costCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        لا توجد فئات
                      </TableCell>
                    </TableRow>
                  ) : (
                    costCategories.map((category: any) => (
                      <TableRow key={category.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell align="center" sx={{ fontWeight: 500 }}>
                          {category.name}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <IconButton
                              size="small"
                              onClick={() => handleEditCategory(category)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCategory(category.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            variant="outlined"
            onClick={() => {
              setOpenCategoryDialog(false)
              setCategoryForm({ name: '' })
              setEditingCategory(null)
            }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Excel Dialog */}
      <Dialog
        open={openExportDialog}
        onClose={() => {
          setOpenExportDialog(false)
          setExportDateFrom('')
          setExportDateTo('')
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: '400px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DownloadIcon />
          تصدير إلى Excel
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            اختر نطاق التاريخ للتصدير (اختياري)
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="من تاريخ"
              type="date"
              value={exportDateFrom}
              onChange={(e) => setExportDateFrom(e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              size="small"
            />
            <TextField
              label="إلى تاريخ"
              type="date"
              value={exportDateTo}
              onChange={(e) => setExportDateTo(e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            variant="outlined"
            onClick={() => {
              setOpenExportDialog(false)
              setExportDateFrom('')
              setExportDateTo('')
            }}
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={handleExportExcel}
          >
            تصدير
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
