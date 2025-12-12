import { Box, Button, Card, CardContent, CardHeader, Chip, Stack, Typography } from '@mui/material'
import { CalendarToday as CalendarIcon } from '@mui/icons-material'

interface RoomCardProps {
  room: any
  isHighlighted?: boolean
  hasActiveReservations: (roomId: number) => boolean
  getDaysRemaining: (roomId: number) => number | null
  onView: (room: any) => void
  onEdit: (room: any) => void
  onViewReservations: (room: any) => void
}

export default function RoomCard({
  room,
  isHighlighted,
  hasActiveReservations,
  getDaysRemaining,
  onView,
  onEdit,
  onViewReservations,
}: RoomCardProps) {
  const isAvailable = !hasActiveReservations(room.id)
  const daysRemaining = hasActiveReservations(room.id) ? getDaysRemaining(room.id) : null

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 6,
        },
        ...(isHighlighted && {
          border: '2px solid',
          borderColor: 'primary.main',
          boxShadow: 4,
        }),
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          bgcolor: isAvailable ? 'success.main' : 'error.main',
        }}
      />
      <CardHeader
        sx={{ pb: 2 }}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
                color: 'primary.main',
                fontWeight: 'bold',
                fontSize: '1.125rem',
                boxShadow: 1,
              }}
            >
              {room.number}
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  bgcolor: hasActiveReservations(room.id) ? 'error.main' : 'success.main',
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.125rem' }}>
                غرفة {room.number}
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: hasActiveReservations(room.id) ? 'error.main' : 'success.main',
                  }}
                />
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                الطابق {room.floor?.number} {room.floor?.name ? `• ${room.floor.name}` : ''}
              </Typography>
              {room.type && (
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={room.type.name} size="small" variant="outlined" />
                </Box>
              )}
              {daysRemaining !== null && (
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    icon={<CalendarIcon sx={{ fontSize: 12 }} />}
                    label={`متاح خلال ${daysRemaining === 0 ? 'اليوم' : daysRemaining === 1 ? 'يوم واحد' : `${daysRemaining} أيام`}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      bgcolor: 'orange.50',
                      color: 'orange.700',
                      borderColor: 'orange.200',
                      fontSize: '0.75rem',
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        }
      />
      <CardContent sx={{ pt: 0, pb: 2 }}>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button variant="text" size="small" onClick={() => onView(room)}>
              عرض
            </Button>
            <Button variant="outlined" size="small" onClick={() => onEdit(room)}>
              تعديل
            </Button>
          </Box>
          {hasActiveReservations(room.id) && (
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => onViewReservations(room)}
              startIcon={<CalendarIcon />}
              sx={{
                color: 'primary.main',
                borderColor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.50',
                },
              }}
            >
              عرض الحجوزات النشطة
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

