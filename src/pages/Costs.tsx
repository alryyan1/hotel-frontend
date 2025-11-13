import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, DollarSign, Search, Filter } from 'lucide-react'
import dayjs from 'dayjs'

export default function Costs() {
  const [costs, setCosts] = useState<any[]>([])
  const [filteredCosts, setFilteredCosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCost, setEditingCost] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    category: '',
    notes: ''
  })

  useEffect(() => {
    fetchCosts()
  }, [])

  useEffect(() => {
    filterCosts()
  }, [costs, searchTerm, filterCategory, filterDateFrom, filterDateTo])

  const fetchCosts = async () => {
    try {
      setLoading(true)
      setError('')
      const { data } = await apiClient.get('/costs')
      const costsData = data?.data || data || []
      setCosts(costsData)
      setFilteredCosts(costsData)
    } catch (err: any) {
      // If endpoint doesn't exist, use empty array (for development)
      if (err?.response?.status !== 404) {
        setError(err?.response?.data?.message || 'فشل في تحميل المصاريف')
      } else {
        setCosts([])
        setFilteredCosts([])
      }
    } finally {
      setLoading(false)
    }
  }

  const filterCosts = () => {
    let filtered = [...costs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((cost: any) =>
        (cost.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cost.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cost.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter((cost: any) => cost.category === filterCategory)
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
      setError('')

      const payload = {
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
        category: form.category || null,
        notes: form.notes || null
      }

      if (editingCost) {
        await apiClient.put(`/costs/${editingCost.id}`, payload)
        setSuccess('تم تحديث المصروف بنجاح')
      } else {
        await apiClient.post('/costs', payload)
        setSuccess('تم إضافة المصروف بنجاح')
      }

      setOpenDialog(false)
      setForm({ description: '', amount: '', date: dayjs().format('YYYY-MM-DD'), category: '', notes: '' })
      setEditingCost(null)
      fetchCosts()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشلت العملية')
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
      category: cost.category || '',
      notes: cost.notes || ''
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return

    try {
      setLoading(true)
      await apiClient.delete(`/costs/${id}`)
      setSuccess('تم حذف المصروف بنجاح')
      fetchCosts()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setForm({ description: '', amount: '', date: dayjs().format('YYYY-MM-DD'), category: '', notes: '' })
    setEditingCost(null)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  // Get unique categories for filter
  const categories = Array.from(new Set(costs.map((cost: any) => cost.category).filter(Boolean)))

  // Calculate total amount
  const totalAmount = filteredCosts.reduce((sum: number, cost: any) => sum + (parseFloat(cost.amount) || 0), 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المصاريف</h1>
          <p className="text-sm text-muted-foreground mt-1">إضافة وتعديل وحذف المصاريف</p>
        </div>
        <Button 
          onClick={() => setOpenDialog(true)} 
          className="w-full sm:w-auto h-11 shadow-md"
        >
          <Plus className="size-4 mr-2" />
          إضافة مصروف جديد
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-sm font-medium text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">إجمالي المصاريف</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {totalAmount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="size-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">عدد المصاريف</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {filteredCosts.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <DollarSign className="size-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
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
                  {categories.map((category: string) => (
                    <option key={category} value={category}>{category}</option>
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
                            {cost.category && (
                              <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-1 text-xs font-medium">
                                {cost.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{dayjs(cost.date).format('YYYY-MM-DD')}</span>
                            <span className="font-bold text-primary text-base">
                              {parseFloat(cost.amount || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
                            </span>
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
                          {cost.category ? (
                            <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-1 text-xs font-medium">
                              {cost.category}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold text-primary">
                          {parseFloat(cost.amount || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
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
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="w-[95vw] max-w-md mx-auto sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center sm:text-right">
            <DialogTitle className="text-xl font-bold">{editingCost ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingCost ? 'تحديث بيانات المصروف' : 'إنشاء مصروف جديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">الوصف *</Label>
              <Input 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                required 
                className="h-12 text-base"
                placeholder="وصف المصروف"
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">المبلغ (ر.س) *</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={form.amount} 
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                  required 
                  className="h-12 text-base"
                  placeholder="0.00"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">التاريخ *</Label>
                <Input 
                  type="date" 
                  value={form.date} 
                  onChange={(e) => setForm({ ...form, date: e.target.value })} 
                  required 
                  className="h-12 text-base"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">الفئة</Label>
              <Input 
                value={form.category} 
                onChange={(e) => setForm({ ...form, category: e.target.value })} 
                className="h-12 text-base"
                placeholder="مثل: صيانة، كهرباء، مياه..."
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">الملاحظات</Label>
              <Textarea 
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                className="min-h-24 text-base"
                placeholder="ملاحظات إضافية (اختياري)"
                autoComplete="off"
              />
            </div>
            <DialogFooter className="flex flex-col gap-3 pt-6 sm:flex-row sm:gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseDialog} 
                className="w-full h-12 text-base font-medium order-2 sm:order-1 sm:w-auto"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 text-base font-medium order-1 sm:order-2 sm:w-auto"
              >
                {loading ? 'جارٍ الحفظ...' : (editingCost ? 'تحديث' : 'إنشاء')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


