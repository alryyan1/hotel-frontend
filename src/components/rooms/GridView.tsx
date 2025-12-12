import { Box, Grid, Stack, Typography } from '@mui/material'
import RoomCard from './RoomCard'

interface GridViewProps {
  rooms: any[]
  highlightedRoomId: number | null
  hasActiveReservations: (roomId: number) => boolean
  getDaysRemaining: (roomId: number) => number | null
  onView: (room: any) => void
  onEdit: (room: any) => void
  onViewReservations: (room: any) => void
}

export default function GridView({
  rooms,
  highlightedRoomId,
  hasActiveReservations,
  getDaysRemaining,
  onView,
  onEdit,
  onViewReservations,
}: GridViewProps) {
  // Group rooms by floor
  const roomsByFloor = new Map<number | string, { floor: any; rooms: any[] }>()
  rooms.forEach((room: any) => {
    const floorId = room.floor_id || room.floor?.id || 'no-floor'
    if (!roomsByFloor.has(floorId)) {
      roomsByFloor.set(floorId, {
        floor: room.floor,
        rooms: [],
      })
    }
    roomsByFloor.get(floorId)!.rooms.push(room)
  })

  return (
    <Stack spacing={4}>
      {Array.from(roomsByFloor.entries()).map(([floorId, floorData]) => {
        const floor = floorData.floor
        const floorNumber = floor?.number ?? floorId
        const floorName = floor?.name ?? ''

        return (
          <Box key={floorId}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                الطابق {floorNumber}
              </Typography>
              {floorName && (
                <Typography variant="body2" color="text.secondary">
                  ({floorName})
                </Typography>
              )}
            </Box>
            <Grid container spacing={2}>
              {floorData.rooms.map((room: any) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={room.id}>
                  <RoomCard
                    room={room}
                    isHighlighted={highlightedRoomId === room.id}
                    hasActiveReservations={hasActiveReservations}
                    getDaysRemaining={getDaysRemaining}
                    onView={onView}
                    onEdit={onEdit}
                    onViewReservations={onViewReservations}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )
      })}
    </Stack>
  )
}

