import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Sparkles, CheckCircle2, XCircle, Calendar, Building2, User } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import dayjs from 'dayjs'

interface CleaningNotification {
  id: number
  room_id: number
  reservation_id: number | null
  type: 'checkout' | 'periodic'
  status: 'pending' | 'completed' | 'dismissed'
  notes: string | null
  notified_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  room?: {
    id: number
    number: string
    floor?: {
      name: string
    }
  }
  reservation?: {
    id: number
    customer?: {
      name: string
    }
  }
}

function CleaningNotifications() {
  const [notifications, setNotifications] = useState<CleaningNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all' | 'completed'>('pending')
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<CleaningNotification | null>(null)
  const [completeNotes, setCompleteNotes] = useState('')

  useEffect(() => {
    fetchNotifications()
  }, [filterStatus])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterStatus !== 'all') {
        params.status = filterStatus
      }
      const { data } = await apiClient.get('/cleaning-notifications', { params })
      setNotifications(data?.data || data || [])
    } catch (e) {
      console.error('Failed to fetch cleaning notifications', e)
      toast.error('فشل تحميل تنبيهات النظافة')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!selectedNotification) return

    try {
      setLoading(true)
      await apiClient.post(`/cleaning-notifications/${selectedNotification.id}/complete`, {
        notes: completeNotes
      })
      toast.success('تم تعليم التنبيه كمكتمل')
      setOpenCompleteDialog(false)
      setSelectedNotification(null)
      setCompleteNotes('')
      fetchNotifications()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل تحديث التنبيه')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (notification: CleaningNotification) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا التنبيه؟')) return

    try {
      setLoading(true)
      await apiClient.post(`/cleaning-notifications/${notification.id}/dismiss`)
      toast.success('تم إلغاء التنبيه')
      fetchNotifications()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل إلغاء التنبيه')
    } finally {
      setLoading(false)
    }
  }

  const openCompleteDialogHandler = (notification: CleaningNotification) => {
    setSelectedNotification(notification)
    setCompleteNotes('')
    setOpenCompleteDialog(true)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'checkout': return 'بعد المغادرة'
      case 'periodic': return 'دوري (كل يومين)'
      default: return type
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'checkout': return 'default'
      case 'periodic': return 'secondary'
      default: return 'outline'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد'
    return dayjs(dateString).format('DD/MM/YYYY HH:mm')
  }

  const filteredNotifications = notifications.filter(n => {
    if (filterStatus === 'all') return true
    return n.status === filterStatus
  })

  const pendingCount = notifications.filter(n => n.status === 'pending').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="تنبيهات النظافة"
        description="إدارة تنبيهات تنظيف الغرف"
        icon="🧹"
      />

      <Card className="border-border/40 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              قائمة التنبيهات ({filteredNotifications.length})
              {pendingCount > 0 && (
                <Badge variant="destructive" className="mr-2">
                  {pendingCount} قيد الانتظار
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                قيد الانتظار ({notifications.filter(n => n.status === 'pending').length})
              </Button>
              <Button
                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('completed')}
              >
                مكتملة ({notifications.filter(n => n.status === 'completed').length})
              </Button>
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                الكل
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">الغرفة</TableHead>
                  <TableHead className="text-center">النوع</TableHead>
                  <TableHead className="text-center">العميل</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">تاريخ التنبيه</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Building2 className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {notification.room?.number || `#${notification.room_id}`}
                        </span>
                        {notification.room?.floor && (
                          <span className="text-sm text-muted-foreground">
                            ({notification.room.floor.name})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getTypeBadgeVariant(notification.type)}>
                        {getTypeLabel(notification.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {notification.reservation?.customer ? (
                        <div className="flex items-center justify-center gap-2">
                          <User className="size-4 text-muted-foreground" />
                          {notification.reservation.customer.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">غير محدد</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={
                          notification.status === 'pending' ? 'default' :
                          notification.status === 'completed' ? 'secondary' : 'outline'
                        }
                      >
                        {notification.status === 'pending' ? 'قيد الانتظار' :
                         notification.status === 'completed' ? 'مكتملة' : 'ملغاة'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="size-3 text-muted-foreground" />
                        {formatDate(notification.notified_at || notification.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {notification.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCompleteDialogHandler(notification)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle2 className="size-3 mr-1" />
                              إكمال
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDismiss(notification)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="size-3 mr-1" />
                              إلغاء
                            </Button>
                          </>
                        )}
                        {notification.status === 'completed' && notification.completed_at && (
                          <span className="text-sm text-muted-foreground">
                            مكتملة: {formatDate(notification.completed_at)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="size-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد تنبيهات</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openCompleteDialog} onOpenChange={setOpenCompleteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إكمال التنبيه</DialogTitle>
            <DialogDescription>
              تعليم التنبيه كمكتمل وإضافة ملاحظات (اختياري)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>الملاحظات</Label>
              <Textarea
                placeholder="أضف ملاحظات حول التنظيف..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCompleteDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleComplete} disabled={loading}>
              إكمال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CleaningNotifications
