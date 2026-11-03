import { Modal, Input, Select, Segmented, DatePicker, Button, Row, Col, Divider, Typography } from 'antd'
import {
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CalendarOutlined,
  BankOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

interface CreateCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerForm: {
    name: string
    phone: string
    national_id: string
    address: string
    date_of_birth: string
    gender: string
    type: string
    email?: string
    contact_name_1?: string
    contact_name_2?: string
  }
  onCustomerFormChange: (form: {
    name: string
    phone: string
    national_id: string
    address: string
    date_of_birth: string
    gender: string
    type: string
    email?: string
    contact_name_1?: string
    contact_name_2?: string
  }) => void
  onCreateCustomer: () => void
  loading: boolean
}

export default function CreateCustomerDialog({
  open,
  onOpenChange,
  customerForm,
  onCustomerFormChange,
  onCreateCustomer,
  loading,
}: CreateCustomerDialogProps) {
  const isCompany = customerForm.type === 'company'

  const handleClose = () => {
    if (!loading) onOpenChange(false)
  }

  const set = (patch: Partial<typeof customerForm>) =>
    onCustomerFormChange({ ...customerForm, ...patch })

  const handleEnterSubmit = () => {
    if (!loading && customerForm.name.trim()) onCreateCustomer()
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title="إضافة عميل جديد"
      width={640}
      mask={{ closable: !loading }}
      closable={!loading}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>إلغاء</Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          disabled={!customerForm.name.trim()}
          onClick={onCreateCustomer}
        >
          حفظ العميل
        </Button>,
      ]}
    >
      <Text type="secondary">يرجى ملء المعلومات التالية لإضافة عميل جديد إلى النظام</Text>

      <Divider titlePlacement="end" plain style={{ margin: '16px 0' }}>فئة العميل</Divider>
      <Segmented
        value={customerForm.type}
        onChange={(value) => set({ type: value as string })}
        block
        options={[
          { label: 'عميل عادي', value: 'individual', icon: <UserOutlined /> },
          { label: 'شركة', value: 'company', icon: <BankOutlined /> },
        ]}
      />

      <Divider titlePlacement="end" plain style={{ margin: '20px 0 16px' }}>
        {isCompany ? 'بيانات الشركة' : 'المعلومات الشخصية'}
      </Divider>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Input
            placeholder={isCompany ? 'اسم الشركة' : 'الاسم الكامل'}
            prefix={isCompany ? <BankOutlined /> : <UserOutlined />}
            value={customerForm.name}
            onChange={(e) => set({ name: e.target.value })}
            onPressEnter={handleEnterSubmit}
          />
        </Col>

        {isCompany && (
          <>
            <Col xs={24} sm={12}>
              <Input
                placeholder="اسم العميل 1"
                prefix={<UserOutlined />}
                value={customerForm.contact_name_1 || ''}
                onChange={(e) => set({ contact_name_1: e.target.value })}
                onPressEnter={handleEnterSubmit}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Input
                placeholder="اسم العميل 2"
                prefix={<UserOutlined />}
                value={customerForm.contact_name_2 || ''}
                onChange={(e) => set({ contact_name_2: e.target.value })}
                onPressEnter={handleEnterSubmit}
              />
            </Col>
          </>
        )}

        <Col xs={24} sm={12}>
          <Input
            placeholder="رقم الهاتف"
            prefix={<PhoneOutlined />}
            value={customerForm.phone}
            onChange={(e) => set({ phone: e.target.value })}
            onPressEnter={handleEnterSubmit}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Input
            placeholder={isCompany ? 'رقم السجل التجاري' : 'الرقم الوطني'}
            prefix={<IdcardOutlined />}
            value={customerForm.national_id}
            onChange={(e) => set({ national_id: e.target.value })}
            onPressEnter={handleEnterSubmit}
          />
        </Col>

        {isCompany && (
          <Col span={24}>
            <Input
              type="email"
              placeholder="البريد الالكتروني"
              value={customerForm.email || ''}
              onChange={(e) => set({ email: e.target.value })}
              onPressEnter={handleEnterSubmit}
            />
          </Col>
        )}
      </Row>

      {isCompany && (
        <>
          <Divider titlePlacement="end" plain style={{ margin: '20px 0 16px' }}>العنوان</Divider>
          <Input.TextArea
            placeholder="العنوان الكامل"
            value={customerForm.address}
            onChange={(e) => set({ address: e.target.value })}
            rows={3}
          />
        </>
      )}

      {!isCompany && (
        <>
          <Divider titlePlacement="end" plain style={{ margin: '20px 0 16px' }}>معلومات إضافية</Divider>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <DatePicker
                placeholder="تاريخ الميلاد"
                suffixIcon={<CalendarOutlined />}
                style={{ width: '100%' }}
                value={customerForm.date_of_birth ? dayjs(customerForm.date_of_birth) : null}
                onChange={(_, dateString) => set({ date_of_birth: (dateString as string) || '' })}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Select
                placeholder="النوع"
                style={{ width: '100%' }}
                value={customerForm.gender || undefined}
                onChange={(value) => set({ gender: value })}
                options={[
                  { value: 'male', label: 'ذكر' },
                  { value: 'female', label: 'أنثى' },
                ]}
              />
            </Col>
          </Row>
        </>
      )}

    </Modal>
  )
}
