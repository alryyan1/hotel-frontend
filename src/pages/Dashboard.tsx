import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Typography, Progress, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  HomeOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  RiseOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import apiClient from '@/api/axios'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const { Title, Text } = Typography

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

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'في الانتظار', color: 'gold' },
  confirmed: { label: 'مؤكد', color: 'blue' },
  checked_in: { label: 'تم تسجيل الوصول', color: 'green' },
  checked_out: { label: 'تم تسجيل المغادرة', color: 'default' },
  cancelled: { label: 'ملغي', color: 'red' },
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

      const [roomsRes, reservationsRes, customersRes, paymentsRes] = await Promise.all([
        apiClient.get('/rooms').catch(() => ({ data: [] })),
        apiClient.get('/reservations').catch(() => ({ data: [] })),
        apiClient.get('/customers').catch(() => ({ data: [] })),
        apiClient.get('/payments').catch(() => ({ data: [] })),
      ])

      const roomsData = roomsRes.data || []
      const allRooms = Array.isArray(roomsData)
        ? (roomsData[0]?.rooms ? roomsData.flatMap((group: any) => group.rooms || []) : roomsData)
        : []

      const reservationsData = reservationsRes.data?.data || reservationsRes.data || []
      const allReservations = Array.isArray(reservationsData) ? reservationsData : []

      const occupiedRoomIds = new Set<number>()
      allReservations.forEach((reservation: any) => {
        if (reservation.status === 'checked_in' && Array.isArray(reservation.rooms)) {
          reservation.rooms.forEach((room: any) => {
            const roomId = room.id || room.room_id
            if (roomId) occupiedRoomIds.add(roomId)
          })
        }
      })

      const totalRooms = allRooms.length
      const occupiedRooms = allRooms.filter((r: any) => {
        const isOccupiedByReservation = occupiedRoomIds.has(r.id)
        // Status names are free text set from the room-statuses admin page, so this
        // app actually uses "محجوزة" (booked) rather than "مشغول" (busy) for occupied.
        const isOccupiedByStatus = r.status?.name?.toLowerCase().includes('محجوز') ||
          r.status?.name?.toLowerCase().includes('مشغول') ||
          r.status?.name?.toLowerCase().includes('occupied')
        return isOccupiedByReservation || isOccupiedByStatus
      }).length
      const maintenanceRooms = allRooms.filter((r: any) =>
        r.status?.name?.toLowerCase().includes('صيانة') ||
        r.status?.name?.toLowerCase().includes('maintenance')
      ).length
      const availableRooms = totalRooms - occupiedRooms - maintenanceRooms

      const totalReservations = allReservations.length
      const activeReservations = allReservations.filter((r: any) =>
        r.status === 'checked_in' || r.status === 'confirmed'
      ).length
      const pendingReservations = allReservations.filter((r: any) => r.status === 'pending').length

      const recentReservations = allReservations
        .sort((a: any, b: any) =>
          new Date(b.created_at || b.check_in_date).getTime() -
          new Date(a.created_at || a.check_in_date).getTime()
        )
        .slice(0, 5)

      const customersData = customersRes.data?.data || customersRes.data || []
      const totalCustomers = Array.isArray(customersData) ? customersData.length : 0

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
        .filter((p: any) => new Date(p.created_at || p.payment_date) >= monthStart)
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)

      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

      const roomStatusBreakdown = {
        available: availableRooms,
        occupied: occupiedRooms,
        maintenance: maintenanceRooms,
        // "نظافة" (cleanliness) is the status name actually used here, not "تنظيف" (cleaning process).
        cleaning: allRooms.filter((r: any) =>
          r.status?.name?.toLowerCase().includes('نظاف') ||
          r.status?.name?.toLowerCase().includes('تنظيف') ||
          r.status?.name?.toLowerCase().includes('cleaning')
        ).length,
      }

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

      const chartData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        const date = new Date(currentYear, currentMonth, day)
        return {
          day,
          date: date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
          reservations: 0,
        }
      })

      allReservations.forEach((reservation: any) => {
        const checkInDate = new Date(reservation.check_in_date || reservation.created_at)
        if (checkInDate.getMonth() === currentMonth && checkInDate.getFullYear() === currentYear) {
          const dayIndex = checkInDate.getDate() - 1
          if (chartData[dayIndex]) chartData[dayIndex].reservations += 1
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
        monthlyReservationsChart: chartData,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data', error)
      toast.error('فشل في تحميل بيانات لوحة التحكم')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount) + ' ج.س'

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })

  const roomStatusItems = [
    {
      key: 'available',
      label: 'متاحة',
      desc: 'جاهزة للاستخدام',
      value: stats?.roomStatusBreakdown.available || 0,
      color: '#52c41a',
      icon: <CheckCircleOutlined />,
    },
    {
      key: 'occupied',
      label: 'مشغولة',
      desc: 'ضيوف حالياً',
      value: stats?.roomStatusBreakdown.occupied || 0,
      color: '#1677ff',
      icon: <UserOutlined />,
    },
    {
      key: 'maintenance',
      label: 'قيد الصيانة',
      desc: 'غير متاحة',
      value: stats?.roomStatusBreakdown.maintenance || 0,
      color: '#fa8c16',
      icon: <ToolOutlined />,
    },
    {
      key: 'cleaning',
      label: 'قيد التنظيف',
      desc: 'تحت التنظيف',
      value: stats?.roomStatusBreakdown.cleaning || 0,
      color: '#722ed1',
      icon: <ThunderboltOutlined />,
    },
  ]

  const recentColumns: ColumnsType<any> = [
    {
      title: 'رقم الحجز',
      key: 'id',
      render: (_, r) => <Text strong>#{r.id}</Text>,
    },
    {
      title: 'العميل',
      key: 'customer',
      render: (_, r) => r.customer?.name || '-',
    },
    {
      title: 'تاريخ الوصول',
      key: 'check_in',
      render: (_, r) => formatDate(r.check_in_date),
    },
    {
      title: 'تاريخ المغادرة',
      key: 'check_out',
      render: (_, r) => formatDate(r.check_out_date),
    },
    {
      title: 'الحالة',
      key: 'status',
      align: 'center',
      render: (_, r) => {
        const config = statusConfig[r.status] || { label: r.status, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
  ]

  const quickActions = [
    { label: 'إنشاء حجز', icon: <CalendarOutlined />, to: '/reservations' },
    { label: 'إدارة الغرف', icon: <HomeOutlined />, to: '/rooms' },
    { label: 'العملاء', icon: <TeamOutlined />, to: '/customers' },
    { label: 'المخزون', icon: <ShoppingOutlined />, to: '/inventory' },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      <Space align="center" size={10}>
        <BarChartOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Title level={4} style={{ margin: 0 }}>لوحة التحكم</Title>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" loading={loading}>
            <Statistic
              title="الحجوزات النشطة"
              value={stats?.activeReservations || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              إجمالي الحجوزات: {stats?.totalReservations || 0}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" loading={loading}>
            <Statistic
              title="معدل الإشغال"
              value={stats?.occupancyRate || 0}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {stats?.occupiedRooms || 0} من {stats?.totalRooms || 0} غرفة
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" loading={loading}>
            <Statistic
              title="إيرادات الشهر"
              value={stats?.monthRevenue || 0}
              formatter={(v) => formatCurrency(Number(v))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              اليوم: {formatCurrency(stats?.todayRevenue || 0)}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" loading={loading}>
            <Statistic
              title="إجمالي العملاء"
              value={stats?.totalCustomers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              حجوزات معلقة: {stats?.pendingReservations || 0}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <BarChartOutlined />
                عدد الحجوزات حسب اليوم — {new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
              </Space>
            }
            loading={loading}
          >
            {stats?.monthlyReservationsChart?.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.monthlyReservationsChart} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, 'عدد الحجوزات']}
                    labelFormatter={(label) => `اليوم ${label}`}
                  />
                  <Bar dataKey="reservations" fill="#1677ff" radius={[6, 6, 0, 0]} name="عدد الحجوزات" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="لا توجد بيانات للعرض" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<Space><HomeOutlined />حالة الغرف</Space>} loading={loading}>
            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
              {roomStatusItems.map((item) => {
                const percent = stats?.totalRooms ? Math.round((item.value / stats.totalRooms) * 100) : 0
                return (
                  <div key={item.key}>
                    <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 4 }} align="center">
                      <Space size={6}>
                        <span style={{ color: item.color }}>{item.icon}</span>
                        <Text strong>{item.label}</Text>
                      </Space>
                      <Text strong>{item.value}</Text>
                    </Space>
                    <Progress percent={percent} strokeColor={item.color} showInfo={false} size="small" />
                  </div>
                )
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title={<Space><ClockCircleOutlined />أحدث الحجوزات</Space>} loading={loading}>
            <Table
              rowKey="id"
              columns={recentColumns}
              dataSource={stats?.recentReservations || []}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<Space><ThunderboltOutlined />إجراءات سريعة</Space>}>
            <Row gutter={[12, 12]}>
              {quickActions.map((action) => (
                <Col xs={12} key={action.to}>
                  <Button
                    block
                    style={{ height: 72, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => navigate(action.to)}
                  >
                    <span style={{ fontSize: 18, color: '#1677ff' }}>{action.icon}</span>
                    <span style={{ fontSize: 12 }}>{action.label}</span>
                  </Button>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
