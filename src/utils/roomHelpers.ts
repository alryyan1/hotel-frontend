import dayjs from 'dayjs'

export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '-'
  return num.toLocaleString('en-US')
}

export const getStatusColor = (status: any): string => status?.color || '#2196f3'

export const getStatusName = (status: any): string => status?.name || 'غير محدد'

export const hasActiveReservations = (roomId: number, reservations: any[]): boolean => {
  const activeStatuses = ['pending', 'confirmed', 'checked_in']
  return reservations.some(
    (reservation: any) =>
      activeStatuses.includes(reservation.status) && reservation.rooms?.some((room: any) => room.id === roomId)
  )
}

export const getDaysRemaining = (roomId: number, reservations: any[]): number | null => {
  const activeStatuses = ['pending', 'confirmed', 'checked_in']
  const roomReservations = reservations.filter(
    (reservation: any) =>
      activeStatuses.includes(reservation.status) && reservation.rooms?.some((room: any) => room.id === roomId)
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

export const getReservationsCount = (roomId: number, reservations: any[]): number => {
  return reservations.filter((reservation: any) => reservation.rooms?.some((room: any) => room.id === roomId)).length
}

export const filterRooms = (
  rooms: any[],
  searchTerm: string,
  filterFloor: string,
  filterType: string,
  filterStatus: string
): any[] => {
  return rooms.filter((room: any) => {
    const matchesSearch =
      (room.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.type?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFloor = !filterFloor || String(room.floor_id) === filterFloor
    const matchesType = !filterType || String(room.room_type_id) === filterType
    const matchesStatus = !filterStatus || String(room.room_status_id) === filterStatus
    return matchesSearch && matchesFloor && matchesType && matchesStatus
  })
}

