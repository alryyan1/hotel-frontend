import { useState, useEffect, useRef, useMemo } from 'react'
import apiClient from '../api/axios'
import { Table, Input, Select, Button, Tag, Space, Typography, Badge, Card, Row, Col, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, SearchOutlined, CalendarOutlined, HomeOutlined } from '@ant-design/icons'
import { toast } from 'sonner'
import CreateRoomDialog from '@/components/dialogs/CreateRoomDialog'
import {
  formatNumber,
  getStatusColor,
  getStatusName,
  hasActiveReservations,
  getDaysRemaining,
  filterRooms as filterRoomsUtil,
} from '@/utils/roomHelpers'

const { Text, Title } = Typography

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([])
  const [floors, setFloors] = useState<any[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [roomStatuses, setRoomStatuses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFloor, setFilterFloor] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dataLoaded, setDataLoaded] = useState(false)
  const [reservations, setReservations] = useState<any[]>([])
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (hasFetchedRef.current || dataLoaded) return
    hasFetchedRef.current = true
    fetchData()
  }, [])

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true)
      setDataLoaded(false)
      const [roomsRes, floorsRes, roomTypesRes, roomStatusesRes, reservationsRes] = await Promise.all([
        apiClient.get('/rooms'),
        apiClient.get('/floors'),
        apiClient.get('/room-types'),
        apiClient.get('/room-statuses'),
        apiClient.get('/reservations', { params: { per_page: 'all' } }).catch(() => ({ data: [] })),
      ])
      const groupedRooms = roomsRes.data || []
      const allRooms = groupedRooms.flatMap((group: any) => group.rooms || [])
      setRooms(allRooms)
      setFloors(floorsRes.data)
      setRoomTypes(roomTypesRes.data)
      setRoomStatuses(roomStatusesRes.data)
      const reservationsData = reservationsRes.data?.data || reservationsRes.data || []
      setReservations(Array.isArray(reservationsData) ? reservationsData : [])
      setDataLoaded(true)
    } catch (err) {
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const filteredRooms = useMemo(
    () => filterRoomsUtil(rooms, searchTerm, filterFloor, filterType, filterStatus),
    [rooms, searchTerm, filterFloor, filterType, filterStatus]
  )

  const statusCounts = useMemo(
    () => roomStatuses.map((status: any) => ({
      status,
      count: rooms.filter((r: any) => (r.status?.id ?? r.room_status_id) === status.id).length,
    })),
    [rooms, roomStatuses]
  )

  const clearFilters = () => {
    setSearchTerm('')
    setFilterFloor('')
    setFilterType('')
    setFilterStatus('')
  }

  const handleDialogSuccess = async () => {
    toast.success(editingRoom ? 'تم تحديث الغرفة بنجاح' : 'تم إنشاء الغرفة بنجاح')
    setEditingRoom(null)
    await fetchData()
  }

  const handleDialogError = (message: string) => {
    toast.error(message)
  }

  const handleEdit = (room: any) => {
    setEditingRoom(room)
    setOpenDialog(true)
  }

  const checkActiveReservations = (roomId: number) => hasActiveReservations(roomId, reservations)
  const getDaysRemainingForRoom = (roomId: number) => getDaysRemaining(roomId, reservations)

  const columns: ColumnsType<any> = [
    {
      title: 'الغرفة',
      key: 'number',
      align: 'center',
      render: (_, room) => {
        const occupied = checkActiveReservations(room.id)
        const daysRemaining = occupied ? getDaysRemainingForRoom(room.id) : null
        return (
          <Space orientation="vertical" size={2} align="center">
            <Space size={6}>
              <Text strong>غرفة {room.number}</Text>
              <Badge status={occupied ? 'error' : 'success'} />
            </Space>
            {daysRemaining !== null && (
              <Tag icon={<CalendarOutlined />} color="orange" style={{ margin: 0, fontSize: 11 }}>
                متاح خلال {daysRemaining === 0 ? 'اليوم' : daysRemaining === 1 ? 'يوم واحد' : `${daysRemaining} أيام`}
              </Tag>
            )}
          </Space>
        )
      },
    },
    {
      title: 'الطابق',
      key: 'floor',
      align: 'center',
      responsive: ['sm'],
      render: (_, room) => room.floor?.number,
    },
    {
      title: 'النوع',
      key: 'type',
      align: 'center',
      responsive: ['md'],
      render: (_, room) => room.type?.name,
    },
    {
      title: 'السعر',
      key: 'price',
      align: 'center',
      responsive: ['lg'],
      render: (_, room) => (
        <Space orientation="vertical" size={0}>
          <Text strong style={{ color: '#389e0d' }}>{formatNumber(room.price_sdg)} ج.س</Text>
         
        </Space>
      ),
    },
    {
      title: 'الحالة',
      key: 'status',
      align: 'center',
      render: (_, room) => (
        <Tag color={getStatusColor(room.status)} variant="solid">
          {getStatusName(room.status)}
        </Tag>
      ),
    },
    {
      title: 'السعر بالدولار',
      key: 'price_usd',
      align: 'center',
      render: (_, room) => (
        <Text style={{ color: '#95de64' }}>
          {room.price_usd != null ? `$${formatNumber(room.price_usd)}` : '-'}
        </Text>
      ),
    },
    {
      title: 'إجراءات',
      key: 'actions',
      align: 'center',
      render: (_, room) => (
        <Button size="small" onClick={() => handleEdit(room)}>تعديل</Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-2 p-2">
      <Space align="center" size={8}>
        <HomeOutlined style={{ fontSize: 16, color: '#1677ff' }} />
        <Title level={5} style={{ margin: 0 }}>إدارة الغرف</Title>
      </Space>

      <Row gutter={[8, 8]}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" styles={{ body: { padding: 8 } }}>
            <Statistic
              title={<Text style={{ fontSize: 12 }}>إجمالي الغرف</Text>}
              value={rooms.length}
              prefix={<HomeOutlined />}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        {statusCounts.map(({ status, count }) => (
          <Col key={status.id} xs={12} sm={8} md={4}>
            <Card size="small" styles={{ body: { padding: 8 } }}>
              <Statistic
                title={<Text style={{ fontSize: 12 }}>{status.name}</Text>}
                value={count}
                valueStyle={{ color: getStatusColor(status), fontSize: 18 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        size="small"
        title={
          <Text type="secondary" style={{ fontSize: 12 }}>
            عرض <Text strong>{filteredRooms.length}</Text> من أصل <Text strong>{rooms.length}</Text> غرفة
          </Text>
        }
        extra={
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setOpenDialog(true)}>
            إضافة غرفة جديدة
          </Button>
        }
      >
        <Space wrap size={8} style={{ width: '100%', marginBottom: 8 }}>
          <Input
            size="small"
            placeholder="بحث برقم الغرفة أو النوع..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            size="small"
            placeholder="الطابق"
            value={filterFloor || undefined}
            onChange={(v) => setFilterFloor(v ?? '')}
            style={{ width: 130 }}
            allowClear
            options={floors.map((f: any) => ({ value: String(f.id), label: `الدور ${f.number}` }))}
          />
          <Select
            size="small"
            placeholder="نوع الغرفة"
            value={filterType || undefined}
            onChange={(v) => setFilterType(v ?? '')}
            style={{ width: 130 }}
            allowClear
            options={roomTypes.map((t: any) => ({ value: String(t.id), label: t.name }))}
          />
          <Select
            size="small"
            placeholder="الحالة"
            value={filterStatus || undefined}
            onChange={(v) => setFilterStatus(v ?? '')}
            style={{ width: 130 }}
            allowClear
            options={roomStatuses.map((s: any) => ({ value: String(s.id), label: s.name }))}
          />
          {(searchTerm || filterFloor || filterType || filterStatus) && (
            <Button size="small" onClick={clearFilters}>مسح الفلاتر</Button>
          )}
        </Space>

        <Table
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={filteredRooms}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, size: 'small' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <CreateRoomDialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open)
          if (!open) setEditingRoom(null)
        }}
        editingRoom={editingRoom}
        floors={floors}
        roomTypes={roomTypes}
        roomStatuses={roomStatuses}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />
    </div>
  )
}
