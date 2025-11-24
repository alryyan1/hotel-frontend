import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, DollarSign, Search, Filter, Tag, Download } from 'lucide-react'
import dayjs from 'dayjs'
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Button as MuiButton,
  TextField,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material'

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
     
        <Button 
          onClick={() => setOpenDialog(true)} 
          className="w-full sm:w-auto h-11 shadow-md"
        >
          <Plus className="size-4 mr-2" />
          إضافة مصروف جديد
        </Button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground font-medium">
          <span className="text-foreground font-bold">{filteredCosts.length}</span> من أصل <span className="text-foreground font-bold">{costs.length}</span> مصروف
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setOpenFiltersDialog(true)} className="h-9 w-full sm:w-auto">
            <Filter className="size-4 mr-2" />
            الفلاتر والبحث
          </Button>
          <Button variant="outline" onClick={() => setOpenCategoryDialog(true)} className="h-9 w-full sm:w-auto">
            <Tag className="size-4 mr-2" />
            إدارة الفئات
          </Button>
          <Button variant="outline" onClick={() => setOpenExportDialog(true)} className="h-9 w-full sm:w-auto">
            <Download className="size-4 mr-2" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Filters Dialog */}
      <Dialog open={openFiltersDialog} onOpenChange={setOpenFiltersDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">الفلاتر والبحث</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Search Bar */}
            <div>
              <Label className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Search className="size-4" />
                البحث
              </Label>
              <Input
                placeholder="ابحث في الوصف، الفئة، الملاحظات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full"
              />
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">الفئة</Label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">جميع الفئات</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id.toString()}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium">من تاريخ</Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">إلى تاريخ</Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto h-11">
              مسح الفلاتر
            </Button>
            <Button onClick={() => setOpenFiltersDialog(false)} className="w-full sm:w-auto h-11">
              تطبيق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Costs Table/Cards */}
      <Card className="border-border/40 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3 opacity-50">💰</div>
              <p className="text-muted-foreground">جارٍ التحميل...</p>
            </div>
          ) : filteredCosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3 opacity-50">💰</div>
              <p className="text-muted-foreground font-medium">لا توجد مصاريف</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm || filterCategory || filterDateFrom || filterDateTo
                  ? 'لم يتم العثور على مصاريف تطابق معايير البحث'
                  : 'ابدأ بإضافة مصروف جديد'}
              </p>
              {!(searchTerm || filterCategory || filterDateFrom || filterDateTo) && (
                <Button onClick={() => setOpenDialog(true)} size="lg" className="mt-4 shadow-md">
                  إضافة مصروف جديد
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block lg:hidden space-y-3">
                {filteredCosts.map((cost: any) => (
                  <Card key={cost.id} className="border-border/40 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold text-foreground">{cost.description}</span>
                            {cost.cost_category && (
                              <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-1 text-xs font-medium">
                                {cost.cost_category.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span>{dayjs(cost.date).format('YYYY-MM-DD')}</span>
                            <span className="font-bold text-primary text-base">
                              {parseFloat(cost.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {cost.payment_method && (
                              <span className="inline-flex items-center rounded-md bg-secondary/10 text-secondary px-2 py-1 text-xs font-medium">
                                {cost.payment_method === 'cash' ? 'نقد' : cost.payment_method === 'bankak' ? 'بنك' : cost.payment_method}
                              </span>
                            )}
                          </div>
                          {cost.notes && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{cost.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(cost)} 
                          className="flex-1 h-9 text-sm"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          تعديل
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(cost.id)} 
                          className="flex-1 h-9 text-sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          حذف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden lg:block overflow-x-auto rounded-lg border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-bold text-center">التاريخ</TableHead>
                      <TableHead className="font-bold text-center">الوصف</TableHead>
                      <TableHead className="font-bold text-center">الفئة</TableHead>
                      <TableHead className="font-bold text-center">المبلغ</TableHead>
                      <TableHead className="font-bold text-center">طريقة الدفع</TableHead>
                      <TableHead className="font-bold text-center">الملاحظات</TableHead>
                      <TableHead className="font-bold text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCosts.map((cost: any) => (
                      <TableRow key={cost.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="text-center font-medium">
                          {dayjs(cost.date).format('YYYY-MM-DD')}
                        </TableCell>
                        <TableCell className="font-medium text-center">{cost.description || '-'}</TableCell>
                        <TableCell className="text-center">
                          {cost.cost_category ? (
                            <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-1 text-xs font-medium">
                              {cost.cost_category.name}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold text-primary">
                          {parseFloat(cost.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          {cost.payment_method ? (
                            <span className="inline-flex items-center rounded-md bg-secondary/10 text-secondary px-2 py-1 text-xs font-medium">
                              {cost.payment_method === 'cash' ? 'نقد' : cost.payment_method === 'bankak' ? 'بنك' : cost.payment_method}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-center max-w-xs truncate">
                          {cost.notes || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(cost)} className="hover:bg-primary/10">
                              <Edit className="w-4 h-4 mr-2" />
                              تعديل
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(cost.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <MuiDialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            maxWidth: '500px',
            maxHeight: '90vh'
          }
        }}
      >
        <MuiDialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          {editingCost ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
        </MuiDialogTitle>
        <MuiDialogContent>
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
            />
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
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
              />
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
              />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: showQuickAddCategory ? 2 : 0 }}>
                <FormControl fullWidth>
                  <InputLabel>الفئة</InputLabel>
                  <Select
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
                  <MuiButton
                    type="button"
                    variant="outlined"
                    size="small"
                    onClick={() => setShowQuickAddCategory(true)}
                    sx={{ minWidth: 'auto', px: 2, whiteSpace: 'nowrap' }}
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
            <FormControl fullWidth>
              <InputLabel>طريقة الدفع</InputLabel>
              <Select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                label="طريقة الدفع"
              >
                <MenuItem value="">اختر طريقة الدفع</MenuItem>
                <MenuItem value="cash">نقد</MenuItem>
                <MenuItem value="bankak">بنك</MenuItem>
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
            />
            <MuiDialogActions sx={{ padding: '16px 0', gap: '8px', flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
              <MuiButton
                type="button"
                variant="outlined"
                onClick={handleCloseDialog}
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
                {loading ? 'جارٍ الحفظ...' : (editingCost ? 'تحديث' : 'إنشاء')}
              </MuiButton>
            </MuiDialogActions>
          </Box>
        </MuiDialogContent>
      </MuiDialog>

      {/* Cost Categories Management Dialog */}
      <MuiDialog 
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
            borderRadius: '12px',
            maxHeight: '90vh'
          }
        }}
      >
        <MuiDialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tag className="size-5" />
        </MuiDialogTitle>
        <MuiDialogContent>
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
              />
              {editingCategory && (
                <MuiButton
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setCategoryForm({ name: '' })
                    setEditingCategory(null)
                  }}
                  sx={{ minWidth: '100px', height: '56px' }}
                >
                  إلغاء
                </MuiButton>
              )}
              <MuiButton
                type="submit"
                variant="contained"
                disabled={loading || !categoryForm.name}
                sx={{ minWidth: '120px', height: '56px' }}
              >
                {editingCategory ? 'تحديث' : 'إضافة'}
              </MuiButton>
            </Box>
          </Box>
          
          <Card className="border-border/40">
            <CardContent className="p-0">
              <div className="rounded-lg border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-bold text-center">الاسم</TableHead>
                      <TableHead className="font-bold text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                          لا توجد فئات
                        </TableCell>
                      </TableRow>
                    ) : (
                      costCategories.map((category: any) => (
                        <TableRow key={category.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-medium text-center">{category.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditCategory(category)} 
                                className="hover:bg-primary/10"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                تعديل
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                حذف
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </MuiDialogContent>
        <MuiDialogActions sx={{ padding: '16px 24px' }}>
          <MuiButton
            variant="outlined"
            onClick={() => {
              setOpenCategoryDialog(false)
              setCategoryForm({ name: '' })
              setEditingCategory(null)
            }}
          >
            إغلاق
          </MuiButton>
        </MuiDialogActions>
      </MuiDialog>

      {/* Export Excel Dialog */}
      <MuiDialog 
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
            borderRadius: '12px',
            maxWidth: '400px'
          }
        }}
      >
        <MuiDialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Download className="size-5" />
          تصدير إلى Excel
        </MuiDialogTitle>
        <MuiDialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            اختر نطاق التاريخ للتصدير (اختياري)
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="من تاريخ"
              type="date"
              value={exportDateFrom}
              onChange={(e) => setExportDateFrom(e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
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
            />
          </Box>
        </MuiDialogContent>
        <MuiDialogActions sx={{ padding: '16px 24px' }}>
          <MuiButton
            variant="outlined"
            onClick={() => {
              setOpenExportDialog(false)
              setExportDateFrom('')
              setExportDateTo('')
            }}
          >
            إلغاء
          </MuiButton>
          <MuiButton
            variant="contained"
            onClick={handleExportExcel}
          >
            تصدير
          </MuiButton>
        </MuiDialogActions>
      </MuiDialog>
    </div>
  )
}


