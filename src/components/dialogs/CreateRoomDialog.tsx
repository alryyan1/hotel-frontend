import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/api/axios'
import { Modal, Form, Input, InputNumber, Select, Button, Divider, Typography, Row, Col } from 'antd'

const { Text } = Typography

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRoom: any | null
  floors: any[]
  roomTypes: any[]
  roomStatuses: any[]
  onSuccess: (roomId?: number) => void
  onError: (message: string) => void
}

export default function CreateRoomDialog({
  open,
  onOpenChange,
  editingRoom,
  floors,
  roomTypes,
  roomStatuses,
  onSuccess,
  onError,
}: CreateRoomDialogProps) {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editingRoom) {
      form.setFieldsValue({
        number: editingRoom.number,
        floor_id: String(editingRoom.floor_id),
        room_type_id: String(editingRoom.room_type_id),
        price_usd: editingRoom.price_usd,
        price_sdg: editingRoom.price_sdg,
        room_status_id: String(editingRoom.room_status_id),
        beds: editingRoom.beds,
      })
    } else {
      form.resetFields()
    }
  }, [editingRoom, open, form])

  const handleSubmit = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    try {
      setLoading(true)
      let roomId: number | undefined
      if (editingRoom) {
        await apiClient.put(`/rooms/${editingRoom.id}`, values)
        roomId = editingRoom.id
      } else {
        const response = await apiClient.post('/rooms', values)
        roomId = response.data.id
      }
      onOpenChange(false)
      onSuccess(roomId)
    } catch (err: any) {
      onError(err?.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    form.resetFields()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={editingRoom ? 'تعديل غرفة' : 'إضافة غرفة جديدة'}
      width={640}
      footer={[
        <Button key="cancel" onClick={handleClose}>إلغاء</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {editingRoom ? 'تحديث' : 'إنشاء'}
        </Button>,
      ]}
    >
      <Text type="secondary">
        {editingRoom ? 'تحديث بيانات الغرفة' : 'إنشاء غرفة جديدة في الفندق'}
      </Text>

      <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
        <Divider orientation="right" plain style={{ margin: '0 0 16px' }}>المعلومات الأساسية</Divider>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="رقم الغرفة" name="number" rules={[{ required: true, message: 'رقم الغرفة مطلوب' }]}>
              <Input placeholder="مثل: 101, 201" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="عدد الأسرة"
              name="beds"
              rules={[{ required: true, type: 'number', min: 1, max: 10, message: 'يجب أن يكون بين 1 و 10' }]}
            >
              <InputNumber min={1} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="السعر بالدولار / ليلة"
              name="price_usd"
              rules={[{ required: true, type: 'number', min: 0, message: 'السعر بالدولار مطلوب' }]}
            >
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} addonAfter="$" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="السعر بالجنيه / ليلة"
              name="price_sdg"
              rules={[{ required: true, type: 'number', min: 0, message: 'السعر بالجنيه مطلوب' }]}
            >
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} addonAfter="ج.س" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="right" plain style={{ margin: '0 0 16px' }}>الموقع والتصنيف</Divider>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item label="الدور" name="floor_id" rules={[{ required: true, message: 'الرجاء اختيار الدور' }]}>
              <Select
                options={floors.map((f: any) => ({
                  value: String(f.id),
                  label: `الدور ${f.number}${f.name ? ` - ${f.name}` : ''}`,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="نوع الغرفة" name="room_type_id" rules={[{ required: true, message: 'الرجاء اختيار نوع الغرفة' }]}>
              <Select options={roomTypes.map((t: any) => ({ value: String(t.id), label: t.name }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="حالة الغرفة" name="room_status_id" rules={[{ required: true, message: 'الرجاء اختيار حالة الغرفة' }]}>
              <Select
                options={roomStatuses.map((s: any) => ({ value: String(s.id), label: `${s.name} (${s.code})` }))}
              />
            </Form.Item>
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/room-statuses')}>
              + إضافة حالة جديدة
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
