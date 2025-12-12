import { Box, Button, Card, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { CalendarToday as CalendarIcon } from '@mui/icons-material'

interface TableViewProps {
  rooms: any[]
  highlightedRoomId: number | null
  hasActiveReservations: (roomId: number) => boolean
  getDaysRemaining: (roomId: number) => number | null
  getReservationsCount: (roomId: number) => number
  getStatusColor: (status: any) => string
  getStatusName: (status: any) => string
  formatNumber: (value: number | string | null | undefined) => string
  onView: (room: any) => void
  onEdit: (room: any) => void
  onViewReservations: (room: any) => void
}

export default function TableView({
  rooms,
  highlightedRoomId,
  hasActiveReservations,
  getDaysRemaining,
  getReservationsCount,
  getStatusColor,
  getStatusName,
  formatNumber,
  onView,
  onEdit,
  onViewReservations,
}: TableViewProps) {
  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">الغرفة</TableCell>
              <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                الطابق
              </TableCell>
              <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                النوع
              </TableCell>
              <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                السعر
              </TableCell>
              <TableCell align="center">الحالة</TableCell>
              <TableCell align="center">الحجوزات</TableCell>
              <TableCell align="center">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map((room: any) => {
              const daysRemaining = hasActiveReservations(room.id) ? getDaysRemaining(room.id) : null
              return (
                <TableRow
                  key={room.id}
                  sx={{
                    ...(highlightedRoomId === room.id && {
                      bgcolor: 'primary.50',
                      borderLeft: '3px solid',
                      borderColor: 'primary.main',
                    }),
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    <Stack spacing={0.5} alignItems="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        غرفة {room.number}
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: hasActiveReservations(room.id) ? 'error.main' : 'success.main',
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: { xs: 'block', sm: 'none' }, fontSize: '0.75rem' }}
                      >
                        الطابق {room.floor?.number} • {room.type?.name}
                      </Typography>
                      {daysRemaining !== null && (
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
                            width: 'fit-content',
                          }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    الطابق {room.floor?.number}
                  </TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {room.type?.name}
                  </TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' }, fontWeight: 600 }}>
                    {room.type?.base_price ? formatNumber(room.type.base_price) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusName(room.status)}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(room.status),
                        color: 'white',
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={getReservationsCount(room.id)} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="center">
                    <Stack spacing={0.5} alignItems="center">
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center">
                        <Button variant="text" size="small" onClick={() => onView(room)} sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}>
                          عرض
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => onEdit(room)} sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}>
                          تعديل
                        </Button>
                      </Stack>
                      {hasActiveReservations(room.id) && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => onViewReservations(room)}
                          startIcon={<CalendarIcon sx={{ fontSize: 12 }} />}
                          sx={{
                            minWidth: 'auto',
                            px: 1,
                            fontSize: '0.75rem',
                            color: 'primary.main',
                            borderColor: 'primary.main',
                            mt: 0.5,
                            '&:hover': {
                              bgcolor: 'primary.50',
                            },
                          }}
                        >
                          الحجوزات النشطة
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
    </Card>
  )
}

