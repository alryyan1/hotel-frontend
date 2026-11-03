import { Modal, Button, Segmented, Tag, Alert, Space, Typography } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { Autocomplete, TextField } from '@mui/material'

const { Text } = Typography

interface CreateReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: any[]
  selectedRooms: any[]
  form: {
    customer_id: string
    currency: string
  }
  onFormChange: (form: { customer_id: string; currency: string }) => void
  onCreateReservation: () => void
  onOpenCustomerDialog: () => void
  loading: boolean
}

export default function CreateReservationDialog({
  open,
  onOpenChange,
  customers,
  selectedRooms,
  form,
  onFormChange,
  onCreateReservation,
  onOpenCustomerDialog,
  loading,
}: CreateReservationDialogProps) {
  const occupiedRooms = selectedRooms.filter((r: any) => r.is_occupied && r.current_reservation)

  const selectedCustomer = customers.find((c: any) => String(c.id) === String(form.customer_id)) || null

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="إنشاء حجز"
      width={500}
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>إلغاء</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={onCreateReservation}>
          حفظ
        </Button>,
      ]}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
        {occupiedRooms.length > 0 && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message="تحذير: بعض الغرف المختارة محجوزة حالياً"
            description={
              <div>
                <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                  {occupiedRooms.map((room: any) => (
                    <li key={room.id}>
                      <Text style={{ fontSize: 12 }}>
                        <strong>غرفة {room.number}</strong>: محجوزة حتى{' '}
                        {new Date(room.current_reservation.check_out_date).toLocaleDateString('ar-SA')}
                        {' '}(العميل: {room.current_reservation.customer_name})
                      </Text>
                    </li>
                  ))}
                </ul>
                <Text style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                  سيتم إنشاء الحجز، ولكن يرجى التأكد من أن الضيوف الحاليين سيغادرون في التاريخ المحدد.
                </Text>
              </div>
            }
          />
        )}

        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>العميل</Text>
          <Autocomplete
            options={customers}
            value={selectedCustomer}
            onChange={(_, value: any) => onFormChange({ ...form, customer_id: value ? String(value.id) : '' })}
            getOptionLabel={(c: any) => c.name || ''}
            isOptionEqualToValue={(a: any, b: any) => String(a.id) === String(b.id)}
            filterOptions={(options, { inputValue }) => {
              const q = inputValue.toLowerCase()
              return options.filter((c: any) => {
                const contacts = [c.contact_name_1, c.contact_name_2].filter(Boolean).join(' ')
                const text = [c.name, contacts, c.phone, c.email].filter(Boolean).join(' ').toLowerCase()
                return text.includes(q)
              })
            }}
            renderOption={(props, c: any) => {
              const contacts = [c.contact_name_1, c.contact_name_2].filter(Boolean).join(' • ')
              return (
                <li {...props} key={c.id}>
                  <div>
                    <div>{c.name}</div>
                    {c.type === 'company' && contacts && (
                      <Text type="secondary" style={{ fontSize: 12 }}>{contacts}</Text>
                    )}
                    {(c.phone || c.email) && (
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                        {c.phone || c.email}
                      </Text>
                    )}
                  </div>
                </li>
              )
            }}
            renderInput={(params) => (
              <TextField {...params} placeholder="اختر العميل" size="small" />
            )}
          />
        </div>

        <Button block onClick={onOpenCustomerDialog}>عميل جديد</Button>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>عملة الفاتورة</Text>
          <Segmented
            value={form.currency}
            onChange={(value) => onFormChange({ ...form, currency: value as string })}
            block
            options={[
              { label: 'جنيه سوداني (SDG)', value: 'SDG' },
              { label: 'دولار (USD)', value: 'USD' },
            ]}
          />
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            سيتم احتساب الفاتورة بالكامل بهذه العملة
          </Text>
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            الغرف المختارة ({selectedRooms.length})
          </Text>
          <Space wrap>
            {selectedRooms.map((r: any) => (
              <Tag key={r.id} color={r.is_occupied ? 'orange' : 'default'}>
                غرفة {r.number}{r.is_occupied ? ' (محجوزة)' : ''}
              </Tag>
            ))}
          </Space>
        </div>
      </Space>
    </Modal>
  )
}
