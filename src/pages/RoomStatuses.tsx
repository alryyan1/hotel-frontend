import { useState, useEffect } from 'react'
import apiClient from '../api/axios'
import { Table, Tag, Button, Modal, Form, Input, Select, Space, Typography, Card } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons'
import { toast } from 'sonner'

const { Title, Text } = Typography

const colorOptions = [
  { value: '#f44336', label: 'أحمر' },
  { value: '#e91e63', label: 'وردي' },
  { value: '#9c27b0', label: 'بنفسجي' },
  { value: '#3f51b5', label: 'نيلي' },
  { value: '#2196f3', label: 'أزرق' },
  { value: '#03a9f4', label: 'أزرق فاتح' },
  { value: '#00bcd4', label: 'سماوي' },
  { value: '#009688', label: 'تركواز' },
  { value: '#4caf50', label: 'أخضر' },
  { value: '#8bc34a', label: 'أخضر فاتح' },
  { value: '#ffeb3b', label: 'أصفر' },
  { value: '#ffc107', label: 'كهرماني' },
  { value: '#ff9800', label: 'برتقالي' },
  { value: '#ff5722', label: 'برتقالي داكن' },
  { value: '#795548', label: 'بني' },
  { value: '#607d8b', label: 'رمادي مزرق' },
]

export default function RoomStatuses() {
  const [roomStatuses, setRoomStatuses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRoomStatus, setEditingRoomStatus] = useState<any>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchRoomStatuses()
  }, [])

  const fetchRoomStatuses = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/room-statuses')
      setRoomStatuses(data)
    } catch (err) {
      toast.error('فشل في تحميل حالات الغرف')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    try {
      setSaving(true)
      if (editingRoomStatus) {
        await apiClient.put(`/room-statuses/${editingRoomStatus.id}`, values)
        toast.success('تم تحديث حالة الغرفة بنجاح')
      } else {
        await apiClient.post('/room-statuses', values)
        toast.success('تم إنشاء حالة الغرفة بنجاح')
      }
      setOpenDialog(false)
      setEditingRoomStatus(null)
      fetchRoomStatuses()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (roomStatus: any) => {
    setEditingRoomStatus(roomStatus)
    form.setFieldsValue({
      code: roomStatus.code,
      name: roomStatus.name,
      color: roomStatus.color || '#2196f3',
    })
    setOpenDialog(true)
  }

  const handleOpenCreate = () => {
    setEditingRoomStatus(null)
    form.resetFields()
    form.setFieldsValue({ color: '#2196f3' })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingRoomStatus(null)
    form.resetFields()
  }

  const columns: ColumnsType<any> = [
    {
      title: 'الرمز',
      key: 'code',
      render: (_, s) => (
        <Tag color={s.color || '#2196f3'} variant="solid" style={{ fontWeight: 700 }}>
          {s.code}
        </Tag>
      ),
    },
    {
      title: 'الاسم',
      key: 'name',
      render: (_, s) => <Text strong>{s.name}</Text>,
    },
    {
      title: 'اللون',
      key: 'color',
      render: (_, s) => (
        <Space size={8}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              border: '2px solid var(--ant-color-border, #d9d9d9)',
              background: s.color || '#2196f3',
            }}
          />
          <Text type="secondary">
            {colorOptions.find((c) => c.value === s.color)?.label || 'مخصص'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'عدد الغرف',
      key: 'rooms_count',
      align: 'center',
      render: (_, s) => <Tag>{s.rooms_count || 0}</Tag>,
    },
    {
      title: 'إجراءات',
      key: 'actions',
      align: 'center',
      render: (_, s) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(s)}>
          تعديل
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      <Space align="center" size={10}>
        <CheckCircleOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Title level={4} style={{ margin: 0 }}>إدارة حالات الغرف</Title>
      </Space>

      <Card
        title={
          <Text type="secondary">
            الإجمالي: <Text strong>{roomStatuses.length}</Text> حالة
          </Text>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            إضافة حالة غرفة
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={roomStatuses}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        open={openDialog}
        onCancel={handleCloseDialog}
        title={editingRoomStatus ? 'تعديل حالة غرفة' : 'إضافة حالة غرفة جديدة'}
        footer={[
          <Button key="cancel" onClick={handleCloseDialog}>إلغاء</Button>,
          <Button key="submit" type="primary" loading={saving} onClick={handleSubmit}>
            {editingRoomStatus ? 'تحديث' : 'إنشاء'}
          </Button>,
        ]}
      >
        <Text type="secondary">
          {editingRoomStatus ? 'تحديث بيانات حالة الغرفة' : 'إنشاء حالة غرفة جديدة'}
        </Text>
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="الرمز"
            name="code"
            rules={[{ required: true, message: 'الرمز مطلوب' }]}
            normalize={(value) => (typeof value === 'string' ? value.toUpperCase() : value)}
          >
            <Input placeholder="CLEANING, MAINTENANCE" />
          </Form.Item>
          <Form.Item label="الاسم" name="name" rules={[{ required: true, message: 'الاسم مطلوب' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="اللون" name="color">
            <Select
              options={colorOptions.map((c) => ({
                value: c.value,
                label: (
                  <Space size={8}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: c.value }} />
                    {c.label}
                  </Space>
                ),
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
