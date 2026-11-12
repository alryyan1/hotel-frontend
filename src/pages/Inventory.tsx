import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { toast } from 'sonner'
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Search,
  AlertTriangle,
  ShoppingCart,
  ArrowDownCircle,
  History,
  Tags,
  X,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import CreateInventoryItemDialog from '@/components/dialogs/CreateInventoryItemDialog'
import UpdateStockDialog from '@/components/dialogs/UpdateStockDialog'
import CreateInventoryOrderDialog from '@/components/dialogs/CreateInventoryOrderDialog'
import CreateInventoryReceiptDialog from '@/components/dialogs/CreateInventoryReceiptDialog'
import InventoryHistoryDialog from '@/components/dialogs/InventoryHistoryDialog'

const ALL = 'all'

const formatQuantity = (value: any) =>
  parseFloat(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
  const [filterCategory, setFilterCategory] = useState(ALL)
  const [filterStockStatus, setFilterStockStatus] = useState(ALL)
  const [categories, setCategories] = useState<any[]>([])
  const [openCategoriesDialog, setOpenCategoriesDialog] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  // Item or category waiting for delete confirmation
  const [pendingDelete, setPendingDelete] = useState<{ type: 'item' | 'category'; id: number; name: string } | null>(null)

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

    if (filterCategory !== ALL) {
      filtered = filtered.filter((item: any) =>
        item.category_id?.toString() === filterCategory || item.category?.id?.toString() === filterCategory
      )
    }

    if (filterStockStatus !== ALL) {
      filtered = filtered.filter((item: any) => getStockStatus(item) === filterStockStatus)
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

  const StockBadge = ({ item }: { item: any }) => {
    switch (getStockStatus(item)) {
      case 'out_of_stock':
        return <Badge variant="destructive">نفد المخزون</Badge>
      case 'low_stock':
        return <Badge className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">مخزون منخفض</Badge>
      default:
        return <Badge variant="success">متوفر</Badge>
    }
  }

  // Handlers
  const handleEdit = (item: any) => {
    setEditingItem(item)
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
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

  const openCreateDialog = () => {
    setEditingItem(null)
    setOpenDialog(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory(ALL)
    setFilterStockStatus(ALL)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      setAddingCategory(true)
      const { data } = await apiClient.post('/inventory-categories', { name: newCategoryName.trim() })
      setCategories(prev => [...prev, data])
      setNewCategoryName('')
      toast.success('تم إضافة الفئة بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل إضافة الفئة')
    } finally {
      setAddingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      setDeletingCategoryId(id)
      await apiClient.delete(`/inventory-categories/${id}`)
      toast.success('تم حذف الفئة بنجاح')
      setCategories(prev => prev.filter(c => c.id !== id))
      if (filterCategory === String(id)) setFilterCategory(ALL)
      fetchInventory()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل حذف الفئة')
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    if (pendingDelete.type === 'item') handleDelete(pendingDelete.id)
    else handleDeleteCategory(pendingDelete.id)
    setPendingDelete(null)
  }

  const lowStockCount = inventory.filter((item: any) =>
    getStockStatus(item) === 'low_stock' || getStockStatus(item) === 'out_of_stock'
  ).length

  const hasFilters = !!searchTerm || filterCategory !== ALL || filterStockStatus !== ALL

  const itemActions = (item: any) => [
    { label: 'التاريخ', icon: History, onClick: () => handleOpenHistoryDialog(item) },
    { label: 'المخزون', icon: Package, onClick: () => openStockUpdateDialog(item) },
    { label: 'تعديل', icon: Edit, onClick: () => handleEdit(item) },
  ]

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">المخزون</h1>
          {lowStockCount > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4" />
              {lowStockCount} عنصر يحتاج إلى إعادة تموين
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button className="col-span-2 gap-1.5 sm:col-span-1" onClick={openCreateDialog}>
            <Plus className="size-4" />
            إضافة عنصر جديد
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => setOpenOrderDialog(true)}>
            <ShoppingCart className="size-4" />
            إنشاء طلب
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => setOpenReceiptDialog(true)}>
            <ArrowDownCircle className="size-4" />
            إنشاء وارد
          </Button>
          <Button variant="outline" className="col-span-2 gap-1.5 sm:col-span-1" onClick={() => setOpenCategoriesDialog(true)}>
            <Tags className="size-4" />
            الفئات
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="py-3">
        <CardContent className="flex flex-wrap items-center gap-2 px-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder="ابحث في اسم العنصر، الفئة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-44 sm:flex-none">
              <SelectValue placeholder="الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>كل الفئات</SelectItem>
              {categories.map((cat: any) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-44 sm:flex-none">
              <SelectValue placeholder="حالة المخزون" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>جميع الحالات</SelectItem>
              <SelectItem value="in_stock">متوفر</SelectItem>
              <SelectItem value="low_stock">مخزون منخفض</SelectItem>
              <SelectItem value="out_of_stock">نفد المخزون</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="gap-1" onClick={clearFilters}>
              <X className="size-4" />
              مسح الفلاتر
            </Button>
          )}
          <span className="text-sm text-muted-foreground sm:ms-auto">
            <span className="font-bold text-foreground">{filteredInventory.length}</span> من أصل{' '}
            <span className="font-bold text-foreground">{inventory.length}</span> عنصر
          </span>
        </CardContent>
      </Card>

      {/* Inventory list */}
      {loading && inventory.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredInventory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Package className="size-12 text-muted-foreground/50" />
            <div className="font-medium">لا توجد عناصر</div>
            <div className="text-sm text-muted-foreground">
              {hasFilters ? 'لم يتم العثور على عناصر تطابق معايير البحث' : 'ابدأ بإضافة عنصر جديد'}
            </div>
            {!hasFilters && (
              <Button className="mt-2 gap-1.5" onClick={openCreateDialog}>
                <Plus className="size-4" />
                إضافة عنصر جديد
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: one card per item */}
          <div className="space-y-2 lg:hidden">
            {filteredInventory.map((item: any) => (
              <Card key={item.id} className="gap-3 py-3">
                <CardContent className="space-y-3 px-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-bold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.category?.name || 'بدون فئة'}</div>
                    </div>
                    <StockBadge item={item} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="text-xs text-muted-foreground">الكمية</div>
                      <div className="font-bold tabular-nums">{formatQuantity(item.quantity)}</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="text-xs text-muted-foreground">الحد الأدنى</div>
                      <div className="font-bold tabular-nums">{formatQuantity(item.minimum_stock)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {itemActions(item).map(({ label, icon: Icon, onClick }) => (
                      <Button key={label} variant="outline" size="sm" className="gap-1 px-1" onClick={onClick}>
                        <Icon className="size-4" />
                        {label}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 px-1 text-destructive hover:text-destructive"
                      onClick={() => setPendingDelete({ type: 'item', id: item.id, name: item.name })}
                    >
                      <Trash2 className="size-4" />
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-center">الكمية</TableHead>
                  <TableHead className="text-center">الحد الأدنى</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="w-44 text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">{item.name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{item.category?.name || '-'}</TableCell>
                    <TableCell className="text-center font-bold tabular-nums">{formatQuantity(item.quantity)}</TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">{formatQuantity(item.minimum_stock)}</TableCell>
                    <TableCell className="text-center"><StockBadge item={item} /></TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        {itemActions(item).map(({ label, icon: Icon, onClick }) => (
                          <Tooltip key={label}>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={onClick} aria-label={label}>
                                <Icon className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{label}</TooltipContent>
                          </Tooltip>
                        ))}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setPendingDelete({ type: 'item', id: item.id, name: item.name })}
                              aria-label="حذف"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>حذف</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Categories Dialog */}
      <Dialog open={openCategoriesDialog} onOpenChange={setOpenCategoriesDialog}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إدارة الفئات</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="اسم الفئة الجديدة"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory() }}
              disabled={addingCategory}
            />
            <Button className="gap-1.5" onClick={handleAddCategory} disabled={!newCategoryName.trim() || addingCategory}>
              {addingCategory ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              إضافة
            </Button>
          </div>

          {categories.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">لا توجد فئات</div>
          ) : (
            <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
              {categories.map((cat: any) => (
                <li key={cat.id} className="flex items-center justify-between px-3 py-1.5">
                  <span>{cat.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingCategoryId === cat.id}
                    onClick={() => setPendingDelete({ type: 'category', id: cat.id, name: cat.name })}
                    aria-label="حذف الفئة"
                  >
                    {deletingCategoryId === cat.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCategoriesDialog(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingDelete?.type === 'category' ? 'حذف الفئة' : 'حذف العنصر'}</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {pendingDelete?.type === 'category' ? 'الفئة' : 'العنصر'} "{pendingDelete?.name}"؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
