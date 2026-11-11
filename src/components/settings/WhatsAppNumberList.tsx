import { useEffect, useState } from 'react'
import { Input, Button, Tag, Space, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import apiClient from '@/api/axios'
import { toast } from 'sonner'

const { Text } = Typography

interface NotificationNumber {
  id: number
  event: string
  phone: string
  label: string | null
}

interface WhatsAppNumberListProps {
  event: 'confirmation' | 'cancellation' | 'cleaning' | 'arrivals_report' | 'departures_report'
  title: string
  description?: string
}

export default function WhatsAppNumberList({ event, title, description }: WhatsAppNumberListProps) {
  const [numbers, setNumbers] = useState<NotificationNumber[]>([])
  const [phone, setPhone] = useState('')
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let mounted = true
    apiClient
      .get('/settings/whatsapp-notification-numbers', { params: { event } })
      .then(({ data }) => {
        if (mounted) setNumbers(data)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [event])

  const handleAdd = async () => {
    if (!phone.trim()) return
    try {
      setAdding(true)
      const { data } = await apiClient.post('/settings/whatsapp-notification-numbers', {
        event,
        phone: phone.trim(),
        label: label.trim() || null,
      })
      setNumbers(prev => [...prev, data])
      setPhone('')
      setLabel('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في إضافة الرقم')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: number) => {
    const previous = numbers
    setNumbers(prev => prev.filter(n => n.id !== id))
    try {
      await apiClient.delete(`/settings/whatsapp-notification-numbers/${id}`)
    } catch (err: any) {
      setNumbers(previous)
      toast.error(err?.response?.data?.message || 'فشل في حذف الرقم')
    }
  }

  return (
    <div>
      <Text strong style={{ display: 'block' }}>{title}</Text>
      {description && (
        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
          {description}
        </Text>
      )}

      <Space wrap style={{ marginTop: 8, marginBottom: 8 }}>
        <Input
          placeholder="رقم الهاتف"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: 160 }}
          dir="ltr"
        />
        <Input
          placeholder="ملاحظة (اختياري)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{ width: 160 }}
        />
        <Button
          icon={<PlusOutlined />}
          loading={adding}
          disabled={!phone.trim()}
          onClick={handleAdd}
        >
          إضافة
        </Button>
      </Space>

      <div>
        {loading ? (
          <Text type="secondary" style={{ fontSize: 12 }}>جارٍ التحميل...</Text>
        ) : numbers.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 12 }}>لا توجد أرقام مضافة</Text>
        ) : (
          <Space wrap size={4}>
            {numbers.map((n) => (
              <Tag key={n.id} closable onClose={() => handleDelete(n.id)}>
                <span dir="ltr">{n.phone}</span>
                {n.label && <span style={{ color: 'rgba(0,0,0,0.45)' }}> ({n.label})</span>}
              </Tag>
            ))}
          </Space>
        )}
      </div>
    </div>
  )
}
