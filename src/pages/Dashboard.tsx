import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم"
        description="نظرة عامة على إشغالات الغرف والحجوزات"
        icon="📊"
      />
      <Card className="border-border/40 shadow-lg">
        <CardContent className="pt-6">
          <p className="text-lg">مرحباً بك في لوحة إدارة الفندق.</p>
        </CardContent>
      </Card>
    </div>
  )
}



