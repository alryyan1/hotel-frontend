import { useState, useEffect, useRef } from 'react'
import apiClient from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Grid3x3, List, Search, Filter } from 'lucide-react'
import CreateRoomDialog from '@/components/dialogs/CreateRoomDialog'
import RoomDetailsDialog from '@/components/dialogs/RoomDetailsDialog'

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([])
  const [filteredRooms, setFilteredRooms] = useState<any[]>([])
  const [displayedRooms, setDisplayedRooms] = useState<any[]>([])
  const [floors, setFloors] = useState<any[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [roomStatuses, setRoomStatuses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFloor, setFilterFloor] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(9)
  const [dataLoaded, setDataLoaded] = useState(false)
  const hasFetchedRef = useRef(false) // Use ref to prevent double calls in StrictMode

  useEffect(() => {
    // Only fetch once on mount
    if (hasFetchedRef.current || dataLoaded) return
    
    hasFetchedRef.current = true
    let isMounted = true
    fetchData()
    
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount
// alert('useEffect')
  useEffect(() => {
    filterRooms()
  }, [rooms, searchTerm, filterFloor, filterType, filterStatus])

  useEffect(() => {
    const start = page * rowsPerPage
    const end = start + rowsPerPage
    setDisplayedRooms(filteredRooms.slice(start, end))
  }, [filteredRooms, page, rowsPerPage])

  const fetchData = async () => {
    // alert('fetchData')
    try {
      setLoading(true)
      setDataLoaded(false) // Reset flag for manual refresh
      const [roomsRes, floorsRes, roomTypesRes, roomStatusesRes] = await Promise.all([
        apiClient.get('/rooms'),
        apiClient.get('/floors'),
        apiClient.get('/room-types'),
        apiClient.get('/room-statuses')
      ])
      // alert('data loaded')
      console.log(roomsRes.data,'roomsRes.data')
      setRooms(roomsRes.data)
      setFloors(floorsRes.data)
      setRoomTypes(roomTypesRes.data)
      setRoomStatuses(roomStatusesRes.data)
      setDataLoaded(true)
    } catch (err) {
      setError('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const filterRooms = () => {
    const filtered = rooms.filter((room: any) => {
      const matchesSearch = (room.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.type?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFloor = !filterFloor || String(room.floor_id) === filterFloor
      const matchesType = !filterType || String(room.room_type_id) === filterType
      const matchesStatus = !filterStatus || String(room.room_status_id) === filterStatus
      return matchesSearch && matchesFloor && matchesType && matchesStatus
    })
    setFilteredRooms(filtered)
    setPage(0)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterFloor('')
    setFilterType('')
    setFilterStatus('')
  }

  const handleDialogSuccess = () => {
    if (editingRoom) {
      setSuccess('تم تحديث الغرفة بنجاح')
    } else {
      setSuccess('تم إنشاء الغرفة بنجاح')
    }
    setEditingRoom(null)
    fetchData()
  }

  const handleDialogError = (message: string) => {
    setError(message)
  }

  const handleEdit = (room: any) => {
    setEditingRoom(room)
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الغرفة؟')) return
    try {
      setLoading(true)
      await apiClient.delete(`/rooms/${id}`)
      setSuccess('تم حذف الغرفة بنجاح')
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: any) => status?.color || '#2196f3'
  const getStatusName = (status: any) => status?.name || 'غير محدد'

  const RoomCard = ({ room }: { room: any }) => (
    <Card className="relative border-border/40 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 overflow-hidden group">
      <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: getStatusColor(room.status) }} />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow">
            {room.number}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">غرفة {room.number}</CardTitle>
            <CardDescription className="text-xs">الدور {room.floor?.number} {room.floor?.name ? `• ${room.floor.name}` : ''}</CardDescription>
          </div>
        </div>
      </CardHeader>
 
      <CardFooter className="flex justify-between pt-3 border-t border-border/40">
        <Button variant="ghost" size="sm" onClick={() => handleView(room)} className="hover:bg-primary/10">عرض</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(room)}>تعديل</Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(room.id)}>حذف</Button>
        </div>
      </CardFooter>
    </Card>
  )

  const handleView = (room: any) => {
    setSelectedRoom(room)
    setOpenDetailsDialog(true)
  }

  const handleDetailsSuccess = () => {
    setSuccess('تم تحديث حالة الغرفة')
    setSelectedRoom(null)
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      {/* <PageHeader
        title="إدارة الغرف"
        description="إدارة وتنظيم غرف الفندق بسهولة"
        icon="🏨"
      /> */}

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
      )}

      {/* Modern Filters Card - Mobile Responsive */}
      <Card className="border-border/40 shadow-lg">
        <CardContent className="pt-1 sm:pt-1">
          {/* Search Bar - Full width on mobile */}
          <div className="mb-1 sm:mb-1">
            <Label className="flex items-center gap-2 mb-2 text-sm font-medium">
              <Search className="size-4" />
              البحث
            </Label>
            <Input
              placeholder="ابحث عن غرفة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full"
            />
          </div>

          {/* Filters Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <Label className="text-sm font-medium">الدور</Label>
              <Select value={filterFloor} onValueChange={setFilterFloor}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="جميع الأدوار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  {floors.map((floor: any) => (
                    <SelectItem key={floor.id} value={String(floor.id)}>الدور {floor.number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">النوع</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {roomTypes.map((type: any) => (
                    <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {roomStatuses.map((status: any) => (
                    <SelectItem key={status.id} value={String(status.id)}>{status.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">العرض</Label>
              <div className="flex gap-2">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="flex-1 h-9"
                >
                  <Grid3x3 className="size-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1 h-9"
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Action Bar - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 sm:mt-6 pt-4 border-t border-border/40">
            <div className="text-sm text-muted-foreground font-medium">
              <span className="text-foreground font-bold">{filteredRooms.length}</span> من أصل <span className="text-foreground font-bold">{rooms.length}</span> غرفة
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={clearFilters} className="h-9 w-full sm:w-auto">
                <Filter className="size-4 mr-2" />
                مسح المرشحات
              </Button>
              <Button onClick={() => setOpenDialog(true)} className="h-9 w-full sm:w-auto shadow-md">
                إضافة غرفة جديدة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="h-72 animate-pulse bg-muted/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-muted/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted/50 rounded w-3/4" />
                    <div className="h-3 bg-muted/30 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted/40 rounded" />
                  <div className="h-3 bg-muted/30 rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedRooms.map((room: any) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <Card className="">
              <div className="">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">الغرفة</TableHead>
                      <TableHead className="hidden sm:table-cell text-center">الدور</TableHead>
                      <TableHead className="hidden md:table-cell text-center">النوع</TableHead>
                      <TableHead className="hidden lg:table-cell text-center">الأسرة</TableHead>
                      <TableHead className=" text-center">الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedRooms.map((room: any) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-semibold text-center">
                          <div className="flex flex-col">
                            <span>غرفة {room.number}</span>
                            <span className="text-xs text-muted-foreground sm:hidden">
                              الدور {room.floor?.number} • {room.type?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center  ">الدور {room.floor?.number}</TableCell>
                        <TableCell className="hidden md:table-cell text-center">{room.type?.name}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center">{room.beds}</TableCell>
                        <TableCell className="text-center">
                          <Badge style={{ backgroundColor: getStatusColor(room.status) }} className="text-white text-xs">
                            {getStatusName(room.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap gap-1 justify-center items-center">
                            <Button variant="ghost" size="sm" onClick={() => handleView(room)} className="h-8 px-2 text-xs">
                              عرض
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(room)} className="h-8 px-2 text-xs">
                              تعديل
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(room.id)} className="h-8 px-2 text-xs">
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {filteredRooms.length === 0 && !loading && (
            <Card className="p-12 text-center border-border/40 shadow-lg">
              <div className="text-8xl mb-4 opacity-50">🏨</div>
              <h3 className="text-xl font-bold text-foreground mb-2">لا توجد غرف متاحة</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || filterFloor || filterType || filterStatus 
                  ? 'لم يتم العثور على غرف تطابق معايير البحث. جرب تعديل المرشحات.'
                  : 'ابدأ بإضافة غرف جديدة للفندق لتظهر هنا.'}
              </p>
              {!(searchTerm || filterFloor || filterType || filterStatus) && (
                <Button onClick={() => setOpenDialog(true)} size="lg" className="shadow-md">
                  إضافة غرفة جديدة
                </Button>
              )}
            </Card>
          )}

          {filteredRooms.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">
                الصفحة {page + 1} من {Math.ceil(filteredRooms.length / rowsPerPage)}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">عرض:</span>
                  <Select value={String(rowsPerPage)} onValueChange={(v: string) => { setRowsPerPage(parseInt(v)); setPage(0); }}>
                    <SelectTrigger className="w-16 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 9, 12, 24].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))} className="h-9 px-3">
                    السابق
                  </Button>
                  <Button variant="outline" size="sm" disabled={(page + 1) * rowsPerPage >= filteredRooms.length} onClick={() => setPage((p) => p + 1)} className="h-9 px-3">
                    التالي
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <CreateRoomDialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open)
          if (!open) {
            setEditingRoom(null)
          }
        }}
        editingRoom={editingRoom}
        floors={floors}
        roomTypes={roomTypes}
        roomStatuses={roomStatuses}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />

      {/* Details Dialog */}
      <RoomDetailsDialog
        open={openDetailsDialog}
        onOpenChange={(open) => {
          setOpenDetailsDialog(open)
          if (!open) {
            setSelectedRoom(null)
          }
        }}
        selectedRoom={selectedRoom}
        roomStatuses={roomStatuses}
        onSuccess={handleDetailsSuccess}
        onError={handleDialogError}
      />
    </div>
  )
}
