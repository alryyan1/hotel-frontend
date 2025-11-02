import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { Search, Plus, Edit, Trash2, Users, Phone, MapPin, Calendar, User, FileText } from 'lucide-react'
import CreateCustomerDialog from '@/components/dialogs/CreateCustomerDialog'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

interface Customer {
  id: number
  name: string
  phone?: string
  national_id?: string
  address?: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  created_at: string
  updated_at: string
}

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    national_id: '',
    address: '',
    date_of_birth: '',
    gender: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/customers')
      setCustomers(data?.data || data)
    } catch (e) {
      console.error('Failed to fetch customers', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async () => {
    try {
      setLoading(true)
      setError('')
      const payload = { ...customerForm }
      const { data } = await apiClient.post('/customers', payload)
      setCustomers(prev => [data, ...prev])
      setOpenCreate(false)
      setCustomerForm({ name: '', phone: '', national_id: '', address: '', date_of_birth: '', gender: '' })
      setSuccess('تم إنشاء العميل بنجاح')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل إنشاء العميل')
    } finally {
      setLoading(false)
    }
  }

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return
    
    try {
      setLoading(true)
      setError('')
      const payload = { ...customerForm }
      const { data } = await apiClient.put(`/customers/${selectedCustomer.id}`, payload)
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? data : c))
      setOpenEdit(false)
      setSelectedCustomer(null)
      setCustomerForm({ name: '', phone: '', national_id: '', address: '', date_of_birth: '', gender: '' })
      setSuccess('تم تحديث العميل بنجاح')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل تحديث العميل')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟`)) return
    
    try {
      setLoading(true)
      await apiClient.delete(`/customers/${customer.id}`)
      setCustomers(prev => prev.filter(c => c.id !== customer.id))
      setSuccess('تم حذف العميل بنجاح')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل حذف العميل')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerForm({
      name: customer.name,
      phone: customer.phone || '',
      national_id: customer.national_id || '',
      address: customer.address || '',
      date_of_birth: customer.date_of_birth || '',
      gender: customer.gender || ''
    })
    setOpenEdit(true)
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.national_id?.includes(searchTerm)
  )

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY')
  }

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case 'male': return 'ذكر'
      case 'female': return 'أنثى'
      default: return 'غير محدد'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة العملاء"
        description="إدارة بيانات العملاء وحجوزاتهم"
        icon="👥"
      />

      {error && (
        <Alert variant="destructive" className="shadow-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="shadow-md border-green-200 bg-green-50">
          <AlertDescription className="text-green-700 font-medium">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border/40 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              قائمة العملاء ({filteredCustomers.length})
            </CardTitle>
            <Button onClick={() => setOpenCreate(true)} className="shadow-md">
              <Plus className="size-4 mr-2" />
              عميل جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="البحث بالاسم، الهاتف، أو الرقم الوطني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الرقم الوطني</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="size-3 text-muted-foreground" />
                          {customer.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">غير محدد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.national_id || (
                        <span className="text-muted-foreground">غير محدد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.gender === 'male' ? 'default' : customer.gender === 'female' ? 'secondary' : 'outline'}>
                        {getGenderLabel(customer.gender)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3 text-muted-foreground" />
                        {formatDate(customer.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/customers/${customer.id}/ledger`)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <FileText className="size-3 mr-1" />
                          كشف حساب
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(customer)}
                        >
                          <Edit className="size-3 mr-1" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-3 mr-1" />
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="size-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد عملاء</p>
              <p className="text-sm">ابدأ بإضافة عميل جديد</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCustomerDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        customerForm={customerForm}
        onCustomerFormChange={setCustomerForm}
        onCreateCustomer={handleCreateCustomer}
        loading={loading}
      />

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل العميل</DialogTitle>
            <DialogDescription>تحديث بيانات العميل</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-12 gap-3 mt-1">
            <div className="col-span-12">
              <Label>الاسم</Label>
              <Input 
                value={customerForm.name} 
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} 
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Label>الهاتف</Label>
              <Input 
                value={customerForm.phone} 
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} 
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Label>الرقم الوطني</Label>
              <Input 
                value={customerForm.national_id} 
                onChange={(e) => setCustomerForm({ ...customerForm, national_id: e.target.value })} 
              />
            </div>
            <div className="col-span-12">
              <Label>العنوان</Label>
              <Input 
                value={customerForm.address} 
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} 
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Label>تاريخ الميلاد</Label>
              <Input 
                type="date" 
                value={customerForm.date_of_birth} 
                onChange={(e) => setCustomerForm({ ...customerForm, date_of_birth: e.target.value })} 
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Label>النوع</Label>
              <Select 
                value={customerForm.gender} 
                onValueChange={(v: string) => setCustomerForm({ ...customerForm, gender: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="غير محدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditCustomer} disabled={loading}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
