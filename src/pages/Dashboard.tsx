import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BedDouble, 
  Users, 
  CalendarCheck2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Package,
  ShoppingCart,
  BarChart3
} from 'lucide-react'
import apiClient from '@/api/axios'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DashboardStats {
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  maintenanceRooms: number
  totalReservations: number
  activeReservations: number
  pendingReservations: number
  totalCustomers: number
  todayRevenue: number
  monthRevenue: number
  occupancyRate: number
  recentReservations: any[]
  roomStatusBreakdown: {
    available: number
    occupied: number
    maintenance: number
    cleaning: number
  }
  monthlyReservationsChart: Array<{
    day: number
    date: string
    reservations: number
  }>
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all necessary data in parallel
      const [roomsRes, reservationsRes, customersRes, paymentsRes] = await Promise.all([
        apiClient.get('/rooms').catch(() => ({ data: [] })),
        apiClient.get('/reservations').catch(() => ({ data: [] })),
        apiClient.get('/customers').catch(() => ({ data: [] })),
        apiClient.get('/payments').catch(() => ({ data: [] }))
      ])

      // Process rooms data
      const roomsData = roomsRes.data || []
      const allRooms = Array.isArray(roomsData) 
        ? (roomsData[0]?.rooms ? roomsData.flatMap((group: any) => group.rooms || []) : roomsData)
        : []
      
      // Process reservations data first to check room occupancy
      const reservationsData = reservationsRes.data?.data || reservationsRes.data || []
      const allReservations = Array.isArray(reservationsData) ? reservationsData : []
      
      // Create a set of room IDs that are occupied (have reservations with status !== 'checked_out')
      const occupiedRoomIds = new Set<number>()
      allReservations.forEach((reservation: any) => {
        // If reservation status is not 'checked_out', mark all its rooms as occupied
        if (reservation.status && reservation.status !== 'checked_out') {
          if (reservation.rooms && Array.isArray(reservation.rooms)) {
            reservation.rooms.forEach((room: any) => {
              const roomId = room.id || room.room_id
              if (roomId) {
                occupiedRoomIds.add(roomId)
              }
            })
          }
        }
      })
      
      const totalRooms = allRooms.length
      // Check if room is occupied by reservation OR by room status
      const occupiedRooms = allRooms.filter((r: any) => {
        const roomId = r.id
        const isOccupiedByReservation = occupiedRoomIds.has(roomId)
        const isOccupiedByStatus = r.status?.name?.toLowerCase().includes('مشغول') || 
          r.status?.name?.toLowerCase().includes('occupied')
        return isOccupiedByReservation || isOccupiedByStatus
      }).length
      const maintenanceRooms = allRooms.filter((r: any) => 
        r.status?.name?.toLowerCase().includes('صيانة') || 
        r.status?.name?.toLowerCase().includes('maintenance')
      ).length
      const availableRooms = totalRooms - occupiedRooms - maintenanceRooms

      // Process reservations data (already processed above, using allReservations)
      const totalReservations = allReservations.length
      const activeReservations = allReservations.filter((r: any) => 
        r.status === 'checked_in' || r.status === 'confirmed'
      ).length
      const pendingReservations = allReservations.filter((r: any) => 
        r.status === 'pending'
      ).length

      // Get recent reservations (last 5)
      const recentReservations = allReservations
        .sort((a: any, b: any) => 
          new Date(b.created_at || b.check_in_date).getTime() - 
          new Date(a.created_at || a.check_in_date).getTime()
        )
        .slice(0, 5)

      // Process customers data
      const customersData = customersRes.data?.data || customersRes.data || []
      const totalCustomers = Array.isArray(customersData) ? customersData.length : 0

      // Process payments data for revenue
      const paymentsData = paymentsRes.data?.data || paymentsRes.data || []
      const allPayments = Array.isArray(paymentsData) ? paymentsData : []
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayRevenue = allPayments
        .filter((p: any) => {
          const paymentDate = new Date(p.created_at || p.payment_date)
          paymentDate.setHours(0, 0, 0, 0)
          return paymentDate.getTime() === today.getTime()
        })
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthRevenue = allPayments
        .filter((p: any) => {
          const paymentDate = new Date(p.created_at || p.payment_date)
          return paymentDate >= monthStart
        })
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)

      // Calculate occupancy rate
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

      // Room status breakdown
      const roomStatusBreakdown = {
        available: availableRooms,
        occupied: occupiedRooms,
        maintenance: maintenanceRooms,
        cleaning: allRooms.filter((r: any) => 
          r.status?.name?.toLowerCase().includes('تنظيف') || 
          r.status?.name?.toLowerCase().includes('cleaning')
        ).length
      }

      // Calculate monthly reservations chart data
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      
      // Initialize chart data with all days of the month
      const chartData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        const date = new Date(currentYear, currentMonth, day)
        return {
          day,
          date: date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
          reservations: 0
        }
      })

      // Count reservations per day based on check_in_date
      allReservations.forEach((reservation: any) => {
        const checkInDate = new Date(reservation.check_in_date || reservation.created_at)
        if (
          checkInDate.getMonth() === currentMonth &&
          checkInDate.getFullYear() === currentYear
        ) {
          const day = checkInDate.getDate()
          const dayIndex = day - 1
          if (chartData[dayIndex]) {
            chartData[dayIndex].reservations += 1
          }
        }
      })

      setStats({
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        totalReservations,
        activeReservations,
        pendingReservations,
        totalCustomers,
        todayRevenue,
        monthRevenue,
        occupancyRate,
        recentReservations,
        roomStatusBreakdown,
        monthlyReservationsChart: chartData
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data', error)
      toast.error('فشل في تحميل بيانات لوحة التحكم')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SDG',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'info' }> = {
      pending: { label: 'في الانتظار', variant: 'outline' },
      confirmed: { label: 'مؤكد', variant: 'info' },
      checked_in: { label: 'تم تسجيل الوصول', variant: 'success' },
      checked_out: { label: 'تم تسجيل المغادرة', variant: 'secondary' },
      cancelled: { label: 'ملغي', variant: 'destructive' }
    }
    
    const config = statusMap[status] || { label: status, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    subtitle,
    className = '' 
  }: {
    title: string
    value: string | number
    icon: any
    trend?: 'up' | 'down'
    trendValue?: string
    subtitle?: string
    className?: string
  }) => (
    <Card className={`border-border/40 shadow-lg hover:shadow-xl transition-shadow ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-1">{value}</h3>
                {subtitle && (
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
              </>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-br ${
            className.includes('bg-blue') ? 'from-blue-500 to-blue-600' :
            className.includes('bg-green') ? 'from-green-500 to-green-600' :
            className.includes('bg-orange') ? 'from-orange-500 to-orange-600' :
            className.includes('bg-purple') ? 'from-purple-500 to-purple-600' :
            'from-primary to-primary/80'
          } text-white shadow-md`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && trendValue && !loading && (
          <div className={`flex items-center gap-1 mt-3 text-xs ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
     

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
        <StatCard
          title="الحجوزات النشطة"
          value={stats?.activeReservations || 0}
          icon={CalendarCheck2}
          subtitle={`إجمالي الحجوزات: ${stats?.totalReservations || 0}`}
          className="bg-green-50 dark:bg-green-950/20"
        />
        <StatCard
          title="معدل الإشغال"
          value={`${stats?.occupancyRate.toFixed(1) || 0}%`}
          icon={TrendingUp}
          subtitle={`${stats?.occupiedRooms || 0} غرفة مشغولة من ${stats?.totalRooms || 0}`}
          className="bg-orange-50 dark:bg-orange-950/20"
        />
        <StatCard
          title="إيرادات الشهر"
          value={formatCurrency(stats?.monthRevenue || 0)}
          icon={DollarSign}
          subtitle={`اليوم: ${formatCurrency(stats?.todayRevenue || 0)}`}
          className="bg-purple-50 dark:bg-purple-950/20"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/40 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي العملاء</p>
                {loading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <h3 className="text-xl font-bold">{stats?.totalCustomers || 0}</h3>
                )}
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">الغرف قيد الصيانة</p>
                {loading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <h3 className="text-xl font-bold">{stats?.maintenanceRooms || 0}</h3>
                )}
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Reservations Chart */}
      <Card className="border-border/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            عدد الحجوزات حسب اليوم - الشهر الحالي
          </CardTitle>
          <CardDescription>
            توزيع الحجوزات على أيام الشهر الحالي ({new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-80 w-full" />
          ) : stats?.monthlyReservationsChart ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={stats.monthlyReservationsChart}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  label={{ 
                    value: 'اليوم', 
                    position: 'insideBottom', 
                    offset: -10,
                    fill: 'hsl(var(--foreground))',
                    style: { textAnchor: 'middle' }
                  }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  label={{ 
                    value: 'عدد الحجوزات', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: 'hsl(var(--foreground))',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [value, 'عدد الحجوزات']}
                  labelFormatter={(label) => `اليوم ${label}`}
                />
                <Bar
                  dataKey="reservations"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                  name="عدد الحجوزات"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">لا توجد بيانات للعرض</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Status Overview in a single row */}
      <Card className="border-border/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            حالة الغرف
          </CardTitle>
          <CardDescription>نظرة عامة سريعة على حالة جميع الغرف</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500 text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">متاحة</p>
                    <p className="text-sm text-muted-foreground">جاهزة للاستخدام</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{stats?.roomStatusBreakdown.available || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalRooms ? Math.round((stats.roomStatusBreakdown.available / stats.totalRooms) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500 text-white">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">مشغولة</p>
                    <p className="text-sm text-muted-foreground">ضيوف حالياً</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{stats?.roomStatusBreakdown.occupied || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalRooms ? Math.round((stats.roomStatusBreakdown.occupied / stats.totalRooms) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500 text-white">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">قيد الصيانة</p>
                    <p className="text-sm text-muted-foreground">غير متاحة</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{stats?.roomStatusBreakdown.maintenance || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalRooms ? Math.round((stats.roomStatusBreakdown.maintenance / stats.totalRooms) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500 text-white">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">قيد التنظيف</p>
                    <p className="text-sm text-muted-foreground">تحت التنظيف</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">{stats?.roomStatusBreakdown.cleaning || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalRooms ? Math.round((stats.roomStatusBreakdown.cleaning / stats.totalRooms) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-border/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            إجراءات سريعة
          </CardTitle>
          <CardDescription>الوصول السريع إلى الوظائف الأساسية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/reservations')}
              className="p-4 rounded-lg border border-border/40 hover:bg-accent hover:border-primary transition-all text-center group"
            >
              <CalendarCheck2 className="h-6 w-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
              <p className="font-medium text-sm">إنشاء حجز</p>
            </button>
            <button
              onClick={() => navigate('/rooms')}
              className="p-4 rounded-lg border border-border/40 hover:bg-accent hover:border-primary transition-all text-center group"
            >
              <BedDouble className="h-6 w-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
              <p className="font-medium text-sm">إدارة الغرف</p>
            </button>
            <button
              onClick={() => navigate('/customers')}
              className="p-4 rounded-lg border border-border/40 hover:bg-accent hover:border-primary transition-all text-center group"
            >
              <Users className="h-6 w-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
              <p className="font-medium text-sm">العملاء</p>
            </button>
            <button
              onClick={() => navigate('/inventory')}
              className="p-4 rounded-lg border border-border/40 hover:bg-accent hover:border-primary transition-all text-center group"
            >
              <Package className="h-6 w-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
              <p className="font-medium text-sm">المخزون</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
