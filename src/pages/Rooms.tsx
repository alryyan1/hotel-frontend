import { useState, useEffect, useRef } from 'react'
import apiClient from '../api/axios'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Grid3x3, List, Search, Filter, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import CreateRoomDialog from '@/components/dialogs/CreateRoomDialog'
import RoomDetailsDialog from '@/components/dialogs/RoomDetailsDialog'
import RoomReservationsDialog from '@/components/dialogs/RoomReservationsDialog'

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
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFloor, setFilterFloor] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(9)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [highlightedRoomId, setHighlightedRoomId] = useState<number | null>(null)
  const [reservations, setReservations] = useState<any[]>([])
  const [openReservationsDialog, setOpenReservationsDialog] = useState(false)
  const [selectedRoomForReservations, setSelectedRoomForReservations] = useState<any>(null)
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

  const fetchData = async (): Promise<void> => {
    // alert('fetchData')
    try {
      setLoading(true)
      setDataLoaded(false) // Reset flag for manual refresh
      const [roomsRes, floorsRes, roomTypesRes, roomStatusesRes, reservationsRes] = await Promise.all([
        apiClient.get('/rooms'),
        apiClient.get('/floors'),
        apiClient.get('/room-types'),
        apiClient.get('/room-statuses'),
        apiClient.get('/reservations').catch(() => ({ data: [] })) // Fetch reservations, but don't fail if it errors
      ])
      // alert('data loaded')
      console.log(roomsRes.data,'roomsRes.data')
      // Backend returns grouped data, flatten it for filtering
      const groupedRooms = roomsRes.data || []
      const allRooms = groupedRooms.flatMap((group: any) => group.rooms || [])
      setRooms(allRooms)
      setFloors(floorsRes.data)
      setRoomTypes(roomTypesRes.data)
      setRoomStatuses(roomStatusesRes.data)
      const reservationsData = reservationsRes.data?.data || reservationsRes.data || []
      setReservations(Array.isArray(reservationsData) ? reservationsData : [])
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

  const handleDialogSuccess = async (roomId?: number) => {
    if (editingRoom) {
      setSuccess('تم تحديث الغرفة بنجاح')
    } else {
      setSuccess('تم إنشاء الغرفة بنجاح')
    }
    setEditingRoom(null)
    
    // Fetch data first, then highlight the updated/new room
    await fetchData()
    
    // Highlight the updated/new room after data is loaded
    if (roomId) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        setHighlightedRoomId(roomId)
        // Clear highlight after animation completes (3 seconds for 2 iterations)
        setTimeout(() => {
          setHighlightedRoomId(null)
        }, 3000)
      }, 100)
    }
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

  // Helper function to format numbers with thousands separator
  const formatNumber = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '-'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '-'
    return num.toLocaleString('en-US')
  }

  // Check if a room has active reservations
  const hasActiveReservations = (roomId: number): boolean => {
    const activeStatuses = ['pending', 'confirmed', 'checked_in']
    return reservations.some((reservation: any) => 
      activeStatuses.includes(reservation.status) &&
      reservation.rooms?.some((room: any) => room.id === roomId)
    )
  }

  // Get days remaining until room becomes available
  const getDaysRemaining = (roomId: number): number | null => {
    const activeStatuses = ['pending', 'confirmed', 'checked_in']
    const roomReservations = reservations.filter((reservation: any) => 
      activeStatuses.includes(reservation.status) &&
      reservation.rooms?.some((room: any) => room.id === roomId)
    )
    
    if (roomReservations.length === 0) return null
    
    // Find the latest check-out date
    const latestCheckOut = roomReservations.reduce((latest: string | null, reservation: any) => {
      const checkOutDate = reservation.check_out_date
      if (!latest) return checkOutDate
      return dayjs(checkOutDate).isAfter(dayjs(latest)) ? checkOutDate : latest
    }, null)
    
    if (!latestCheckOut) return null
    
    const today = dayjs().startOf('day')
    const checkOut = dayjs(latestCheckOut).startOf('day')
    const days = checkOut.diff(today, 'day')
    
    return days >= 0 ? days : 0 // Return 0 if already past check-out date
  }

  // Get count of reservations for a room
  const getReservationsCount = (roomId: number): number => {
    return reservations.filter((reservation: any) => 
      reservation.rooms?.some((room: any) => room.id === roomId)
    ).length
  }

  const handleViewReservations = (room: any) => {
    setSelectedRoomForReservations(room)
    setOpenReservationsDialog(true)
  }

  const RoomCard = ({ room, isHighlighted }: { room: any; isHighlighted?: boolean }) => {
    const isAvailable = !hasActiveReservations(room.id)
    return (
    <Card className={`relative border-border/40 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 overflow-hidden group ${
      isHighlighted ? 'animate-highlight border-primary/60 shadow-lg shadow-primary/20' : ''
    }`}>
      <div className={`absolute top-0 inset-x-0 h-1 ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow">
            {room.number}
            <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
              hasActiveReservations(room.id) ? 'bg-red-500' : 'bg-green-500'
            }`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              غرفة {room.number}
              <div className={`h-2 w-2 rounded-full ${
                hasActiveReservations(room.id) ? 'bg-red-500' : 'bg-green-500'
              }`} />
            </CardTitle>
            <CardDescription className="text-xs">الطابق {room.floor?.number} {room.floor?.name ? `• ${room.floor.name}` : ''}</CardDescription>
            {room.type && (
              <div className="mt-1">
                <Badge variant="secondary" className="text-xs">
                  {room.type.name}
                </Badge>
              </div>
            )}
            {hasActiveReservations(room.id) && (() => {
              const daysRemaining = getDaysRemaining(room.id)
              return daysRemaining !== null ? (
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    <Calendar className="size-3 mr-1" />
                    متاح خلال {daysRemaining === 0 ? 'اليوم' : daysRemaining === 1 ? 'يوم واحد' : `${daysRemaining} أيام`}
                  </Badge>
                </div>
              ) : null
            })()}
          </div>
        </div>
      </CardHeader>
 
      <CardFooter className="flex flex-col gap-2 pt-3 border-t border-border/40">
        <div className="flex justify-between w-full">
          <Button variant="ghost" size="sm" onClick={() => handleView(room)} className="hover:bg-primary/10">عرض</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(room)}>تعديل</Button>
            <Button variant="outline" size="sm" onClick={() => handleDelete(room.id)}>حذف</Button>
          </div>
        </div>
        {hasActiveReservations(room.id) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleViewReservations(room)} 
            className="w-full hover:bg-primary/10 text-primary border-primary/20"
          >
            <Calendar className="size-4 mr-2" />
            عرض الحجوزات النشطة
          </Button>
        )}
      </CardFooter>
    </Card>
    )
  }

  const handleView = (room: any) => {
    setSelectedRoom(room)
    setOpenDetailsDialog(true)
  }

  const handleDetailsSuccess = async (roomId?: number) => {
    setSuccess('تم تحديث حالة الغرفة')
    setSelectedRoom(null)
    
    // Fetch data first, then highlight the updated room
    await fetchData()
    
    // Highlight the updated room after data is loaded
    if (roomId) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        setHighlightedRoomId(roomId)
        // Clear highlight after animation completes (3 seconds for 2 iterations)
        setTimeout(() => {
          setHighlightedRoomId(null)
        }, 3000)
      }, 100)
    }
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

      {/* Action Bar */}
        <div className="pt-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground font-medium">
              <span className="text-foreground font-bold">{filteredRooms.length}</span> من أصل <span className="text-foreground font-bold">{rooms.length}</span> غرفة
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} 
                className="h-9 w-full sm:w-auto"
              >
                <List className="size-4 mr-2" />
                {viewMode === 'list' ? 'عرض الشبكة' : 'عرض الجدول'}
              </Button>
              <Button variant="outline" onClick={() => setOpenFiltersDialog(true)} className="h-9 w-full sm:w-auto">
                <Filter className="size-4 mr-2" />
                الفلاتر والبحث
              </Button>
              <Button onClick={() => setOpenDialog(true)} className="h-9 w-full sm:w-auto shadow-md">
                إضافة غرفة جديدة
              </Button>
            </div>
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
                placeholder="ابحث عن غرفة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full"
              />
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">الطابق</Label>
                <Select value={filterFloor} onValueChange={setFilterFloor}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="جميع الأدوار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الأدوار</SelectItem>
                    {floors.map((floor: any) => (
                      <SelectItem key={floor.id} value={String(floor.id)}>الطابق {floor.number}</SelectItem>
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
                    <SelectItem value="">جميع الأنواع</SelectItem>
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
                    <SelectItem value="">جميع الحالات</SelectItem>
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
            <div className="space-y-8">
              {(() => {
                // Group displayed rooms by floor (using backend grouping structure)
                const roomsByFloor = new Map<number | string, { floor: any; rooms: any[] }>()
                displayedRooms.forEach((room: any) => {
                  const floorId = room.floor_id || room.floor?.id || 'no-floor'
                  if (!roomsByFloor.has(floorId)) {
                    roomsByFloor.set(floorId, {
                      floor: room.floor,
                      rooms: []
                    })
                  }
                  roomsByFloor.get(floorId)!.rooms.push(room)
                })
                console.log(roomsByFloor,'roomsByFloor')

                return Array.from(roomsByFloor.entries()).map(([floorId, floorData]) => {
                  const floor = floorData.floor
                  const floorNumber = floor?.number ?? floorId
                  const floorName = floor?.name ?? ''
                  
                  return (
                    <div key={floorId} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-foreground">
                          الطابق {floorNumber} 
                        </h2>
                        {floorName && (
                          <span className="text-muted-foreground">({floorName})</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {floorData.rooms.map((room: any) => (
                          <RoomCard key={room.id} room={room} isHighlighted={highlightedRoomId === room.id} />
                        ))}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          ) : (
            <Card className="">
              <div className="">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">الغرفة</TableHead>
                      <TableHead className="hidden sm:table-cell text-center">الطابق</TableHead>
                      <TableHead className="hidden md:table-cell text-center">النوع</TableHead>
                      <TableHead className="hidden lg:table-cell text-center">السعر</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-center">الحجوزات</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedRooms.map((room: any) => (
                      <TableRow 
                        key={room.id}
                        className={highlightedRoomId === room.id ? 'animate-highlight bg-primary/5 border-primary/60' : ''}
                      >
                        <TableCell className="font-semibold text-center">
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center justify-center gap-2">
                              غرفة {room.number}
                              <div className={`h-2 w-2 rounded-full ${
                                hasActiveReservations(room.id) ? 'bg-red-500' : 'bg-green-500'
                              }`} />
                            </span>
                            <span className="text-xs text-muted-foreground sm:hidden">
                              الطابق {room.floor?.number} • {room.type?.name}
                            </span>
                            {hasActiveReservations(room.id) && (() => {
                              const daysRemaining = getDaysRemaining(room.id)
                              return daysRemaining !== null ? (
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 w-fit mx-auto sm:mx-0">
                                  <Calendar className="size-3 mr-1" />
                                  متاح خلال {daysRemaining === 0 ? 'اليوم' : daysRemaining === 1 ? 'يوم واحد' : `${daysRemaining} أيام`}
                                </Badge>
                              ) : null
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center  ">الطابق {room.floor?.number}</TableCell>
                        <TableCell className="hidden md:table-cell text-center">{room.type?.name}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-semibold">
                          {room.type?.base_price ? formatNumber(room.type.base_price) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge style={{ backgroundColor: getStatusColor(room.status) }} className="text-white text-xs">
                            {getStatusName(room.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-semibold">
                            {getReservationsCount(room.id)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <div className="flex flex-wrap gap-1 justify-center items-center">
                              <Button variant="ghost" size="sm" onClick={() => handleView(room)} className="h-8 px-2 text-xs">
                                عرض
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(room)} className="h-8 px-2 text-xs">
                                تعديل
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(room.id)} className="h-8 px-2 text-xs">
                                حذف
                              </Button>
                            </div>
                            {hasActiveReservations(room.id) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewReservations(room)} 
                                className="h-8 px-2 text-xs text-primary border-primary/20 hover:bg-primary/10 mt-1"
                              >
                                <Calendar className="size-3 mr-1" />
                                الحجوزات النشطة
                              </Button>
                            )}
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

      {/* Reservations Dialog */}
      <RoomReservationsDialog
        open={openReservationsDialog}
        onOpenChange={(open) => {
          setOpenReservationsDialog(open)
          if (!open) {
            setSelectedRoomForReservations(null)
          }
        }}
        roomId={selectedRoomForReservations?.id || null}
        roomNumber={selectedRoomForReservations?.number || ''}
      />
    </div>
  )
}
