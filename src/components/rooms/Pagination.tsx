import { Box, Button, FormControl, MenuItem, Select, Stack, Typography } from '@mui/material'

interface PaginationProps {
  currentPage: number
  totalPages: number
  rowsPerPage: number
  onRowsPerPageChange: (value: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
  hasNextPage: boolean
}

export default function Pagination({
  currentPage,
  totalPages,
  rowsPerPage,
  onRowsPerPageChange,
  onPreviousPage,
  onNextPage,
  hasNextPage,
}: PaginationProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        p: 2,
        bgcolor: 'grey.100',
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        الصفحة {currentPage} من {totalPages}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            عرض:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 64 }}>
            <Select value={String(rowsPerPage)} onChange={(e) => onRowsPerPageChange(parseInt(e.target.value))}>
              {[6, 9, 12, 24].map((n) => (
                <MenuItem key={n} value={String(n)}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Button variant="outlined" size="small" disabled={currentPage === 1} onClick={onPreviousPage} sx={{ height: 36, px: 1.5 }}>
            السابق
          </Button>
          <Button variant="outlined" size="small" disabled={!hasNextPage} onClick={onNextPage} sx={{ height: 36, px: 1.5 }}>
            التالي
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

