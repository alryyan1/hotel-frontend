import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Table, Button, Modal, Form, Input, Space, Typography, Card, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, BankOutlined, EditOutlined } from '@ant-design/icons'
import { toast } from 'sonner'

const { Title, Text } = Typography

export default function Floors() {
  const [floors, setFloors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingFloor, setEditingFloor] = useState<any>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchFloors()
  }, [])

  const fetchFloors = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/floors')
      setFloors(data)
    } catch (err) {
      toast.error('فشل في تحميل الأدوار')
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
      if (editingFloor) {
        await apiClient.put(`/floors/${editingFloor.id}`, values)
        toast.success('تم تحديث الدور بنجاح')
      } else {
        await apiClient.post('/floors', values)
        toast.success('تم إنشاء الدور بنجاح')
      }
      setOpenDialog(false)
      setEditingFloor(null)
      fetchFloors()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (floor: any) => {
    setEditingFloor(floor)
    form.setFieldsValue({
      number: floor.number,
      name: floor.name || '',
      description: floor.description || '',
    })
    setOpenDialog(true)
  }

  const handleOpenCreate = () => {
    setEditingFloor(null)
    form.resetFields()
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingFloor(null)
    form.resetFields()
  }

  const columns: ColumnsType<any> = [
    {
      title: 'رقم الطابق',
      key: 'number',
      align: 'center',
      render: (_, f) => <Tag color="blue">{f.number}</Tag>,
    },
    {
      title: 'الاسم',
      key: 'name',
      align: 'center',
      render: (_, f) => f.name || '-',
    },
    {
      title: 'الوصف',
      key: 'description',
      align: 'center',
      render: (_, f) => <Text type="secondary">{f.description || '-'}</Text>,
    },
    {
      title: 'عدد الغرف',
      key: 'rooms_count',
      align: 'center',
      render: (_, f) => <Tag>{f.rooms_count || 0} غرفة</Tag>,
    },
    {
      title: 'إجراءات',
      key: 'actions',
      align: 'center',
      render: (_, f) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(f)}>
          تعديل
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      <Space align="center" size={10}>
        <BankOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Title level={4} style={{ margin: 0 }}>إدارة الأدوار</Title>
      </Space>

      <Card
        title={
          <Text type="secondary">
            الإجمالي: <Text strong>{floors.length}</Text> دور
          </Text>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            إضافة دور
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={floors}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        open={openDialog}
        onCancel={handleCloseDialog}
        title={editingFloor ? 'تعديل دور' : 'إضافة دور جديد'}
        footer={[
          <Button key="cancel" onClick={handleCloseDialog}>إلغاء</Button>,
          <Button key="submit" type="primary" loading={saving} onClick={handleSubmit}>
            {editingFloor ? 'تحديث' : 'إنشاء'}
          </Button>,
        ]}
      >
        <Text type="secondary">
          {editingFloor ? 'تحديث بيانات الطابق' : 'إنشاء دور جديد'}
        </Text>
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="رقم الطابق"
            name="number"
            rules={[{ required: true, message: 'رقم الطابق مطلوب' }]}
          >
            <Input placeholder="مثل: 1, 2, 1-1" />
          </Form.Item>
          <Form.Item label="اسم الطابق" name="name">
            <Input placeholder="مثل: الطابق الأرضي، الطابق الأول" />
          </Form.Item>
          <Form.Item label="الوصف" name="description">
            <Input placeholder="وصف مختصر للدور" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
