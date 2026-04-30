import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Search, Plus, Edit, Trash2, Users as UsersIcon, Calendar, Shield, KeyRound } from 'lucide-react'
import dayjs from 'dayjs'
import { ALL_PAGES, PAGES_BY_GROUP } from '../constants/pages'
import { useAuth } from '../contexts/AuthContext'

interface User {
  id: number
  name: string
  username: string
  is_admin: boolean
  permissions: string[] | null
  created_at: string
  updated_at: string
}

const emptyForm = {
  name: '',
  username: '',
  password: '',
  password_confirmation: '',
  is_admin: false,
  permissions: [] as string[],
}

export default function Users() {
  const { user: currentUser, setUser: setAuthUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openPermissions, setOpenPermissions] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({ ...emptyForm })

  useEffect(() => { fetchUsers() }, [])

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
    if (!userForm.name || !userForm.username || !userForm.password) {
      toast.error('جميع الحقول مطلوبة')
      return
    }
    if (userForm.password !== userForm.password_confirmation) {
      toast.error('كلمة المرور غير متطابقة')
      return
    }
    try {
      setLoading(true)
      const { data } = await apiClient.post('/users', {
        name: userForm.name,
        username: userForm.username,
        password: userForm.password,
        password_confirmation: userForm.password_confirmation,
        is_admin: userForm.is_admin,
        permissions: userForm.is_admin ? [] : userForm.permissions,
      })
      setUsers(prev => [data, ...prev])
      setOpenCreate(false)
      setUserForm({ ...emptyForm })
      toast.success('تم إنشاء المستخدم بنجاح')
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errors = Object.values(err.response.data.errors).flat().join(', ')
        toast.error(`خطأ في البيانات: ${errors}`)
      } else {
        toast.error(err?.response?.data?.message || 'فشل إنشاء المستخدم')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    if (!userForm.name || !userForm.username) {
      toast.error('الاسم واسم المستخدم مطلوبان')
      return
    }
    if (userForm.password && userForm.password !== userForm.password_confirmation) {
      toast.error('كلمة المرور غير متطابقة')
      return
    }
    try {
      setLoading(true)
      const payload: any = {
        name: userForm.name,
        username: userForm.username,
        is_admin: userForm.is_admin,
        permissions: userForm.is_admin ? [] : userForm.permissions,
      }
      if (userForm.password) {
        payload.password = userForm.password
        payload.password_confirmation = userForm.password_confirmation
      }
      const { data } = await apiClient.put(`/users/${selectedUser.id}`, payload)
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? data : u))
      // If editing self, update auth context
      if (currentUser && currentUser.id === selectedUser.id) {
        setAuthUser({ ...currentUser, ...data })
      }
      setOpenEdit(false)
      setSelectedUser(null)
      setUserForm({ ...emptyForm })
      toast.success('تم تحديث المستخدم بنجاح')
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errors = Object.values(err.response.data.errors).flat().join(', ')
        toast.error(`خطأ في البيانات: ${errors}`)
      } else {
        toast.error(err?.response?.data?.message || 'فشل تحديث المستخدم')
      }
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
      toast.success('تم حذف المستخدم بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل حذف المستخدم')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setUserForm({
      name: user.name,
      username: user.username,
      password: '',
      password_confirmation: '',
      is_admin: user.is_admin,
      permissions: user.permissions ?? [],
    })
    setOpenEdit(true)
  }

  const openPermissionsDialog = (user: User) => {
    setSelectedUser(user)
    setUserForm(f => ({
      ...f,
      is_admin: user.is_admin,
      permissions: user.permissions ?? [],
    }))
    setOpenPermissions(true)
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return
    try {
      setLoading(true)
      const { data } = await apiClient.put(`/users/${selectedUser.id}`, {
        name: selectedUser.name,
        username: selectedUser.username,
        is_admin: userForm.is_admin,
        permissions: userForm.is_admin ? [] : userForm.permissions,
      })
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? data : u))
      if (currentUser && currentUser.id === selectedUser.id) {
        setAuthUser({ ...currentUser, ...data })
      }
      setOpenPermissions(false)
      toast.success('تم حفظ الصلاحيات بنجاح')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل حفظ الصلاحيات')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (path: string) => {
    setUserForm(f => ({
      ...f,
      permissions: f.permissions.includes(path)
        ? f.permissions.filter(p => p !== path)
        : [...f.permissions, path],
    }))
  }

  const toggleGroupPermissions = (paths: string[]) => {
    const allSelected = paths.every(p => userForm.permissions.includes(p))
    setUserForm(f => ({
      ...f,
      permissions: allSelected
        ? f.permissions.filter(p => !paths.includes(p))
        : [...new Set([...f.permissions, ...paths])],
    }))
  }

  const selectAll = () => setUserForm(f => ({ ...f, permissions: ALL_PAGES.map(p => p.path) }))
  const clearAll  = () => setUserForm(f => ({ ...f, permissions: [] }))

  const getPermissionCount = (user: User) => {
    if (user.is_admin) return ALL_PAGES.length
    return (user.permissions ?? []).length
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const commonProps = {
    userForm,
    setUserForm,
    togglePermission,
    toggleGroupPermissions,
    selectAll,
    clearAll
  }



  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المستخدمين"
        description="إدارة حسابات المستخدمين والصلاحيات"
        icon="👤"
      />

      <Card className="border-border/40 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="size-5 text-primary" />
              قائمة المستخدمين ({filteredUsers.length})
            </CardTitle>
            <Button onClick={() => { setUserForm({ ...emptyForm }); setOpenCreate(true) }} className="shadow-md">
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
                placeholder="البحث بالاسم أو اسم المستخدم..."
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
                  <TableHead className="text-center">الاسم</TableHead>
                  <TableHead className="text-center">اسم المستخدم</TableHead>
                  <TableHead className="text-center">الصلاحيات</TableHead>
                  <TableHead className="text-center">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        {user.name}
                        {currentUser?.id === user.id && (
                          <Badge variant="outline" className="text-xs">أنت</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <UsersIcon className="size-3 text-muted-foreground" />
                        {user.username}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.is_admin ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                          <Shield className="size-3" /> مدير كامل
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <KeyRound className="size-3" />
                          {getPermissionCount(user)} / {ALL_PAGES.length} صفحة
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="size-3 text-muted-foreground" />
                        {dayjs(user.created_at).format('DD/MM/YYYY')}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openPermissionsDialog(user)}>
                          <Shield className="size-3 mr-1" /> الصلاحيات
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          <Edit className="size-3 mr-1" /> تعديل
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={currentUser?.id === user.id}
                        >
                          <Trash2 className="size-3 mr-1" /> حذف
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>مستخدم جديد</DialogTitle>
            <DialogDescription>إضافة مستخدم جديد وتحديد صلاحياته</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم</Label>
                <Input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="الاسم الكامل" />
              </div>
              <div>
                <Label>اسم المستخدم</Label>
                <Input value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} placeholder="username" />
              </div>
              <div>
                <Label>كلمة المرور (6 أحرف على الأقل)</Label>
                <Input 
                  type="password" 
                  value={userForm.password} 
                  onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} 
                  placeholder="6 أحرف على الأقل"
                />
              </div>
              <div>
                <Label>تأكيد كلمة المرور</Label>
                <Input 
                  type="password" 
                  value={userForm.password_confirmation} 
                  onChange={e => setUserForm(f => ({ ...f, password_confirmation: e.target.value }))} 
                  placeholder="أعد كتابة كلمة المرور"
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="font-semibold text-sm mb-3 flex items-center gap-2"><Shield className="size-4" /> الصلاحيات</p>
              <PermissionsEditor {...commonProps} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>إلغاء</Button>
            <Button onClick={handleCreateUser} disabled={loading}>إنشاء المستخدم</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>تحديث بيانات المستخدم وصلاحياته</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم</Label>
                <Input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>اسم المستخدم</Label>
                <Input value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <Label>كلمة المرور الجديدة (اختياري)</Label>
                <Input 
                  type="password" 
                  value={userForm.password} 
                  onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} 
                  placeholder="6 أحرف على الأقل (اترك فارغاً للإبقاء)" 
                />
              </div>
              {userForm.password && (
                <div>
                  <Label>تأكيد كلمة المرور الجديدة</Label>
                  <Input 
                    type="password" 
                    value={userForm.password_confirmation} 
                    onChange={e => setUserForm(f => ({ ...f, password_confirmation: e.target.value }))} 
                    placeholder="أعد كتابة كلمة المرور"
                  />
                </div>
              )}
            </div>
            <div className="border-t pt-4">
              <p className="font-semibold text-sm mb-3 flex items-center gap-2"><Shield className="size-4" /> الصلاحيات</p>
              <PermissionsEditor {...commonProps} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>إلغاء</Button>
            <Button onClick={handleEditUser} disabled={loading}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standalone Permissions Dialog */}
      <Dialog open={openPermissions} onOpenChange={setOpenPermissions}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5" />
              صلاحيات: {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>تحديد الصفحات التي يمكن للمستخدم الوصول إليها</DialogDescription>
          </DialogHeader>
          <PermissionsEditor {...commonProps} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPermissions(false)}>إلغاء</Button>
            <Button onClick={handleSavePermissions} disabled={loading}>حفظ الصلاحيات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PermissionsEditor({ 
  userForm, 
  setUserForm, 
  togglePermission, 
  toggleGroupPermissions, 
  selectAll, 
  clearAll 
}: any) {
  return (
    <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
      {/* Admin toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
        <div>
          <p className="font-semibold text-sm">صلاحيات المدير الكاملة</p>
          <p className="text-xs text-muted-foreground">وصول غير مقيد لجميع الصفحات</p>
        </div>
        <Switch
          checked={userForm.is_admin}
          onCheckedChange={v => setUserForm((f: any) => ({ ...f, is_admin: v }))}
        />
      </div>

      {!userForm.is_admin && (
        <>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAll} className="text-xs">تحديد الكل</Button>
            <Button size="sm" variant="outline" onClick={clearAll}  className="text-xs">إلغاء الكل</Button>
            <span className="ms-auto text-xs text-muted-foreground self-center">
              {userForm.permissions.length} / {ALL_PAGES.length} صفحة
            </span>
          </div>

          {Object.entries(PAGES_BY_GROUP).map(([group, pages]) => {
            const paths = pages.map(p => p.path)
            const allChecked  = paths.every(p => userForm.permissions.includes(p))
            const someChecked = paths.some(p => userForm.permissions.includes(p))
            return (
              <div key={group} className="border rounded-lg overflow-hidden">
                {/* Group header */}
                <div
                  role="button"
                  onClick={() => toggleGroupPermissions(paths)}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-muted/40 hover:bg-muted/70 transition-colors text-right cursor-pointer"
                >
                  <Checkbox
                    checked={allChecked}
                    data-state={someChecked && !allChecked ? 'indeterminate' : undefined}
                    onCheckedChange={() => toggleGroupPermissions(paths)}
                    onClick={e => e.stopPropagation()}
                    className="shrink-0"
                  />
                  <span className="font-semibold text-sm">{group}</span>
                  <span className="ms-auto text-xs text-muted-foreground">
                    {paths.filter(p => userForm.permissions.includes(p)).length}/{paths.length}
                  </span>
                </div>
                {/* Pages */}
                <div className="divide-y">
                  {pages.map(page => (
                    <label
                      key={page.path}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-accent/40 cursor-pointer"
                    >
                      <Checkbox
                        checked={userForm.permissions.includes(page.path)}
                        onCheckedChange={() => togglePermission(page.path)}
                      />
                      <span className="text-sm">{page.label}</span>
                      <span className="ms-auto text-xs text-muted-foreground font-mono">{page.path}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
      {userForm.is_admin && (
        <p className="text-center text-sm text-muted-foreground py-4">
          المدير يملك وصولاً كاملاً لجميع الصفحات تلقائياً
        </p>
      )}
    </div>
  )
}
