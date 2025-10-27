import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { Search, Plus, Edit, Trash2, Users as UsersIcon, Mail, Calendar, Shield, UserCheck } from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  email_verified_at?: string
  created_at: string
  updated_at: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/users')
      setUsers(data?.data || data)
    } catch (e) {
      console.error('Failed to fetch users', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!userForm.name || !userForm.email || !userForm.password) {
        setError('جميع الحقول مطلوبة')
        return
      }
      
      if (userForm.password !== userForm.password_confirmation) {
        setError('كلمة المرور غير متطابقة')
        return
      }
      
      const payload = { ...userForm }
      const { data } = await apiClient.post('/users', payload)
      setUsers(prev => [data, ...prev])
      setOpenCreate(false)
      setUserForm({ name: '', email: '', password: '', password_confirmation: '' })
      setSuccess('تم إنشاء المستخدم بنجاح')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل إنشاء المستخدم')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    
    try {
      setLoading(true)
      setError('')
      
      if (!userForm.name || !userForm.email) {
        setError('الاسم والبريد الإلكتروني مطلوبان')
        return
      }
      
      if (userForm.password && userForm.password !== userForm.password_confirmation) {
        setError('كلمة المرور غير متطابقة')
        return
      }
      
      const payload: any = {
        name: userForm.name,
        email: userForm.email
      }
      
      if (userForm.password) {
        payload.password = userForm.password
        payload.password_confirmation = userForm.password_confirmation
      }
      
      const { data } = await apiClient.put(`/users/${selectedUser.id}`, payload)
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? data : u))
      setOpenEdit(false)
      setSelectedUser(null)
      setUserForm({ name: '', email: '', password: '', password_confirmation: '' })
      setSuccess('تم تحديث المستخدم بنجاح')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل تحديث المستخدم')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) return
    
    try {
      setLoading(true)
      await apiClient.delete(`/users/${user.id}`)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setSuccess('تم حذف المستخدم بنجاح')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل حذف المستخدم')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      password_confirmation: ''
    })
    setOpenEdit(true)
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA')
  }

  const isEmailVerified = (user: User) => {
    return user.email_verified_at !== null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المستخدمين"
        description="إدارة حسابات المستخدمين والصلاحيات"
        icon="👤"
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
              <UsersIcon className="size-5 text-primary" />
              قائمة المستخدمين ({filteredUsers.length})
            </CardTitle>
            <Button onClick={() => setOpenCreate(true)} className="shadow-md">
              <Plus className="size-4 mr-2" />
              مستخدم جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
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
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>حالة التحقق</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="size-3 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isEmailVerified(user) ? 'default' : 'secondary'}>
                        {isEmailVerified(user) ? (
                          <div className="flex items-center gap-1">
                            <UserCheck className="size-3" />
                            محقق
                          </div>
                        ) : (
                          'غير محقق'
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3 text-muted-foreground" />
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="size-3 mr-1" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="size-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد مستخدمين</p>
              <p className="text-sm">ابدأ بإضافة مستخدم جديد</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>مستخدم جديد</DialogTitle>
            <DialogDescription>إضافة مستخدم جديد إلى النظام</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-12 gap-3 mt-1">
            <div className="col-span-12">
              <Label>الاسم</Label>
              <Input 
                value={userForm.name} 
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} 
                placeholder="أدخل الاسم الكامل"
              />
            </div>
            <div className="col-span-12">
              <Label>البريد الإلكتروني</Label>
              <Input 
                type="email"
                value={userForm.email} 
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} 
                placeholder="أدخل البريد الإلكتروني"
              />
            </div>
            <div className="col-span-12">
              <Label>كلمة المرور</Label>
              <Input 
                type="password"
                value={userForm.password} 
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} 
                placeholder="أدخل كلمة المرور"
              />
            </div>
            <div className="col-span-12">
              <Label>تأكيد كلمة المرور</Label>
              <Input 
                type="password"
                value={userForm.password_confirmation} 
                onChange={(e) => setUserForm({ ...userForm, password_confirmation: e.target.value })} 
                placeholder="أعد إدخال كلمة المرور"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateUser} disabled={loading}>
              إنشاء المستخدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>تحديث بيانات المستخدم</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-12 gap-3 mt-1">
            <div className="col-span-12">
              <Label>الاسم</Label>
              <Input 
                value={userForm.name} 
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} 
                placeholder="أدخل الاسم الكامل"
              />
            </div>
            <div className="col-span-12">
              <Label>البريد الإلكتروني</Label>
              <Input 
                type="email"
                value={userForm.email} 
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} 
                placeholder="أدخل البريد الإلكتروني"
              />
            </div>
            <div className="col-span-12">
              <Label>كلمة المرور الجديدة (اختياري)</Label>
              <Input 
                type="password"
                value={userForm.password} 
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} 
                placeholder="اترك فارغاً للحفاظ على كلمة المرور الحالية"
              />
            </div>
            {userForm.password && (
              <div className="col-span-12">
                <Label>تأكيد كلمة المرور الجديدة</Label>
                <Input 
                  type="password"
                  value={userForm.password_confirmation} 
                  onChange={(e) => setUserForm({ ...userForm, password_confirmation: e.target.value })} 
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditUser} disabled={loading}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}