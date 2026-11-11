import { Modal, Button, Radio, Tag, Alert, Space, Typography, Divider, Flex } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { Autocomplete, TextField } from '@mui/material'
import { useEffect } from 'react'
import dayjs from 'dayjs'

const { Text } = Typography

interface CreateReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: any[]
  selectedRooms: any[]
  checkIn: string
  checkOut: string
  form: {
    customer_id: string
    currency: string
  }
  onFormChange: (form: { customer_id: string; currency: string }) => void
  onCreateReservation: () => void
  onOpenCustomerDialog: () => void
  loading: boolean
}

const formatAmount = (value: number): string =>
  value.toLocaleString('en-US', { maximumFractionDigits: 2 })

export default function CreateReservationDialog({
  open,
  onOpenChange,
  customers,
  selectedRooms,
  checkIn,
  checkOut,
  form,
  onFormChange,
  onCreateReservation,
  onOpenCustomerDialog,
  loading,
}: CreateReservationDialogProps) {
  const occupiedRooms = selectedRooms.filter((r: any) => r.is_occupied && r.current_reservation)

  const selectedCustomer = customers.find((c: any) => String(c.id) === String(form.customer_id)) || null

  const nights = Math.max(1, dayjs(checkOut).diff(dayjs(checkIn), 'day'))

  // Rooms without a USD price can only be billed in SDG.
  const usdAvailable = selectedRooms.every((r: any) => r.price_usd != null)
  const currency = usdAvailable ? form.currency : 'SDG'

  useEffect(() => {
    if (!usdAvailable && form.currency !== 'SDG') onFormChange({ ...form, currency: 'SDG' })
  }, [usdAvailable, form, onFormChange])

  const roomBreakdown = selectedRooms.map((r: any) => {
    const rate = currency === 'USD' ? Number(r.price_usd ?? 0) : Number(r.price_sdg ?? 0)
    // Always derive the total from the nights shown right above it, rather than
    // trusting the room's total_price_sdg/usd from the last availability search —
    // that snapshot goes stale (still reflecting the old date range) the moment
    // checkIn/checkOut changes without a fresh search, producing a total that
    // doesn't match the nights count displayed next to it.
    const total = rate * nights
    return { ...r, rate, total }
  })

  const grandTotal = roomBreakdown.reduce((sum, r) => sum + r.total, 0)

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="إنشاء حجز"
      width={520}
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
                      <Text  style={{ fontSize: 12 }}>{contacts}</Text>
                    )}
                    {(c.phone || c.email) && (
                      <Text  style={{ fontSize: 12, display: 'block' }}>
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

        {!usdAvailable ? (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>عملة الفاتورة</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              سيتم إنشاء الحجز بـ <strong>الجنيه السوداني (SDG)</strong> — لا يوجد سعر بالدولار لبعض الغرف المختارة
            </Text>
          </div>
        ) : (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>عملة الفاتورة</Text>
          <Radio.Group
            value={form.currency}
            onChange={(e) => onFormChange({ ...form, currency: e.target.value })}
            optionType="button"
            buttonStyle="solid"
            style={{ display: 'flex', width: '100%' }}
          >
            <Radio.Button value="SDG" style={{ flex: 1, textAlign: 'center' }}>
              جنيه سوداني (SDG)
            </Radio.Button>
            <Radio.Button value="USD" style={{ flex: 1, textAlign: 'center' }}>
              دولار (USD)
            </Radio.Button>
          </Radio.Group>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            العملة المختارة حالياً: <strong>{form.currency === 'USD' ? 'دولار (USD)' : 'جنيه سوداني (SDG)'}</strong> — سيتم احتساب الفاتورة بالكامل بهذه العملة
          </Text>
        </div>
        )}

        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            الغرف المختارة ({selectedRooms.length}) — {nights} ليلة
          </Text>
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8 }}>
            {roomBreakdown.map((r, idx) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderTop: idx === 0 ? undefined : '1px solid #f0f0f0',
                }}
              >
                <Space size={6}>
                  <Text strong style={{ fontSize: 13 }}>غرفة {r.number}</Text>
                  {r.is_occupied && <Tag color="orange" style={{ margin: 0 }}>محجوزة</Tag>}
                </Space>
                <div style={{ textAlign: 'left' }}>
                  <div dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                    <Text strong style={{ fontSize: 13 }}>
                      {formatAmount(r.total)} {form.currency}
                    </Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                    <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>{nights}</span> ليلة ×{' '}
                    <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                      {formatAmount(r.rate)} {form.currency}
                    </span>
                  </Text>
                </div>
              </div>
            ))}
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <Flex gap={8} justify="space-between">
            <Text strong>الإجمالي</Text>
            <Text strong dir="ltr" style={{ fontSize: 16, unicodeBidi: 'isolate' }}>
              {formatAmount(grandTotal)} {form.currency}
            </Text>
          </Flex>
        </div>
      </Space>
    </Modal>
  )
}
