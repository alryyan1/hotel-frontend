import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TextField,
  InputAdornment,
  Typography,
  Divider,
} from '@mui/material'
import { Search as SearchIcon, Grid3x3 as Grid3x3Icon, List as ListIcon } from '@mui/icons-material'

interface FiltersDialogProps {
  open: boolean
  onClose: () => void
  searchTerm: string
  onSearchChange: (value: string) => void
  filterFloor: string
  onFilterFloorChange: (value: string) => void
  filterType: string
  onFilterTypeChange: (value: string) => void
  filterStatus: string
  onFilterStatusChange: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  floors: any[]
  roomTypes: any[]
  roomStatuses: any[]
  onClearFilters: () => void
}

export default function FiltersDialog({
  open,
  onClose,
  searchTerm,
  onSearchChange,
  filterFloor,
  onFilterFloorChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  viewMode,
  onViewModeChange,
  floors,
  roomTypes,
  roomStatuses,
  onClearFilters,
}: FiltersDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>الفلاتر والبحث</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ py: 2 }}>
          {/* Search Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon sx={{ fontSize: 18 }} />
              البحث
            </Typography>
            <TextField
              fullWidth
              placeholder="ابحث عن غرفة..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Divider />

          {/* Filters Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
              الفلاتر
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>الطابق</InputLabel>
                <Select value={filterFloor} onChange={(e) => onFilterFloorChange(e.target.value)} label="الطابق">
                  <MenuItem value="">جميع الأدوار</MenuItem>
                  {floors.map((floor: any) => (
                    <MenuItem key={floor.id} value={String(floor.id)}>
                      الطابق {floor.number}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>النوع</InputLabel>
                <Select value={filterType} onChange={(e) => onFilterTypeChange(e.target.value)} label="النوع">
                  <MenuItem value="">جميع الأنواع</MenuItem>
                  {roomTypes.map((type: any) => (
                    <MenuItem key={type.id} value={String(type.id)}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>الحالة</InputLabel>
                <Select value={filterStatus} onChange={(e) => onFilterStatusChange(e.target.value)} label="الحالة">
                  <MenuItem value="">جميع الحالات</MenuItem>
                  {roomStatuses.map((status: any) => (
                    <MenuItem key={status.id} value={String(status.id)}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <Divider />

          {/* View Mode Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
              طريقة العرض
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => onViewModeChange('grid')}
                startIcon={<Grid3x3Icon />}
                sx={{ flex: 1, height: 40 }}
              >
                عرض الشبكة
              </Button>
              <Button
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => onViewModeChange('list')}
                startIcon={<ListIcon />}
                sx={{ flex: 1, height: 40 }}
              >
                عرض الجدول
              </Button>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1, px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClearFilters} fullWidth={false} sx={{ width: { xs: '100%', sm: 'auto' }, height: 44 }}>
          مسح الفلاتر
        </Button>
        <Button variant="contained" onClick={onClose} fullWidth={false} sx={{ width: { xs: '100%', sm: 'auto' }, height: 44 }}>
          تطبيق
        </Button>
      </DialogActions>
    </Dialog>
  )
}

