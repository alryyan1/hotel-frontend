import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Package, Search, Filter, AlertTriangle, ShoppingCart, ArrowDownCircle, History } from 'lucide-react'
import { Chip } from '@mui/material'
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Button as MuiButton,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  const [filterCategory, setFilterCategory] = useState('')
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
        item.category_id?.toString() === filterCategory || item.category?.id?.toString() === filterCategory
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
    setFilterCategory('')
    setFilterStockStatus('')
  }

  const lowStockCount = inventory.filter((item: any) => 
    getStockStatus(item) === 'low_stock' || getStockStatus(item) === 'out_of_stock'
  ).length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">إدارة المخزون</h1>
          {lowStockCount > 0 && (
            <p className="text-sm text-warning mt-1 flex items-center gap-1">
              <AlertTriangle className="size-4" />
              {lowStockCount} عنصر يحتاج إلى إعادة تموين
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => {
              setEditingItem(null)
              setOpenDialog(true)
            }} 
            className="w-full sm:w-auto h-11 shadow-md"
          >
            <Plus className="size-4 mr-2" />
            إضافة عنصر جديد
          </Button>
          <Button 
            onClick={() => setOpenOrderDialog(true)} 
            variant="outline"
            className="w-full sm:w-auto h-11 shadow-md"
          >
            <ShoppingCart className="size-4 mr-2" />
            إنشاء طلب
          </Button>
          <Button 
            onClick={() => setOpenReceiptDialog(true)} 
            variant="outline"
            className="w-full sm:w-auto h-11 shadow-md"
          >
            <ArrowDownCircle className="size-4 mr-2" />
            إنشاء وارد
          </Button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground font-medium">
            <span className="text-foreground font-bold">{filteredInventory.length}</span> من أصل <span className="text-foreground font-bold">{inventory.length}</span> عنصر
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setOpenFiltersDialog(true)} className="h-9 w-full sm:w-auto">
              <Filter className="size-4 mr-2" />
              الفلاتر
            </Button>
          </div>
        </div>
        {/* Search Bar */}
        <div className="w-full">
          <TextField
            fullWidth
            placeholder="ابحث في اسم العنصر، الفئة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search className="size-4 mr-2 text-muted-foreground" />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: 'background.paper',
              }
            }}
          />
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
              placeholder="ابحث في الاسم، الكود، الوصف..."
              InputProps={{
                startAdornment: <Search className="size-4 mr-2" />
              }}
            />
            <FormControl fullWidth>
              <InputLabel>الفئة</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="الفئة"
              >
                <MenuItem value="">جميع الفئات</MenuItem>
                {categories.map((cat: any) => (
                  <MenuItem key={cat.id} value={cat.id.toString()}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
        </MuiDialogContent>
        <MuiDialogActions>
          <MuiButton variant="outlined" onClick={clearFilters}>مسح الفلاتر</MuiButton>
          <MuiButton variant="contained" onClick={() => setOpenFiltersDialog(false)}>تطبيق</MuiButton>
        </MuiDialogActions>
      </MuiDialog>

      {/* Inventory Table/Cards */}
      <Card className="border-border/40 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3 opacity-50">📦</div>
              <p className="text-muted-foreground">جارٍ التحميل...</p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3 opacity-50">📦</div>
              <p className="text-muted-foreground font-medium">لا توجد عناصر</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm || filterCategory || filterStockStatus
                  ? 'لم يتم العثور على عناصر تطابق معايير البحث'
                  : 'ابدأ بإضافة عنصر جديد'}
              </p>
              {!(searchTerm || filterCategory || filterStockStatus) && (
                <Button onClick={() => {
                  setEditingItem(null)
                  setOpenDialog(true)
                }} size="lg" className="mt-4 shadow-md">
                  إضافة عنصر جديد
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block lg:hidden space-y-3">
                {filteredInventory.map((item: any) => (
                  <Card key={item.id} className="border-border/40 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold text-foreground">{item.name}</span>
                            <Chip 
                              label={getStockStatusLabel(item)} 
                              color={getStockStatusColor(item)} 
                              size="small"
                            />
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">الكمية:</span>
                              <span className="font-bold text-primary">
                                {parseFloat(item.quantity || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            {item.category && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">الفئة:</span>
                                <span>{item.category.name || item.category}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenHistoryDialog(item)} 
                          className="flex-1 h-9 text-sm"
                        >
                          <History className="w-4 h-4 mr-2" />
                          التاريخ
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openStockUpdateDialog(item)} 
                          className="flex-1 h-9 text-sm"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          تعديل المخزون
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(item)} 
                          className="flex-1 h-9 text-sm"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          تعديل
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(item.id)} 
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
                      <TableHead className="font-bold text-center">الاسم</TableHead>
                      <TableHead className="font-bold text-center">الفئة</TableHead>
                      <TableHead className="font-bold text-center">الكمية</TableHead>
                      <TableHead className="font-bold text-center">الحد الأدنى</TableHead>
                      <TableHead className="font-bold text-center">الحالة</TableHead>
                      <TableHead className="font-bold text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item: any) => (
                      <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium text-center">{item.name || '-'}</TableCell>
                        <TableCell className="text-center">{item.category?.name || '-'}</TableCell>
                        <TableCell className="text-center font-bold">
                          {parseFloat(item.quantity || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          {parseFloat(item.minimum_stock || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Chip 
                            label={getStockStatusLabel(item)} 
                            color={getStockStatusColor(item)} 
                            size="small"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button variant="outline" size="sm" onClick={() => handleOpenHistoryDialog(item)}>
                              <History className="w-4 h-4 mr-2" />
                              التاريخ
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openStockUpdateDialog(item)}>
                              <Package className="w-4 h-4 mr-2" />
                              المخزون
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                              <Edit className="w-4 h-4 mr-2" />
                              تعديل
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
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
    </div>
  )
}
