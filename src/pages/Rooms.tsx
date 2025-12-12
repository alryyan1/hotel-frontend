import { useState, useEffect, useRef } from 'react'
import apiClient from '../api/axios'
import { Box, Button, Card, CardContent, Grid, Stack, CircularProgress, Typography } from '@mui/material'
import { List as ListIcon, Filter as FilterIcon } from '@mui/icons-material'
import { toast } from 'sonner'
import CreateRoomDialog from '@/components/dialogs/CreateRoomDialog'
import RoomDetailsDialog from '@/components/dialogs/RoomDetailsDialog'
import RoomReservationsDialog from '@/components/dialogs/RoomReservationsDialog'
import FiltersDialog from '@/components/rooms/FiltersDialog'
import GridView from '@/components/rooms/GridView'
import TableView from '@/components/rooms/TableView'
import EmptyState from '@/components/rooms/EmptyState'
import Pagination from '@/components/rooms/Pagination'
import {
  formatNumber,
  getStatusColor,
  getStatusName,
  hasActiveReservations,
  getDaysRemaining,
  getReservationsCount,
  filterRooms as filterRoomsUtil,
} from '@/utils/roomHelpers'

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([])
  const [filteredRooms, setFilteredRooms] = useState<any[]>([])
  const [displayedRooms, setDisplayedRooms] = useState<any[]>([])
  const [floors, setFloors] = useState<any[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [roomStatuses, setRoomStatuses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false)
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
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const filterRooms = () => {
    const filtered = filterRoomsUtil(rooms, searchTerm, filterFloor, filterType, filterStatus)
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
      toast.success('تم تحديث الغرفة بنجاح')
    } else {
      toast.success('تم إنشاء الغرفة بنجاح')
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
    toast.error(message)
  }

  const handleEdit = (room: any) => {
    setEditingRoom(room)
    setOpenDialog(true)
  }

  // Helper functions that use reservations
  const checkActiveReservations = (roomId: number) => hasActiveReservations(roomId, reservations)
  const getDaysRemainingForRoom = (roomId: number) => getDaysRemaining(roomId, reservations)
  const getReservationsCountForRoom = (roomId: number) => getReservationsCount(roomId, reservations)

  const handleViewReservations = (room: any) => {
    setSelectedRoomForReservations(room)
    setOpenReservationsDialog(true)
  }


  const handleView = (room: any) => {
    setSelectedRoom(room)
    setOpenDetailsDialog(true)
  }

  const handleDetailsSuccess = async (roomId?: number) => {
    toast.success('تم تحديث حالة الغرفة')
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      {/* Action Bar */}
      <Box sx={{ pt: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            <Typography component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {filteredRooms.length}
            </Typography>{' '}
            من أصل{' '}
            <Typography component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {rooms.length}
            </Typography>{' '}
            غرفة
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              startIcon={<ListIcon />}
              sx={{ width: { xs: '100%', sm: 'auto' }, height: 36 }}
            >
              {viewMode === 'list' ? 'عرض الشبكة' : 'عرض الجدول'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setOpenFiltersDialog(true)}
              startIcon={<FilterIcon />}
              sx={{ width: { xs: '100%', sm: 'auto' }, height: 36 }}
            >
              الفلاتر والبحث
            </Button>
            <Button
              variant="contained"
              onClick={() => setOpenDialog(true)}
              sx={{ width: { xs: '100%', sm: 'auto' }, height: 36, boxShadow: 2 }}
            >
              إضافة غرفة جديدة
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Filters Dialog */}
      <FiltersDialog
        open={openFiltersDialog}
        onClose={() => setOpenFiltersDialog(false)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterFloor={filterFloor}
        onFilterFloorChange={setFilterFloor}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        floors={floors}
        roomTypes={roomTypes}
        roomStatuses={roomStatuses}
        onClearFilters={clearFilters}
      />

      {/* Content */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={index}>
              <Card sx={{ height: 288 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <CircularProgress size={48} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ height: 16, bgcolor: 'grey.300', borderRadius: 1, mb: 1, width: '75%' }} />
                      <Box sx={{ height: 12, bgcolor: 'grey.200', borderRadius: 1, width: '50%' }} />
                    </Box>
                  </Box>
                  <Stack spacing={1}>
                    <Box sx={{ height: 12, bgcolor: 'grey.300', borderRadius: 1 }} />
                    <Box sx={{ height: 12, bgcolor: 'grey.200', borderRadius: 1, width: '83%' }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <GridView
              rooms={displayedRooms}
              highlightedRoomId={highlightedRoomId}
              hasActiveReservations={checkActiveReservations}
              getDaysRemaining={getDaysRemainingForRoom}
              onView={handleView}
              onEdit={handleEdit}
              onViewReservations={handleViewReservations}
            />
          ) : (
            <TableView
              rooms={displayedRooms}
              highlightedRoomId={highlightedRoomId}
              hasActiveReservations={checkActiveReservations}
              getDaysRemaining={getDaysRemainingForRoom}
              getReservationsCount={getReservationsCountForRoom}
              getStatusColor={getStatusColor}
              getStatusName={getStatusName}
              formatNumber={formatNumber}
              onView={handleView}
              onEdit={handleEdit}
              onViewReservations={handleViewReservations}
            />
          )}

          {filteredRooms.length === 0 && !loading && (
            <EmptyState
              hasFilters={!!(searchTerm || filterFloor || filterType || filterStatus)}
              onCreateRoom={() => setOpenDialog(true)}
            />
          )}

          {filteredRooms.length > 0 && (
            <Pagination
              currentPage={page + 1}
              totalPages={Math.ceil(filteredRooms.length / rowsPerPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value)
                setPage(0)
              }}
              onPreviousPage={() => setPage((p) => Math.max(p - 1, 0))}
              onNextPage={() => setPage((p) => p + 1)}
              hasNextPage={(page + 1) * rowsPerPage < filteredRooms.length}
            />
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
    </Box>
  )
}
