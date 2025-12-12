import { Button, Card, Typography } from '@mui/material'

interface EmptyStateProps {
  hasFilters: boolean
  onCreateRoom: () => void
}

export default function EmptyState({ hasFilters, onCreateRoom }: EmptyStateProps) {
  return (
    <Card sx={{ p: 6, textAlign: 'center', boxShadow: 3 }}>
      <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2, opacity: 0.5 }}>
        🏨
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
        لا توجد غرف متاحة
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: '28rem', mx: 'auto' }}>
        {hasFilters
          ? 'لم يتم العثور على غرف تطابق معايير البحث. جرب تعديل المرشحات.'
          : 'ابدأ بإضافة غرف جديدة للفندق لتظهر هنا.'}
      </Typography>
      {!hasFilters && (
        <Button variant="contained" onClick={onCreateRoom} size="large" sx={{ boxShadow: 2 }}>
          إضافة غرفة جديدة
        </Button>
      )}
    </Card>
  )
}

