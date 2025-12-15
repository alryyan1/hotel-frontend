import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Package, Search, Filter, AlertTriangle, ShoppingCart, ArrowDownCircle, History } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Grid,
  CircularProgress,
  Autocomplete,
  IconButton,
  Tooltip
} from '@mui/material'
import CreateInventoryItemDialog from '@/components/dialogs/CreateInventoryItemDialog'
import UpdateStockDialog from '@/components/dialogs/UpdateStockDialog'
import CreateInventoryOrderDialog from '@/components/dialogs/CreateInventoryOrderDialog'
import CreateInventoryReceiptDialog from '@/components/dialogs/CreateInventoryReceiptDialog'
import InventoryHistoryDialog from '@/components/dialogs/InventoryHistoryDialog'

export default function Inventory() {
  // State
  const [inventory, setInventory] = useState<any[]>([])
  const [filteredInventory, setFilteredInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [openStockDialog, setOpenStockDialog] = useState(false)
  const [openOrderDialog, setOpenOrderDialog] = useState(false)
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false)
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false)
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [selectedItemForStock, setSelectedItemForStock] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<any>(null)
  const [filterStockStatus, setFilterStockStatus] = useState('')
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  // Effects
  useEffect(() => {
    fetchInventory()
    fetchCategories()
  }, [])

  useEffect(() => {
    filterInventory()
  }, [inventory, searchTerm, filterCategory, filterStockStatus])

  // API Calls
  const fetchInventory = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/inventory')
      const inventoryData = data?.data || data || []
      setInventory(inventoryData)
      setFilteredInventory(inventoryData)
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        toast.error(err?.response?.data?.message || 'فشل في تحميل المخزون')
      } else {
        setInventory([])
        setFilteredInventory([])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data } = await apiClient.get('/inventory-categories')
      const categoriesData = data?.data || data || []
      setCategories(categoriesData)
    } catch (err: any) {
      setCategories([])
    }
  }

  // Filtering
  const filterInventory = () => {
    let filtered = [...inventory]

    if (searchTerm) {
      filtered = filtered.filter((item: any) =>
        (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterCategory) {
      filtered = filtered.filter((item: any) => 
        item.category_id?.toString() === filterCategory.id?.toString() || item.category?.id?.toString() === filterCategory.id?.toString()
      )
    }

    if (filterStockStatus) {
      filtered = filtered.filter((item: any) => {
        const status = getStockStatus(item)
        return status === filterStockStatus
      })
    }

    filtered.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))

    setFilteredInventory(filtered)
  }

  // Utility Functions
  const getStockStatus = (item: any): string => {
    if (parseFloat(item.quantity || 0) <= 0) {
      return 'out_of_stock'
    } else if (parseFloat(item.quantity || 0) <= parseFloat(item.minimum_stock || 0)) {
      return 'low_stock'
    }
    return 'in_stock'
  }

  const getStockStatusLabel = (item: any): string => {
    const status = getStockStatus(item)
    switch (status) {
      case 'out_of_stock':
        return 'نفد المخزون'
      case 'low_stock':
        return 'مخزون منخفض'
      default:
        return 'متوفر'
    }
  }

  const getStockStatusColor = (item: any): 'error' | 'warning' | 'success' => {
    const status = getStockStatus(item)
    switch (status) {
      case 'out_of_stock':
        return 'error'
      case 'low_stock':
        return 'warning'
      default:
        return 'success'
    }
  }

  // Handlers
  const handleEdit = (item: any) => {
    setEditingItem(item)
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) return

    try {
      setLoading(true)
      await apiClient.delete(`/inventory/${id}`)
      toast.success('تم حذف العنصر بنجاح')
      fetchInventory()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  const openStockUpdateDialog = (item: any) => {
    setSelectedItemForStock(item)
    setOpenStockDialog(true)
  }

  const handleOpenHistoryDialog = (item: any) => {
    setSelectedItemForHistory(item)
    setOpenHistoryDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingItem(null)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory(null)
    setFilterStockStatus('')
  }

  const lowStockCount = inventory.filter((item: any) => 
    getStockStatus(item) === 'low_stock' || getStockStatus(item) === 'out_of_stock'
  ).length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 }, p: 3 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Box>
          {lowStockCount > 0 && (
            <Typography variant="body2" sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <AlertTriangle size={16} />
              {lowStockCount} عنصر يحتاج إلى إعادة تموين
            </Typography>
          )}
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button 
            onClick={() => {
              setEditingItem(null)
              setOpenDialog(true)
            }} 
            variant="contained"
            startIcon={<Plus size={16} />}
            sx={{ width: { xs: '100%', sm: 'auto' }, height: 44, boxShadow: 2 }}
          >
            إضافة عنصر جديد
          </Button>
          <Button 
            onClick={() => setOpenOrderDialog(true)} 
            variant="outlined"
            startIcon={<ShoppingCart size={16} />}
            sx={{ width: { xs: '100%', sm: 'auto' }, height: 44, boxShadow: 2 }}
          >
            إنشاء طلب
          </Button>
          <Button 
            onClick={() => setOpenReceiptDialog(true)} 
            variant="outlined"
            startIcon={<ArrowDownCircle size={16} />}
            sx={{ width: { xs: '100%', sm: 'auto' }, height: 44, boxShadow: 2 }}
          >
            إنشاء وارد
          </Button>
        </Stack>
      </Stack>

      {/* Action Bar */}
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            <Typography component="span" sx={{ color: 'text.primary', fontWeight: 'bold' }}>{filteredInventory.length}</Typography> من أصل <Typography component="span" sx={{ color: 'text.primary', fontWeight: 'bold' }}>{inventory.length}</Typography> عنصر
          </Typography>
          <Button variant="outlined" onClick={() => setOpenFiltersDialog(true)} sx={{ height: 36, width: { xs: '100%', sm: 'auto' } }} startIcon={<Filter size={16} />}>
            الفلاتر
          </Button>
        </Stack>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="ابحث في اسم العنصر، الفئة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: 'text.secondary' }}><Search size={16} /></Box>,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: 'background.paper',
            }
          }}
        />
      </Stack>

      {/* Filters Dialog */}
      <Dialog open={openFiltersDialog} onClose={() => setOpenFiltersDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>الفلاتر والبحث</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="البحث"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              placeholder="ابحث في الاسم، الكود، الوصف..."
              InputProps={{
                startAdornment: <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}><Search size={16} /></Box>
              }}
            />
            <Autocomplete
              options={categories}
              getOptionLabel={(option: any) => option.name || ''}
              value={filterCategory}
              onChange={(_, newValue) => setFilterCategory(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="الفئة" placeholder="اختر الفئة" />
              )}
              fullWidth
              isOptionEqualToValue={(option: any, value: any) => option.id === value?.id}
              noOptionsText="لا توجد فئات"
            />
            <FormControl fullWidth>
              <InputLabel>حالة المخزون</InputLabel>
              <Select
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value)}
                label="حالة المخزون"
              >
                <MenuItem value="">جميع الحالات</MenuItem>
                <MenuItem value="in_stock">متوفر</MenuItem>
                <MenuItem value="low_stock">مخزون منخفض</MenuItem>
                <MenuItem value="out_of_stock">نفد المخزون</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={clearFilters}>مسح الفلاتر</Button>
          <Button variant="contained" onClick={() => setOpenFiltersDialog(false)}>تطبيق</Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Table/Cards */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h2" sx={{ mb: 2, opacity: 0.5 }}>📦</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>جارٍ التحميل...</Typography>
            </Box>
          ) : filteredInventory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h2" sx={{ mb: 2, opacity: 0.5 }}>📦</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>لا توجد عناصر</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                {searchTerm || filterCategory || filterStockStatus
                  ? 'لم يتم العثور على عناصر تطابق معايير البحث'
                  : 'ابدأ بإضافة عنصر جديد'}
              </Typography>
              {!(searchTerm || filterCategory || filterStockStatus) && (
                <Button 
                  onClick={() => {
                    setEditingItem(null)
                    setOpenDialog(true)
                  }} 
                  variant="contained"
                  size="large"
                  sx={{ mt: 2, boxShadow: 2 }}
                >
                  إضافة عنصر جديد
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <Box sx={{ display: { xs: 'block', lg: 'none' }, '& > *': { mb: 2 } }}>
                {filteredInventory.map((item: any) => (
                  <Card key={item.id} sx={{ border: '1px solid', borderColor: 'divider', '&:hover': { boxShadow: 2 }, transition: 'box-shadow 0.2s' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{item.name}</Typography>
                              <Chip 
                                label={getStockStatusLabel(item)} 
                                color={getStockStatusColor(item)} 
                                size="small"
                              />
                            </Stack>
                            <Stack spacing={0.5}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>الكمية:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                  {parseFloat(item.quantity || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                              </Stack>
                              {item.category && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>الفئة:</Typography>
                                  <Typography variant="body2">{item.category.name || item.category}</Typography>
                                </Stack>
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                        
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => handleOpenHistoryDialog(item)} 
                            startIcon={<History size={16} />}
                            sx={{ flex: 1, minWidth: '120px' }}
                          >
                            التاريخ
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => openStockUpdateDialog(item)} 
                            startIcon={<Package size={16} />}
                            sx={{ flex: 1, minWidth: '120px' }}
                          >
                            المخزون
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => handleEdit(item)} 
                            startIcon={<Edit size={16} />}
                            sx={{ flex: 1, minWidth: '120px' }}
                          >
                            تعديل
                          </Button>
                          <Button 
                            variant="contained" 
                            color="error"
                            size="small" 
                            onClick={() => handleDelete(item.id)} 
                            startIcon={<Trash2 size={16} />}
                            sx={{ flex: 1, minWidth: '120px' }}
                          >
                            حذف
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Desktop Table Layout */}
              <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>الاسم</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>الفئة</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>الكمية</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>الحد الأدنى</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>الحالة</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>إجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInventory.map((item: any) => (
                      <TableRow key={item.id} sx={{ '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.2s' }}>
                        <TableCell sx={{ fontWeight: 500, textAlign: 'center' }}>{item.name || '-'}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{item.category?.name || '-'}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                          {parseFloat(item.quantity || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {parseFloat(item.minimum_stock || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip 
                            label={getStockStatusLabel(item)} 
                            color={getStockStatusColor(item)} 
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="التاريخ">
                              <IconButton size="small" onClick={() => handleOpenHistoryDialog(item)} color="primary">
                                <History size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="المخزون">
                              <IconButton size="small" onClick={() => openStockUpdateDialog(item)} color="primary">
                                <Package size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="تعديل">
                              <IconButton size="small" onClick={() => handleEdit(item)} color="primary">
                                <Edit size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="حذف">
                              <IconButton size="small" onClick={() => handleDelete(item.id)} color="error">
                                <Trash2 size={16} />
                              </IconButton>
                            </Tooltip>
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

      {/* Dialogs */}
      <CreateInventoryItemDialog
        open={openDialog}
        onClose={handleCloseDialog}
        editingItem={editingItem}
        categories={categories}
        onSuccess={() => {
          fetchInventory()
          fetchCategories()
        }}
        loading={loading}
        setLoading={setLoading}
      />

      <UpdateStockDialog
        open={openStockDialog}
        onClose={() => {
          setOpenStockDialog(false)
          setSelectedItemForStock(null)
        }}
        selectedItem={selectedItemForStock}
        onSuccess={fetchInventory}
        loading={loading}
        setLoading={setLoading}
      />

      <CreateInventoryOrderDialog
        open={openOrderDialog}
        onClose={() => setOpenOrderDialog(false)}
        inventory={inventory}
        onSuccess={fetchInventory}
        loading={loading}
        setLoading={setLoading}
      />

      <CreateInventoryReceiptDialog
        open={openReceiptDialog}
        onClose={() => setOpenReceiptDialog(false)}
        inventory={inventory}
        onSuccess={fetchInventory}
        loading={loading}
        setLoading={setLoading}
      />

      <InventoryHistoryDialog
        open={openHistoryDialog}
        onClose={() => {
          setOpenHistoryDialog(false)
          setSelectedItemForHistory(null)
        }}
        inventoryItem={selectedItemForHistory}
      />
    </Box>
  )
}
